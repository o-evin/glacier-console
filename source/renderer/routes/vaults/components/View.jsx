import bytes from 'bytes';
import moment from 'moment';
import plur from 'pluralize';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Link} from 'react-router-dom';


import {
  Vault,
  Archive,
  Inventory,
  Upload,
  Retrieval,
} from '../../../../contracts/entities';

import {
  UploadStatus,
  RetrievalStatus,
  RetrievalTier,
} from '../../../../contracts/enums';

import {
  Dropdown,
  DropdownMenu,
  DropdownToggle,
} from '../../../controls/Dropdown';

import Breadcrumb from './Breadcrumb';
import ActionButton from '../../../controls/ActionButton';

export default class ViewVault extends PureComponent {

  static propTypes = {
    vault: PropTypes.instanceOf(Vault).isRequired,
    archives: PropTypes.arrayOf(PropTypes.instanceOf(Archive)),
    uploads: PropTypes.arrayOf(PropTypes.instanceOf(Upload)),
    retrievals: PropTypes.arrayOf(PropTypes.instanceOf(Retrieval)),
    inventory: PropTypes.instanceOf(Inventory),
    inventoryRetrieval: PropTypes.instanceOf(Retrieval),
    onRemove: PropTypes.func.isRequired,
    onRetrieve: PropTypes.func.isRequired,
    onRestartUpload: PropTypes.func.isRequired,
    onRemoveUpload: PropTypes.func.isRequired,
    onRestartRetrieval: PropTypes.func.isRequired,
    onRemoveRetrieval: PropTypes.func.isRequired,
    onShowRetrievals: PropTypes.func.isRequired,
    onUploadFiles: PropTypes.func.isRequired,
    onUploadDirectory: PropTypes.func.isRequired,
    onRequestInventory: PropTypes.func.isRequired,
    onCancelInventory: PropTypes.func.isRequired,
  }

  removeVault() {
    if(confirm('Are you sure you want to permanently delete this vault ' +
      'and all its content?')) {
      return this.props.onRemove();
    }
  }

