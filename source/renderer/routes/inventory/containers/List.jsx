import path from 'path';
import PropTypes from 'prop-types';
import {shell, remote} from 'electron';
import {connect} from 'react-redux';
import React, {PureComponent} from 'react';

import Actions from '../components/Actions';
import ViewSummary from '../components/Summary';
import Breadcrumb from '../components/Breadcrumb';
import ListInventory from '../components/List';

import {readDir} from '../../../helpers';

import {
  createUpload,
  removeUpload,
  restartUpload,
} from '../../../modules/uploads/actions';

import {
  removeRetrieval,
  restartRetrieval,
  initiateRetrieval,
} from '../../../modules/retrievals/actions';

import {
  removeArchive,
} from '../../../modules/inventory/actions';


class ListInventoryContainer extends PureComponent {

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
    }),
  };

  navigate(prefix) {
    const {vaultName} = this.props;
    const folderPath = path.posix.join('/vaults', vaultName, prefix);
    this.context.router.history.push(folderPath);
  }

  display(retrievals) {

    if(!Array.isArray(retrievals)) {
      retrievals = [retrievals];
    }

    const paths = retrievals.map(
      item => path.dirname(item.filePath)
    ).filter((path, index, self) => self.indexOf(path) === index);

    paths.forEach(shell.openItem);

    return Promise.all(retrievals.map(this.props.removeRetrieval));
  }

  uploadFile() {
    return this.showUploadDialog(['openFile', 'multiSelections']);
  }

  uploadDirectory() {
    return this.showUploadDialog(['openDirectory', 'multiSelections']);
  }

  showUploadDialog(properties) {
    remote.dialog.showOpenDialog({properties}, (params) => {
      if(params && params.length > 0) {
        const {vaultName} = this.props;

        params.forEach((target) => {
          readDir(target).forEach(filePath =>
            this.props.createUpload({
              filePath,
              vaultName,
              prefix: path.posix.join(
                this.props.prefix,
                path.dirname(filePath.slice(path.dirname(target).length))
              ).replace(/^[./]+/, ''),
            })
          );
        });
      }
    });
  }

  filterContext(entries) {
    const {vaultName, prefix} = this.props;
    entries = entries.filter(item => item.vaultName === vaultName);
    return prefix.length === 0 ? entries :
      entries.filter(item => item.description.startsWith(prefix));
  }

  render() {
    const {prefix} = this.props;

    const uploads = this.filterContext(this.props.uploads);
    const archives = this.filterContext(this.props.archives);
    const retrievals = this.props.retrievals.filter(
      item => archives.some(entry => entry.id === item.archiveId)
    );

    return (
      <div className="mt-3">
        <div className="d-flex px-2 align-items-center">
          <Breadcrumb prefix={prefix} onSelect={this.navigate.bind(this)} />
          <ViewSummary
            uploads={uploads}
            archives={archives}
            retrievals={retrievals}
          />
          <Actions
            uploads={uploads}
            archives={archives}
            retrievals={retrievals}
            onUploadFile={this.uploadFile.bind(this)}
            onUploadDirectory={this.uploadDirectory.bind(this)}
            onRemoveUpload={this.props.removeUpload}
            onRestartUpload={this.props.restartUpload}
            onRetrieve={this.props.initiateRetrieval}
            onRemoveRetrieval={this.props.removeRetrieval}
            onRestartRetrieval={this.props.restartRetrieval}
            onDisplay={this.display.bind(this)}
          />
        </div>
        <ListInventory
          prefix={prefix}
          uploads={uploads}
          archives={archives}
          retrievals={retrievals}
          onNavigate={this.navigate.bind(this)}
          onRemoveUpload={this.props.removeUpload}
          onRestartUpload={this.props.restartUpload}
          onRetrieve={this.props.initiateRetrieval}
          onRemoveRetrieval={this.props.removeRetrieval}
          onRestartRetrieval={this.props.restartRetrieval}
          onRemoveArchive={this.props.removeArchive}
          onDisplay={this.display.bind(this)}
        />
      </div>
    );
  }

}

function mapStateToProps(state, props) {
  const {vaultName, prefix} = props.match.params;
  const {archives} = state.inventory;

  const {list: uploads} = state.uploads;
  const {list: retrievals} = state.retrievals;

  return {
    vaultName,
    uploads,
    archives,
    retrievals,
    prefix: prefix ? prefix + '/' : '',
  };
}

export default connect(
  mapStateToProps,
  {
    createUpload,
    removeUpload,
    restartUpload,
    removeArchive,
    restartRetrieval,
    removeRetrieval,
    initiateRetrieval,
  }
)(ListInventoryContainer);
