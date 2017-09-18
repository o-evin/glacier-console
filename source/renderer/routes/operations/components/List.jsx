import chain from 'lodash';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ActionButton from '../../../controls/ActionButton';

import {Retrieval, Upload} from '../../../../contracts/entities';

import {
  UploadStatus,
  RetrievalStatus,
  RetrievalAction,
} from '../../../../contracts/enums';

export default class Operations extends PureComponent {

  static propTypes = {
    uploads: PropTypes.arrayOf(PropTypes.instanceOf(Upload)).isRequired,
    retrievals: PropTypes.arrayOf(PropTypes.instanceOf(Retrieval)).isRequired,
    onRestart: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
  }

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
    }),
  };

  select(name) {
    this.context.router.history.push('/vaults/' + name);
  }

  abortAll() {
    if(confirm('Are you sure you want to abort all operations?')) {
      const {uploads, retrievals} = this.props;
      return Promise.all(
        uploads.concat(retrievals).map(this.props.onRemove)
      );
    }
  }

  abortUploads(vaultName) {
    if(confirm('Are you sure you want to abort all uploads '
      + 'in this vault?')) {

      return Promise.all(
        this.props.uploads
          .filter(item => item.vaultName === vaultName)
          .map(this.props.onRemove)
      );
    }
  }

  abortRetrievals(vaultName) {
    if(confirm('Are you sure you want to abort all retrievals '
      + 'in this vault?')) {

      return Promise.all(
        this.props.retrievals
          .filter(item => item.vaultName === vaultName)
          .map(this.props.onRemove)
      );

    }
  }

  restartAll() {
    const {uploads, retrievals} = this.props;

    return Promise.all(
      uploads.filter(item => item.status === UploadStatus.ERROR)
        .concat(
          retrievals.filter(item => item.status === RetrievalStatus.ERROR)
        )
        .map(this.props.onRestart)
    );
  }

  restart(operations) {
    return Promise.all(
      operations.errors.map(this.props.onRestart)
    );
  }

  renderPendingUpload(vaultName, idx) {
    return (
      <li key={idx} className="list-group-item p-1">
        <div className="content w-100 d-flex">
          <div className="description p-2 align-self-center mr-auto"
            onClick={this.select.bind(this, vaultName)} role="button">
            <i className="fa fa-upload mr-2" />
            Uploading to {vaultName}
          </div>
          <div>
            <div className="p-2">
              <i className="fa fa-refresh fa-spin fa-lg text-primary"/>
            </div>
          </div>
        </div>
      </li>
    );
  }

  renderVaultUploads(entry, idx) {
    const [vaultName, operations] = entry;
    const {errors, processing, finished} = operations;

    const totalCount = errors.length + processing.length + finished.length;

    if(totalCount === 0) {
      return this.renderPendingUpload(vaultName, idx);
    }

    return (
      <li key={idx} className="list-group-item p-1">
        <div className="content w-100 d-flex">
          <div className="description p-2 align-self-center mr-auto"
            onClick={this.select.bind(this, vaultName)} role="button">
            <i className="fa fa-upload mr-2" />
            Uploading to {vaultName}
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
          <div>
            <ActionButton hidden={errors.length === 0} title="Retry"
              className="btn btn-small btn-secondary ml-2"
              onClick={this.restart.bind(this, operations)}>
              <i className="fa fa-refresh text-muted" />
            </ActionButton>
            <ActionButton title="Abort"
              className="btn btn-small btn-secondary ml-2"
              onClick={this.abortUploads.bind(this, vaultName)}>
              <i className="fa fa-stop text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

  renderPendingRetrievals(vaultName, idx) {
    return (
      <li key={idx} className="list-group-item p-1">
        <div className="content w-100 d-flex">
          <div className="description p-2 align-self-center mr-auto"
            onClick={this.select.bind(this, vaultName)} role="button">
            <i className="fa fa-download mr-2" />
            Retrieving from {vaultName}
          </div>
          <div>
            <div className="p-2">
              <i className="fa fa-refresh fa-spin fa-lg text-primary"/>
            </div>
          </div>
        </div>
      </li>
    );
  }

  renderVaultRetrievals(entry, idx) {
    const [vaultName, operations] = entry;
    const {errors, preparing, processing, inventory, finished} = operations;

    const totalCount = errors.length + preparing.length + processing.length +
      inventory.length + finished.length;

    if(totalCount === 0) {
      this.renderPendingRetrievals(vaultName, idx);
    }

    return (
      <li key={idx} className="list-group-item p-1">
        <div className="content w-100 d-flex">
          <div className="description p-2 align-self-center mr-auto"
            onClick={this.select.bind(this, vaultName)} role="button">
            <i className="fa fa-download mr-2" />
            Retrieving from {vaultName}
            <span hidden={inventory.length === 0}
              className="badge badge-info badge-pill ml-2"
              title="Updating inventory...">
              <i className="fa fa-list-ol" />
            </span>
            <span hidden={errors.length === 0} title="Failed operations."
              className="badge badge-danger badge-pill ml-2">
              {errors.length}
            </span>
            <span hidden={preparing.length === 0}
              className="badge badge-warning badge-pill ml-2"
              title="Preparing a retrieval...">
              {preparing.length}
            </span>
            <span hidden={processing.length === 0}
              className="badge badge-primary badge-pill ml-2"
              title="Transferring the data...">
              {processing.length}
            </span>
            <span hidden={finished.length === 0}
              className="badge badge-success badge-pill ml-2"
              title={'Download finished.'}>
              {finished.length}
            </span>
          </div>
          <div>
            <ActionButton hidden={errors.length === 0} title="Retry"
              className="btn btn-small btn-secondary ml-2"
              onClick={this.restart.bind(this, operations)}>
              <i className="fa fa-refresh text-muted" />
            </ActionButton>
            <ActionButton title="Abort"
              className="btn btn-small btn-secondary ml-2"
              onClick={this.abortRetrievals.bind(this, vaultName)}>
              <i className="fa fa-stop text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

  render() {

    const uploads = chain(this.props.uploads)
      .groupBy(item => item.vaultName)
      .map((value, key) => ([key,
        value.reduce((res, item) => {

          //TODO: refactor this

          if(item.status === UploadStatus.ERROR) {
            res.errors.push(item);
          } else if(item.status === UploadStatus.PROCESSING) {
            res.processing.push(item);
          } else if(item.status === UploadStatus.DONE) {
            res.finished.push(item);
          }
          if(!res.lastUpdate || item.createdAt > res.lastUpdate) {
            res.lastUpdate = item.createdAt;
          }
          return res;
        }, {
          errors: [],
          processing: [],
          finished: [],
          lastUpdate: null,
          type: Upload,
        }),
      ]))
      .value();

    const retrievals = chain(this.props.retrievals)
      .groupBy(item => item.vaultName)
      .map((value, key) => ([key,
        value.reduce((res, item) => {

          if(item.action === RetrievalAction.INVENTORY) {
            res.inventory.push(item);
          } else if(item.status === RetrievalStatus.PENDING) {
            res.preparing.push(item);
          } 

          if(item.status === RetrievalStatus.ERROR) {
            res.errors.push(item);
          } else if(item.status === RetrievalStatus.PROCESSING) {
            res.processing.push(item);
          } else if(item.status === RetrievalStatus.DONE) {
            res.finished.push(item);
          }

          if(!res.lastUpdate || item.createdAt > res.lastUpdate) {
            res.lastUpdate = item.createdAt;
          }

          return res;
        }, {
          errors: [],
          preparing: [],
          processing: [],
          finished: [],
          inventory: [],
          lastUpdate: null,
          type: Retrieval,
        }),
      ]))
      .value();

    const list = uploads.concat(retrievals).sort(
      ([key1, a], [key2, b]) => a.lastUpdate - b.lastUpdate
    );

    const errorCount = list.reduce((prev, [, value]) => {
      return prev + value.errors.length;
    }, 0);


    return(
      <div className="container-fluid pt-3">
        <h4 className="d-flex">
          <span className="align-self-center mr-auto p-2">
            Operations
          </span>
          <div>
            <ActionButton hidden={errorCount === 0}
              className="btn btn-secondary mr-2"
              onClick={this.restartAll.bind(this)}>
              <i className="fa fa-refresh mr-2 text-muted" />
              Retry
              <span className="badge badge-danger badge-pill ml-2">
                {errorCount}
              </span>
            </ActionButton>
            <ActionButton hidden={list.length === 0}
              className="btn btn-secondary"
              onClick={this.abortAll.bind(this)} >
              <i className="fa fa-stop mr-2 text-muted" />
              Cancel All
            </ActionButton>
          </div>
        </h4>
        <ul className="list-group list-progress operations-list mt-3">
          {
            (list && list.length > 0) ?
              list.map((item, idx) => {
                const [, value] = item;
                return value.type === Upload ?
                  this.renderVaultUploads(item, idx) :
                  this.renderVaultRetrievals(item, idx);
              }) :
              <li className="list-group-item">No items found.</li>
          }
        </ul>
      </div>

    );
  }
}
