import fs from 'fs';
import path from 'path';
import React, {PureComponent} from 'react';
import {Route} from 'react-router-dom';
import {remote, shell} from 'electron';
import {connect} from 'react-redux';

import Inventory from '../../inventory';
import ViewVault from '../components/View';
import FetchSpinner from '../../../controls/FetchSpinner';

import {FetchStatus, RetrievalAction} from '../../../../contracts/enums';

import {
  getVault,
  removeVault,
} from '../../../modules/vaults/actions';

import {
  removeUpload,
  createUpload,
  restartUpload,
} from '../../../modules/uploads/actions';

import {
  removeRetrieval,
  restartRetrieval,
  initiateRetrieval,
} from '../../../modules/retrievals/actions';

import {
  removeArchive,
  refreshInventory,
} from '../../../modules/inventory/actions';

class ViewVaultContainer extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      fetchStatus: props.vault ? FetchStatus.DONE : FetchStatus.FETCHING,
    };
  }

  componentDidMount() {
    this.props.getVault(this.props.vaultName);
  }

  componentWillReceiveProps(props) {
    if(props.vault) {
      this.setState({fetchStatus: FetchStatus.DONE});
    }
  }

  uploadFiles() {
    const {prefix} = this.props;

    remote.dialog.showOpenDialog({properties: [
      'openFile',
      'multiSelections',
    ],
    filters: [
      {name: 'All Files', extensions: ['*']},
      {name: 'Images', extensions: ['jpg', 'png', 'gif']},
      {name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'mov']},
    ]}, (params) => {
      //TODO: verify if file is directory
      if(params && params.length > 0) {
        const {vaultName} = this.props;
        for(let filePath of params) {
          this.props.createUpload({vaultName, prefix, filePath});
        }
      }

    });
  }

  uploadDirectory() {
    const {prefix} = this.props;

    remote.dialog.showOpenDialog({properties: [
      'openDirectory',
      'multiSelections',
    ]}, (params) => {

      if(params && params.length > 0) {

        const getFiles = (dir, pathRoot, filelist = []) => {
          let files = fs.readdirSync(dir);
          files.forEach((file) => {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
              getFiles(path.join(dir, file), pathRoot, filelist);
            }
            else {
              filelist.push({
                pathRoot,
                filePath: path.join(dir, file),
              });
            }
          });
          return filelist;
        };

        const filelist = [];

        for(let directory of params) {
          const pathRoot = path.dirname(directory);
          filelist.push(...getFiles(directory, pathRoot));
        }

        const {vaultName} = this.props;

        for(let file of filelist) {
          this.props.createUpload({vaultName, prefix, ...file});
        }
      }
    });
  }

  retrieveLocation(tier) {
    const {vaultName, retrievals} = this.props;
    const archives = this.filterByPath(this.props.archives);

    return Promise.all(
      archives.filter(
        archive => retrievals.some(
          retrieval => retrieval.archiveId === archive.id
        ) === false
      ).map(archive => this.props.initiateRetrieval({vaultName, archive, tier}))
    );

  }

  showRetrievals(retrievals) {
    retrievals.forEach(
      item => shell.openItem(path.dirname(item.filePath))
    );
    return Promise.all(
      retrievals.map(this.props.removeRetrieval)
    );
  }

  filterByPath(entries) {
    const {prefix, vaultName} = this.props;

    return entries.filter(
      (item, idx) => item.vaultName === vaultName &&
        (!prefix || item.description.startsWith(prefix + '/'))
    );
  }

  render() {
    if(this.state.fetchStatus !== FetchStatus.DONE) {
      return <FetchSpinner status={this.state.fetchStatus} />;
    }

    const {vault, vaultName, inventory, prefix} = this.props;

    const uploads = this.filterByPath(this.props.uploads);
    const archives = this.filterByPath(this.props.archives);

    const retrievals = this.props.retrievals.filter(
      item => archives.some(archive => archive.id === item.archiveId)
    );

    const inventoryRetrieval = prefix ? null : this.props.retrievals.find(
      item => item.vaultName === vaultName &&
        item.action === RetrievalAction.INVENTORY
    );

    return (
      <div className="container-fluid">
        <ViewVault
          vault={vault}
          uploads={uploads}
          archives={archives}
          retrievals={retrievals}
          inventory={inventory}
          inventoryRetrieval={inventoryRetrieval}
          onRemove={this.props.removeVault.bind(null, vault, '/vaults/')}
          onRetrieve={this.retrieveLocation.bind(this)}
          onRestartUpload={this.props.restartUpload}
          onRemoveUpload={this.props.removeUpload}
          onRestartRetrieval={this.props.restartRetrieval}
          onRemoveRetrieval={this.props.removeRetrieval}
          onShowRetrievals={this.showRetrievals.bind(this)}
          onUploadFiles={this.uploadFiles.bind(this)}
          onUploadDirectory={this.uploadDirectory.bind(this)}
          onRefreshInventory={this.props.refreshInventory.bind(null, vault)}>
        </ViewVault>
        <Route component={Inventory} />
      </div>
    );
  }

}

function mapStateToProps(state, props) {
  const {vaultName, prefix} = props.match.params;

  const vault = state.vaults.list &&
    state.vaults.list.find(item => item.name === vaultName);

  const inventory = state.inventory.list &&
    state.inventory.list.find(item => item.vaultName === vaultName);

  const {archives} = state.inventory;
  const {stats: uploadStats, list: uploads} = state.uploads;
  const {stats: retrievalStats, list: retrievals} = state.retrievals;

  return {
    vault,
    vaultName,
    prefix,
    uploads,
    uploadStats,
    inventory,
    retrievals,
    retrievalStats,
    archives,
  };
}

export default connect(
  mapStateToProps,
  {
    getVault,
    removeVault,
    createUpload,
    removeUpload,
    restartUpload,
    removeArchive,
    restartRetrieval,
    removeRetrieval,
    refreshInventory,
    initiateRetrieval,
  }
)(ViewVaultContainer);