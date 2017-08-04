import path from 'path';
import PropTypes from 'prop-types';
import {shell} from 'electron';
import {connect} from 'react-redux';
import React, {PureComponent} from 'react';

import ViewFolder from '../components/Folder';
import ViewUpload from '../components/Upload';
import ViewArchive from '../components/Archive';
import ViewRetrieval from '../components/Retrieval';

import {
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

class ListInventory extends PureComponent {

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
    }),
  };

  retrieveArchive(archive, tier) {
    const {vaultName} = this.props;
    return this.props.initiateRetrieval({vaultName, archive, tier});
  }

  showRetrieval(retrieval) {
    shell.openItem(path.dirname(retrieval.filePath));
    return this.props.removeRetrieval(retrieval);
  }

  filterByPath(entries) {
    const {prefix, vaultName} = this.props;

    return entries.filter(
      item => item.vaultName === vaultName &&
        (!prefix || item.description.startsWith(prefix + '/'))
    );
  }

  extractFolders(entries) {
    const {prefix} = this.props;

    return entries
      .filter(archive => archive.description.indexOf('/') > 0)
      .map(archive => prefix ?
        archive.description.slice(prefix.length + 1) : archive.description
      )
      .filter(filePath => filePath.indexOf('/') > 0)
      .map(filePath => filePath.slice(0, filePath.indexOf('/')))
      .filter((dir, index, array) => array.indexOf(dir) === index)
      .sort((a, b) => a.localeCompare(b));
  }

  selectFolder(name) {
    const {vaultName, prefix = ''} = this.props;
    const folderPath = path.join('/vaults', vaultName, prefix, name, '/')
      .replace('\\', '/');

    this.context.router.history.push(folderPath);
  }

  renderFolder({name, uploads, archives, retrievals}) {
    const {uploadStats, retrievalStats} = this.props;

    return (
      <ViewFolder
        key={name}
        name={name}
        uploads={uploads}
        archives={archives}
        retrievals={retrievals}
        uploadStats={uploadStats}
        retrievalStats={retrievalStats}
        onSelect={this.selectFolder.bind(this)}
      />
    );

  }

  renderNavigateLevelUp() {
    const goBack = () => this.selectFolder('../');

    return (
      <li className="list-group-item p-1" onClick={goBack} role="button">
        <div className="content w-100 d-flex">
          <i className="fa fa-folder-open-o fa-2x align-self-center ml-2" />
          <div className="description p-2 align-self-center mr-auto">..</div>
        </div>
      </li>
    );
  }

  renderUpload(upload) {
    const {uploadStats, prefix} = this.props;
    const stats = uploadStats && uploadStats.get(upload.id);

    return (
      <ViewUpload
        key={upload.id}
        prefix={prefix}
        stats={stats}
        value={upload}
        onRemove={this.props.removeUpload}
        onRestart={this.props.restartUpload}
      />
    );
  }

  renderArchive(archive) {
    const {prefix} = this.props;

    return (
      <ViewArchive
        key={archive.id}
        prefix={prefix}
        value={archive}
        onRemove={this.props.removeArchive}
        onRetrieve={this.retrieveArchive.bind(this)}
      />
    );
  }

  renderRetrieval(retrieval) {
    const {retrievalStats, prefix} = this.props;
    const stats = retrievalStats && retrievalStats.get(retrieval.id);

    return (
      <ViewRetrieval
        key={retrieval.id}
        stats={stats}
        prefix={prefix}
        value={retrieval}
        onShow={this.showRetrieval.bind(this)}
        onRemove={this.props.removeRetrieval}
        onRestart={this.props.restartRetrieval}
      />
    );
  }

  render() {
    const {prefix} = this.props;

    const uploads = this.filterByPath(this.props.uploads);
    const archives = this.filterByPath(this.props.archives);
    const retrievals = this.props.retrievals.filter(
      item => archives.some(archive => archive.id === item.archiveId)
    );

    const folders = this.extractFolders(uploads.concat(archives));

    const currentUploads = uploads.filter(item => (
      prefix ? item.description.slice(prefix.length + 1) : item.description
    ).indexOf('/') < 0);

    const currentArchives = archives.filter(item => (
      prefix ? item.description.slice(prefix.length + 1) : item.description
    ).indexOf('/') < 0);

    return (
      <div className="inventory-list mt-3">
        <ul className="list-group list-progress mb-3">
          {prefix && this.renderNavigateLevelUp()}
          {folders.length > 0 &&
            Array.from(folders).map((name) => {

              const folderPath = path.join(prefix || '', name, '/')
                .replace('\\', '/');

              const folderUploads = uploads.filter(item =>
                item.description.startsWith(folderPath)
              );

              const folderRetrievals = retrievals.filter(item =>
                item.description.startsWith(folderPath)
              );

              const folderArchives = archives.filter(item =>
                item.description.startsWith(folderPath)
              );

              return this.renderFolder({
                name,
                uploads: folderUploads,
                retrievals: folderRetrievals,
                archives: folderArchives,
              });
            })
          }

          {currentUploads.length === 0 &&
            currentArchives.length === 0 &&
            <li className="list-group-item p-1">
              <div className="content">
                <div className="description p-2">No items found.</div>
              </div>
            </li>
          }

          {currentUploads.length > 0 &&
            currentUploads.map(this.renderUpload.bind(this))
          }

          {currentArchives.length > 0 &&
            currentArchives.map((archive) => {
              const retrieval = retrievals.find(
                item => item.archiveId === archive.id
              );
              if(retrieval) {
                return this.renderRetrieval(retrieval);
              }
              return this.renderArchive(archive);
            })
          }
        </ul>
      </div>
    );
  }

}

function mapStateToProps(state, props) {
  const {vaultName, prefix} = props.match.params;
  const {archives} = state.inventory;

  const {stats: uploadStats, list: uploads} = state.uploads;
  const {stats: retrievalStats, list: retrievals} = state.retrievals;

  return {
    prefix,
    vaultName,
    uploads,
    uploadStats,
    retrievals,
    retrievalStats,
    archives,
  };
}

export default connect(
  mapStateToProps,
  {
    removeUpload,
    restartUpload,
    removeArchive,
    restartRetrieval,
    removeRetrieval,
    initiateRetrieval,
  }
)(ListInventory);
