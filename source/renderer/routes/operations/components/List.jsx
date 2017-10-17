import {groupBy} from 'lodash';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ActionButton from '../../../controls/ActionButton';
import ListEmptyItem from '../../../controls/ListEmptyItem';

import {Retrieval, Upload} from '../../../../contracts/entities';

import {
  UploadStatus,
  RetrievalStatus,
} from '../../../../contracts/enums';

import Inventory from '../components/Inventory';
import Uploads from '../components/Uploads';
import Retrievals from '../components/Retrievals';
import TransferStats from '../components/Stats';

export default class ListOperations extends PureComponent {

  static propTypes = {
    uploads: PropTypes.arrayOf(
      PropTypes.instanceOf(Upload)
    ).isRequired,
    retrievals: PropTypes.arrayOf(
      PropTypes.instanceOf(Retrieval)
    ).isRequired,
    inventoryRequests: PropTypes.arrayOf(
      PropTypes.instanceOf(Retrieval)
    ).isRequired,
    onSelect: PropTypes.func.isRequired,
    onRemoveUpload: PropTypes.func.isRequired,
    onRemoveRetrieval: PropTypes.func.isRequired,
    onRestartUpload: PropTypes.func.isRequired,
    onRestartRetrieval: PropTypes.func.isRequired,
    onCancelInventory: PropTypes.func.isRequired,
  }

  abortAll() {
    if(confirm('Are you sure you want to abort all operations?')) {
      const {uploads, retrievals, inventoryRequests} = this.props;
      return Promise.all([
        ...uploads.map(this.props.onRemoveUpload),
        ...retrievals.map(this.props.onRemoveRetrieval),
        ...inventoryRequests.map(this.props.onCancelInventory),
      ]);
    }
  }

  retryAll() {
    const {uploads, retrievals} = this.props;

    return Promise.all([
      ...uploads.filter(item => item.status === UploadStatus.ERROR)
        .map(this.props.onRestartUpload),
      ...retrievals.filter(item => item.status === RetrievalStatus.ERROR)
        .map(this.props.onRestartRetrieval),
    ]);
  }

  restartAll() {
    if(confirm('Are you sure you want to restart all erroneous operations ' +
      'from the beginning?')) {
      const {uploads, retrievals} = this.props;

      return Promise.all([
        ...uploads.filter(item => item.status === UploadStatus.ERROR)
          .map(item => this.props.onRestartUpload(item, true)),
        ...retrievals.filter(item => item.status === RetrievalStatus.ERROR)
          .map(item => this.props.onRestartRetrieval(item, true)),
      ]);
    }
  }

  render() {

    const {uploads, retrievals, inventoryRequests} = this.props;

    const errorCount =
      uploads.filter(item => item.status === UploadStatus.ERROR).length +
      retrievals.filter(item => item.status === RetrievalStatus.ERROR).length;

    const totalCount = uploads.length + retrievals.length
      + inventoryRequests.length;

    const uploadGroup = groupBy(uploads, item => item.vaultName);
    const retrievalGroup = groupBy(retrievals, item => item.vaultName);

    const items = [
      ...Object.entries(uploadGroup),
      ...Object.entries(retrievalGroup),
    ].sort(([firstVault, firstValues], [secondtVault, secondValues]) => {
      const firstDate = Math.max.apply(
        null, firstValues.map(item => item.createdAt)
      );
      const secondDate = Math.max.apply(
        null, secondValues.map(item => item.createdAt)
      );
      return firstDate - secondDate;
    });

    return (
      <div className="container-fluid pt-3">
        <div className="d-flex text-nowrap align-items-center">
          <h4 className="p-2 m-0">Operations</h4>
          <div className="ml-auto">
            <ActionButton hidden={errorCount === 0}
              className="btn btn-secondary mr-2"
              onClick={this.restartAll.bind(this)}>
              <i className="fa fa-step-backward mr-2" />
              Start Over
              <span className="badge badge-danger badge-pill ml-2">
                {errorCount}
              </span>
            </ActionButton>
            <ActionButton hidden={errorCount === 0}
              className="btn btn-secondary mr-2"
              onClick={this.retryAll.bind(this)}>
              <i className="fa fa-refresh mr-2" />
              Retry
              <span className="badge badge-danger badge-pill ml-2">
                {errorCount}
              </span>
            </ActionButton>
            <ActionButton hidden={totalCount === 0}
              className="btn btn-secondary"
              onClick={this.abortAll.bind(this)} >
              <i className="fa fa-stop mr-2" />
              Cancel All
            </ActionButton>
          </div>
        </div>

        <div className="small mt-3">
          { uploads.length > 0 &&
            <span className="ml-3">
              <i className="fa fa-upload mr-2" />
              <TransferStats entries={uploads} />
            </span>
          }
          { retrievals.length > 0 &&
            <span className="ml-3">
              <i className="fa fa-download mr-2" />
              <TransferStats entries={retrievals} />
            </span>
          }
        </div>

        <ul className="list-group list-progress operations-list mt-3">
          {
            items.map(([vaultName, entries], idx) => {
              const [item] = entries;
              if(item instanceof Upload) {
                return (
                  <Uploads
                    key={idx}
                    vaultName={vaultName}
                    uploads={entries}
                    onSelect={this.props.onSelect}
                    onRemove={this.props.onRemoveUpload}
                    onRestart={this.props.onRestartUpload}
                  />
                );
              }
              if(item instanceof Retrieval) {
                return (
                  <Retrievals
                    key={idx}
                    vaultName={vaultName}
                    retrievals={entries}
                    onSelect={this.props.onSelect}
                    onRemove={this.props.onRemoveRetrieval}
                    onRestart={this.props.onRestartRetrieval}
                  />
                );
              }
            })
          }
          {
            inventoryRequests.map((entry, idx) => {
              return (
                <Inventory
                  key={idx}
                  inventoryRequest={entry}
                  onSelect={this.props.onSelect}
                  onCancel={this.props.onCancelInventory}
                />
              );
            })
          }
          { items.length ===0 && inventoryRequests.length === 0 &&
            <ListEmptyItem />
          }
        </ul>
      </div>

    );
  }
}
