import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import {groupBy} from '../../../helpers';
import {Archive, Retrieval, Upload} from '../../../../contracts/entities';

import {
  UploadStatus,
  RetrievalStatus,
} from '../../../../contracts/enums';


export default class ViewSummary extends PureComponent {

  static propTypes = {
    uploads: PropTypes.arrayOf(PropTypes.instanceOf(Upload)).isRequired,
    archives: PropTypes.arrayOf(PropTypes.instanceOf(Archive)).isRequired,
    retrievals: PropTypes.arrayOf(PropTypes.instanceOf(Retrieval)).isRequired,
    inventory: PropTypes.instanceOf(Retrieval),
  }

  render() {

    const uploads = groupBy(this.props.uploads, {status: UploadStatus});
    const retrievals = groupBy(this.props.retrievals,
      {status: RetrievalStatus});

    const errorsCount = uploads.get(UploadStatus.ERROR).length +
      retrievals.get(RetrievalStatus.ERROR).length;

    const finishedCount = uploads.get(UploadStatus.DONE).length +
      retrievals.get(RetrievalStatus.DONE).length;

    const processingCount = uploads.get(UploadStatus.PROCESSING).length +
      retrievals.get(RetrievalStatus.PROCESSING).length;

    const pendingCount = retrievals.get(RetrievalStatus.PENDING).length;

    return (
      <span className="pr-2">
        <span hidden={errorsCount === 0} title="Failed"
          className="badge badge-danger badge-pill ml-2">
          {errorsCount}
        </span>
        <span hidden={pendingCount === 0}
          className="badge badge-warning badge-pill ml-2"
          title="Remote pending">
          {pendingCount}
        </span>
        <span hidden={processingCount === 0}
          title="Ongoing"
          className="badge badge-primary badge-pill ml-2">
          {processingCount}
        </span>
        <span hidden={finishedCount === 0}
          className="badge badge-success badge-pill ml-2"
          title={'Finished'}>
          {finishedCount}
        </span>
      </span>
    );
  }

}
