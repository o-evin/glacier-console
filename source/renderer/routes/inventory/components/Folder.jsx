import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import {Archive, Retrieval, Upload} from '../../../../contracts/entities';

import {
  UploadStatus,
  RetrievalStatus,
} from '../../../../contracts/enums';


export default class ViewFolder extends PureComponent {

  static propTypes = {
    name: PropTypes.string.isRequired,
    uploads: PropTypes.arrayOf(PropTypes.instanceOf(Upload)).isRequired,
    archives: PropTypes.arrayOf(PropTypes.instanceOf(Archive)).isRequired,
    retrievals: PropTypes.arrayOf(PropTypes.instanceOf(Retrieval)).isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  groupBy(array, criterion) {
    const [key] = Object.keys(criterion);
    const values = Object.values(criterion[key]);

    const group = new Map(values.map(item => [item, []]));

    return array.reduce((target, value) => {
      target.get(value[key]).push(value);
      return target;
    }, group);
  }

  renderStats({uploads, retrievals}) {

    const errorsCount = uploads.get(UploadStatus.ERROR).length +
      retrievals.get(RetrievalStatus.ERROR).length;

    const finishedCount = uploads.get(UploadStatus.DONE).length +
      retrievals.get(RetrievalStatus.DONE).length;

    const processingCount = uploads.get(UploadStatus.PROCESSING).length +
      retrievals.get(RetrievalStatus.PROCESSING).length;

    const pendingCount = retrievals.get(RetrievalStatus.PENDING).length;

    return (
      <span className="pr-2">
        <span hidden={errorsCount === 0} title="Failed operations."
          className="badge badge-danger badge-pill ml-2">
          {errorsCount}
        </span>
        <span hidden={pendingCount === 0}
          className="badge badge-warning badge-pill ml-2"
          title="Preparing a retrieval...">
          {pendingCount}
        </span>
        <span hidden={processingCount === 0}
          title="Transferring the data."
          className="badge badge-primary badge-pill ml-2">
          {processingCount}
        </span>
        <span hidden={finishedCount === 0}
          className="badge badge-success badge-pill ml-2"
          title={'Pending inventory. Updated approximately ' +
            'once a day.'}>
          {finishedCount}
        </span>
      </span>
    );

  }

  render() {

    const {name} = this.props;

    const uploads = this.groupBy(
      this.props.uploads, {status: UploadStatus}
    );

    const retrievals = this.groupBy(
      this.props.retrievals, {status: RetrievalStatus}
    );

    return(
      <li className="list-group-item p-1" >
        <div className="content w-100 align-items-center d-flex">
          <i className="fa fa-folder-o text-muded fa-2x ml-2" />
          <div title={name} role="button"
            onClick={this.props.onSelect.bind(null, name)}
            className="description p-2 mr-auto">
            {name}
          </div>
          <div className="actions">
            {this.renderStats({uploads, retrievals})}
          </div>
        </div>
      </li>
    );
  }
}