  restartUploads(uploads) {
    return Promise.all(uploads.map(this.props.onRestartUpload));
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

  cancelAllUploads(uploads) {
    if(confirm('Are you sure you want to cancel all upload operations?')) {

      const uploads = this.props.uploads.filter(item =>
        item.status !== RetrievalStatus.HOLD
      );

      return Promise.all(uploads.map(this.props.onRemoveUpload));
    }
  }

  restartRetrievals(retrievals) {
    return Promise.all(retrievals.map(this.props.onRestartRetrieval));
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
      const retrievals = this.props.retrievals.filter(item =>
        item.status !== RetrievalStatus.HOLD
      );

      return Promise.all(retrievals.map(this.props.onRemoveRetrieval));
    }
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

  renderVaultDetails() {
    const {inventory, vault} = this.props;

    const {
      createdAt,
      sizeInBytes,
      numberOfArchives,
      lastInventoryDate,
    } = vault;

    return (
      <div>
        <span>
          <span className="text-muted">Created on </span>
          {moment(createdAt).format('D MMM, YYYY HH:mm')}
        </span>
        { lastInventoryDate &&
          <span>
            <span className="text-muted">. Inventory on </span>
            <i className="fa fa-info-circle text-muted mr-2"
              title={'Remote inventory is updated approximately ' +
              'once a day.'}
            />
            {moment(lastInventoryDate).format('D MMM, YYYY HH:mm')}
            <span className="text-muted"> remote</span>
            { inventory &&
              <span>
                <span className="text-muted"> / </span>
                {moment(inventory.createdAt).format('D MMM, YYYY HH:mm')}
                <span className="text-muted"> local</span>
              </span>
            }
          </span>
        }
        { !!sizeInBytes &&
          <span>
            <span className="text-muted">, of </span>
            {bytes(sizeInBytes)}
            <span className="text-muted"> in </span>
            {plur('archive', numberOfArchives, true)}
          </span>
        }
        <span className="text-muted">.</span>
      </div>
    );
  }

  renderInventoryStats({uploads, retrievals, inventoryRetrieval}) {

    const {inventory} = this.props;

    const errorsCount = uploads.get(UploadStatus.ERROR).length +
      retrievals.get(RetrievalStatus.ERROR).length;

    const finishedCount = uploads.get(UploadStatus.DONE).length +
      retrievals.get(RetrievalStatus.DONE).length;

    const processingCount = uploads.get(UploadStatus.PROCESSING).length +
      retrievals.get(RetrievalStatus.PROCESSING).length;

    const pendingCount = retrievals.get(RetrievalStatus.PENDING).length;

    return (
      <span>
        { inventoryRetrieval &&
          <span className="badge badge-info badge-pill ml-2"
            title={
              (inventory ? (
                'Last updated on ' + moment(inventory.createdAt)
                  .format('D MMM, YYYY HH:mm') + '\n\n') : ''
              ) +
              'Inventory update is currently in progress. ' +
              'That process may take up to 24 hours.'
            }>
            <i className="fa fa-list-ol" />
          </span>
        }
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

  renderInventoryActions({uploads, retrievals, inventoryRetrieval}) {
    const {vault} = this.props;

    const uploadErrors = uploads.get(UploadStatus.ERROR);
    const uploadDones = uploads.get(UploadStatus.DONE);
    const uploadProcessings = uploads.get(UploadStatus.PROCESSING);

    const uploadsCount = this.props.uploads.filter(
      item => item.status !== UploadStatus.HOLD
    ).length;

    const retrievalErrors = retrievals.get(RetrievalStatus.ERROR);
    const retrievalDones = retrievals.get(RetrievalStatus.DONE);
    const retrievalPendings = retrievals.get(RetrievalStatus.PENDING);
    const retrievalProcessings = retrievals.get(RetrievalStatus.PROCESSING);

    const retrievalsCount = this.props.retrievals.filter(item =>
      item.status !== RetrievalStatus.HOLD
    ).length;

    return (
      <div>
        <Dropdown className="dropdown btn-group ml-2">
          <DropdownToggle className="btn btn-secondary dropdown-toggle">
            <i className="fa fa-download text-muted mr-2" />
            Retrieve
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu dropdown-menu-right">
            <h6 className="dropdown-header px-3 py-1">Archives</h6>
            <button className="btn btn-link dropdown-item"
              onClick={this.props.onRetrieve
                .bind(null, RetrievalTier.STANDARD)
              }>
              Standard
            </button>
            <button className="btn btn-link dropdown-item"
              onClick={this.props.onRetrieve
                .bind(null, RetrievalTier.EXPEDITED)
              }>
              Expedited
            </button>
            <button className="btn btn-link dropdown-item"
              onClick={this.props.onRetrieve
                .bind(null, RetrievalTier.BULK)
              }>
              Bulk
            </button>
            <div className="dropdown-divider" />
            <h6 className="dropdown-header px-3 py-1">Inventory</h6>
            {vault.lastInventoryDate ?
              (inventoryRetrieval ?
                <button className="btn btn-link dropdown-item" onClick={
                  this.props.onCancelInventory.bind(null, inventoryRetrieval)}>
                  <i className="fa fa-refresh fa-spin mr-2" />
                  Stop processing
                </button> :
                <button className="btn btn-link dropdown-item"
                  onClick={this.props.onRequestInventory}>
                  Synchronize
                </button>
              ) :
              <div className="dropdown-item disabled">Not available</div>
            }
            <div className="dropdown-divider" />
            <h6 className="dropdown-header px-3 py-1">Operations</h6>
            <button disabled={retrievalDones.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.props.onShowRetrievals.bind(null, retrievalDones)}>
              <span className="badge badge-success badge-pill mr-2">
                {retrievalDones.length}
              </span>
              Show all downloads
            </button>
            <button disabled={retrievalPendings.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.cancelRetrievals.bind(this, retrievalPendings)}>
              <span className="badge badge-warning badge-pill mr-2">
                {retrievalPendings.length}
              </span>
              Cancel pending
            </button>
            <button disabled={retrievalProcessings.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.stopRetrievals.bind(this, retrievalProcessings)}>
              <span className="badge badge-primary badge-pill mr-2">
                {retrievalProcessings.length}
              </span>
              Stop processing
            </button>
            <button disabled={retrievalErrors.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.restartRetrievals.bind(this, retrievalErrors)}>
              <span className="badge badge-danger badge-pill mr-2">
                {retrievalErrors.length}
              </span>
              Retry retrieval
            </button>
            <button disabled={retrievalsCount === 0}
              className="btn btn-link dropdown-item"
              onClick={this.cancelAllRetrievals.bind(this)}>
              <span className="badge badge-default badge-pill mr-2">
                {retrievalsCount}
              </span>
              Cancel all operations
            </button>
          </DropdownMenu>
        </Dropdown>

        <Dropdown className="dropdown btn-group ml-2">
          <DropdownToggle className="btn btn-secondary dropdown-toggle">
            <i className="fa fa-plus text-muted mr-2" />
            Upload
          </DropdownToggle>
          <DropdownMenu className="dropdown-menu dropdown-menu-right">
            <h6 className="dropdown-header px-3 py-1">New</h6>
            <button className="btn btn-link dropdown-item"
              onClick={this.props.onUploadFiles}>
              File
            </button>
            <button className="btn btn-link dropdown-item"
              onClick={this.props.onUploadDirectory}>
              Directory
            </button>
            <div className="dropdown-divider" />
            <h6 className="dropdown-header px-3 py-1">Operations</h6>
            <button disabled={uploadDones.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.removeUploads.bind(this, uploadDones)}>
              <span className="badge badge-success badge-pill mr-2">
                {uploadDones.length}
              </span>
              Remove pending
            </button>
            <button disabled={uploadProcessings.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.cancelUploads.bind(this, uploadProcessings)}>
              <span className="badge badge-primary badge-pill mr-2">
                {uploadProcessings.length}
              </span>
              Stop processing
            </button>
            <button disabled={uploadErrors.length === 0}
              className="btn btn-link dropdown-item"
              onClick={this.restartUploads.bind(this, uploadErrors)}>
              <span className="badge badge-danger badge-pill mr-2">
                {uploadErrors.length}
              </span>
              Retry upload
            </button>
            <button disabled={uploadsCount === 0}
              className="btn btn-link dropdown-item"
              onClick={this.cancelAllUploads.bind(this)}>
              <span className="badge badge-default badge-pill mr-2">
                {uploadsCount}
              </span>
              Cancel all operations
            </button>
          </DropdownMenu>
        </Dropdown>
      </div>
    );
  }

  render() {
    const {vault, inventoryRetrieval} = this.props;

    const uploads = this.groupBy(
      this.props.uploads, {status: UploadStatus}
    );

    const retrievals = this.groupBy(
      this.props.retrievals, {status: RetrievalStatus}
    );

    const params = {uploads, retrievals, inventoryRetrieval};

    return (
      <div>
        <div className="card mt-3">
          <h4 className="card-header d-flex">
            <span className="align-self-center mr-auto">{vault.name}</span>
            <ActionButton className="btn btn-secondary"
              onClick={this.removeVault.bind(this)}>
              <i className="fa fa-trash text-muted" />
            </ActionButton>
          </h4>
          <div className="card-block">
            <div className="card-text">
              {this.renderVaultDetails()}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <h4 className="d-flex align-items-center mb-0">
            <span className="mr-auto">
              <Link to={`/vaults/${vault.name}/`} className="text-muted">
                Inventory
              </Link>
              <Breadcrumb />
              {this.renderInventoryStats(params)}
            </span>
            <div className="text-nowrap">
              {this.renderInventoryActions(params)}
            </div>
          </h4>
        </div>
      </div>
    );
  }
}
