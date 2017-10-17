import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import {groupBy} from '../../../helpers';

import {
  Archive,
  Upload,
  Retrieval,
} from '../../../../contracts/entities';

import {
  UploadStatus,
  RetrievalStatus,
  RetrievalTier,
} from '../../../../contracts/enums';

import ActionButton from '../../../controls/ActionButton';

import {
  Dropdown,
  DropdownMenu,
  DropdownToggle,
} from '../../../controls/Dropdown';

export default class Actions extends PureComponent {

  static propTypes = {
    archives: PropTypes.arrayOf(PropTypes.instanceOf(Archive)),
    uploads: PropTypes.arrayOf(PropTypes.instanceOf(Upload)),
    retrievals: PropTypes.arrayOf(PropTypes.instanceOf(Retrieval)),
    onUploadFile: PropTypes.func.isRequired,
    onUploadDirectory: PropTypes.func.isRequired,
    onRemoveUpload: PropTypes.func.isRequired,
    onRestartUpload: PropTypes.func.isRequired,
    onRetrieve: PropTypes.func.isRequired,
    onRemoveRetrieval: PropTypes.func.isRequired,
    onRestartRetrieval: PropTypes.func.isRequired,
    onDisplay: PropTypes.func.isRequired,
  }


  retryUploads(uploads) {
    return Promise.all(uploads.map(this.props.onRestartUpload));
  }

  restartUploads(errors) {
    if(confirm('Are you sure you want to restart all erroneous uploads ' +
    + ' from the beginning?')) {
      return Promise.all(errors.map(item =>
        this.props.onRestartUpload(item, true)
      ));
    }
  }

  removeUploads(uploads) {
    if(confirm('Are you sure you want to remove pending archives?')) {
      return Promise.all(uploads.map(this.props.onRemoveUpload));
    }
  }

  cancelUploads(uploads) {
    if(confirm('Are you sure you want to stop all processing uploads?')) {
      return Promise.all(uploads.map(this.props.onRemoveUpload));
    }
  }

  cancelAllUploads() {
    if(confirm('Are you sure you want to cancel all upload operations?')) {
      return Promise.all(this.props.uploads.map(this.props.onRemoveUpload));
    }
  }

  retryRetrievals(errors) {
    return Promise.all(errors.map(this.props.onRestartRetrieval));
  }

  restartRetrievals(errors) {
    if(confirm('Are you sure you want to restart all erroneous retrievals ' +
      'from the beginning?')) {
      return Promise.all(errors.map(item =>
        this.props.onRestartRetrieval(item, true)
      ));
    }
  }

  cancelRetrievals(retrievals) {
    if(confirm('Are you sure you want to cancel all pending retrievals?')) {
      return Promise.all(retrievals.map(this.props.onRemoveRetrieval));
    }
  }

  stopRetrievals(retrievals) {
    if(confirm('Are you sure you want to stop all processing retrievals?')) {
      return Promise.all(retrievals.map(this.props.onRemoveRetrieval));
    }
  }

  cancelAllRetrievals() {
    if(confirm('Are you sure you want to cancel all retrieval operations?')) {
      return Promise.all(
        this.props.retrievals.map(this.props.onRemoveRetrieval)
      );
    }
  }

  retrieveAll(tier) {
    const {archives, retrievals} = this.props;

    const entries = archives.filter(
      item => !retrievals.some(entry => entry.archiveId === item.id)
    );

    return Promise.all(
      entries.map(archive => this.props.onRetrieve({archive, tier}))
    );
  }

