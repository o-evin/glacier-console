import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ActionButton from '../../../controls/ActionButton';

import {groupBy} from '../../../helpers';
import {Upload} from '../../../../contracts/entities';

import {
  UploadStatus,
} from '../../../../contracts/enums';

export default class Uploads extends PureComponent {

  static propTypes = {
    vaultName: PropTypes.string.isRequired,
    uploads: PropTypes.arrayOf(PropTypes.instanceOf(Upload)).isRequired,
    onRestart: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  abort() {
    if(confirm('Are you sure you want to abort all uploads in this vault?')) {
      return Promise.all(
        this.props.uploads.map(this.props.onRemove)
      );
    }
  }

  restart() {
    return Promise.all(
      this.props.uploads.filter(item => item.status === UploadStatus.ERROR)
        .map(this.props.onRestart)
    );
  }

  select() {
    return this.props.onSelect(this.props.vaultName);
  }

  render() {

    const {vaultName, uploads} = this.props;

    const groups = groupBy(uploads, {status: UploadStatus});

    const errors = groups.get(UploadStatus.ERROR);
    const processing = groups.get(UploadStatus.PROCESSING);
    const finished = groups.get(UploadStatus.DONE);

    const totalSize = uploads.reduce((sum, i) => sum + i.archiveSize, 0);
    const finishedSize = uploads.reduce((sum, i) => sum + i.finishedSize, 0);
    const completion = +((finishedSize / totalSize) * 100).toFixed(2);

    return (
      <li className="list-group-item p-1">
        <div className="progress w-100">
          <div className="progress-bar h-100 list-group-item-info"
            style={{width: completion + '%'}}>
          </div>
        </div>
        <div className="content w-100 d-flex align-items-center text-nowrap">
          <div className="text-truncate px-2 py-1 w-100"
            onClick={this.select.bind(this)} role="button">
            <i className="fa fa-upload mr-2" />
            <span>Uploading to {vaultName}</span>
            <span hidden={errors.length === 0} title="Failed operations."
              className="badge badge-danger badge-pill ml-2">
              {errors.length}
            </span>
            <span hidden={processing.length === 0}
              className="badge badge-primary badge-pill ml-2"
              title="Transferring the data...">
              {processing.length}
            </span>
            <span hidden={finished.length === 0}
              className="badge badge-success badge-pill ml-2"
              title={'Pending inventory. Updated approximately once a day.'}>
              {finished.length}
            </span>
          </div>
          <div className="text-nowrap d-flex align-items-center">
            <span className="text-primary">
              {completion + '%'}
            </span>
            <ActionButton hidden={errors.length === 0} title="Retry"
              className="btn btn-small btn-secondary ml-2"
              onClick={this.restart.bind(this)}>
              <i className="fa fa-refresh" />
            </ActionButton>
            <ActionButton title="Abort"
              className="btn btn-small btn-secondary ml-2"
              onClick={this.abort.bind(this)}>
              <i className="fa fa-stop" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }
}