  renderRetrievalActions() {

    const retrievals = groupBy(this.props.retrievals,
      {status: RetrievalStatus});

    const errors = retrievals.get(RetrievalStatus.ERROR);
    const finished = retrievals.get(RetrievalStatus.DONE);
    const pending = retrievals.get(RetrievalStatus.PENDING);
    const processing = retrievals.get(RetrievalStatus.PROCESSING);

    const totalLength = this.props.retrievals.length;

    return (
      <span>
        <ActionButton hidden={finished.length === 0}
          className="btn btn-secondary"
          onClick={this.props.onDisplay.bind(null, finished)}>
          <i className="fa fa-folder-open mr-2" />
          Open
          <span className="badge badge-success badge-pill ml-2">
            {finished.length}
          </span>
        </ActionButton>
        <Dropdown className="dropdown btn-group ml-2">
          <DropdownToggle className="btn btn-secondary dropdown-toggle">
            <i className="fa fa-download mr-2" />
            Retrieve
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu dropdown-menu-right">
            <h6 className="dropdown-header px-3 py-1">Archives</h6>
            <button className="btn btn-link dropdown-item"
              onClick={this.retrieveAll.bind(this, RetrievalTier.STANDARD)}>
              Standard
            </button>
            <button className="btn btn-link dropdown-item"
              onClick={this.retrieveAll.bind(this, RetrievalTier.EXPEDITED)}>
              Expedited
            </button>
            <button className="btn btn-link dropdown-item"
              onClick={this.retrieveAll.bind(this, RetrievalTier.BULK)
              }>
              Bulk
            </button>
            <div className="dropdown-divider" />
            <h6 className="dropdown-header px-3 py-1">Operations</h6>
            <button disabled={pending.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.cancelRetrievals.bind(this, pending)}>
              <span className="badge badge-warning badge-pill mr-2">
                {pending.length}
              </span>
              Cancel Pending
            </button>
            <button disabled={processing.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.stopRetrievals.bind(this, processing)}>
              <span className="badge badge-primary badge-pill mr-2">
                {processing.length}
              </span>
              Stop Retrieval
            </button>
            <button disabled={errors.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.retryRetrievals.bind(this, errors)}>
              <span className="badge badge-danger badge-pill mr-2">
                {errors.length}
              </span>
              Retry Retrieval
            </button>
            <button disabled={errors.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.restartRetrievals.bind(this, errors)}>
              <span className="badge badge-danger badge-pill mr-2">
                {errors.length}
              </span>
              Start Over
            </button>
            <button disabled={totalLength === 0}
              className="btn btn-link dropdown-item"
              onClick={this.cancelAllRetrievals.bind(this)}>
              <span className="badge badge-dark badge-pill mr-2">
                {totalLength}
              </span>
              Cancel All
            </button>
          </DropdownMenu>
        </Dropdown>
      </span>
    );
  }

  renderUploadActions() {
    const uploads = groupBy(this.props.uploads, {status: RetrievalStatus});

    const errors = uploads.get(UploadStatus.ERROR);
    const finished = uploads.get(UploadStatus.DONE);
    const processing = uploads.get(UploadStatus.PROCESSING);

    const totalLength = this.props.uploads.length;

    return (
      <Dropdown className="dropdown btn-group ml-2">
        <DropdownToggle className="btn btn-secondary dropdown-toggle">
          <i className="fa fa-plus mr-2" />
          Upload
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu dropdown-menu-right">
          <h6 className="dropdown-header px-3 py-1">New</h6>
          <button className="btn btn-link dropdown-item"
            onClick={this.props.onUploadFile}>
            File
          </button>
          <button className="btn btn-link dropdown-item"
            onClick={this.props.onUploadDirectory}>
            Directory
          </button>
          <div className="dropdown-divider" />
          <h6 className="dropdown-header px-3 py-1">Operations</h6>
          <button disabled={finished.length === 0}
            className="btn btn-link dropdown-item"
            onClick={this.removeUploads.bind(this, finished)}>
            <span className="badge badge-success badge-pill mr-2">
              {finished.length}
            </span>
            Remove Pending
          </button>
          <button disabled={processing.length === 0}
            className="btn btn-link dropdown-item"
            onClick={this.cancelUploads.bind(this, processing)}>
            <span className="badge badge-primary badge-pill mr-2">
              {processing.length}
            </span>
            Stop Upload
          </button>
          <button disabled={errors.length === 0}
            className="btn btn-link dropdown-item"
            onClick={this.retryUploads.bind(this, errors)}>
            <span className="badge badge-danger badge-pill mr-2">
              {errors.length}
            </span>
            Retry Upload
          </button>
          <button disabled={errors.length === 0}
            className="btn btn-link dropdown-item"
            onClick={this.restartUploads.bind(this, errors)}>
            <span className="badge badge-danger badge-pill mr-2">
              {errors.length}
            </span>
            Start Over
          </button>
          <button disabled={totalLength === 0}
            className="btn btn-link dropdown-item"
            onClick={this.cancelAllUploads.bind(this)}>
            <span className="badge badge-dark badge-pill mr-2">
              {totalLength}
            </span>
            Cancel All
          </button>
        </DropdownMenu>
      </Dropdown>
    );
  }

  render() {
    return (
      <div className="ml-auto text-nowrap">
        {this.renderRetrievalActions()}
        {this.renderUploadActions()}
      </div>
    );
  }

}
