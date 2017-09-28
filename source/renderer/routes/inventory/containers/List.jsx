import path from 'path';
import PropTypes from 'prop-types';
import {shell} from 'electron';
import {groupBy} from 'lodash';
import {connect} from 'react-redux';
import React, {PureComponent} from 'react';

import ViewFolder from '../components/Folder';
import ViewUpload from '../components/Upload';
import ViewArchive from '../components/Archive';
import ViewRetrieval from '../components/Retrieval';
import ViewSummary from '../components/Summary';

import ListEmptyItem from '../../../controls/ListEmptyItem';

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

  constructor(props) {
    super(props);

    const {prefix} = this.props;

    this.state = {
      prefix: prefix ? prefix + '/' : '',
    };
  }

  retrieveArchive(archive, tier) {
    const {vaultName} = this.props;
    return this.props.initiateRetrieval({vaultName, archive, tier});
  }

  showRetrieval(retrieval) {
    shell.openItem(path.dirname(retrieval.filePath));
    return this.props.removeRetrieval(retrieval);
  }

  selectFolder(prefix) {
    const {vaultName} = this.props;
    const folderPath = path.posix.join('/vaults', vaultName, prefix);
    this.context.router.history.push(folderPath);
  }

  splitContext(data) {
    const {prefix} = this.state;
    const {vaultName} = this.props;

    const entries = [], directory = [];

    data.filter(item => item.vaultName === vaultName)
      .filter(item => item.description.startsWith(prefix))
      .forEach(item => item.description.indexOf('/', prefix.length) > 0 ?
        directory.push(item) : entries.push(item)
      );

    return {entries, directory};
  }

  groupFolders(uploads, archives) {
    const {prefix} = this.state;

    const key = path => path.slice(0, path.indexOf('/', prefix.length) + 1);

    const uploadFolders = groupBy(uploads, item => key(item.description));
    const archiveFolders = groupBy(archives, item => key(item.description));

    return Object.keys(uploadFolders).concat(Object.keys(archiveFolders))
      .filter((value, index, self) => self.indexOf(value) === index)
      .map(key => [key, {
        uploads: uploadFolders[key] || [],
        archives: archiveFolders[key] || [],
        retrievals: archiveFolders[key] ?
          this.props.retrievals.filter(item =>
            archiveFolders[key].some(entry => entry.id === item.archiveId)
          ) : [],
      }]);
  }

  render() {
    const {prefix} = this.state;

    const uploads = this.splitContext(this.props.uploads);
    const archives = this.splitContext(this.props.archives);
    const folders = this.groupFolders(uploads.directory, archives.directory);

    const retrievals = this.props.retrievals.filter(
      item => archives.entries.some(entry => entry.id === item.archiveId)
    );

    const items = uploads.entries.concat(archives.entries);

    return (
      <div className="inventory-list mt-3">
        <ul className="list-group list-progress mb-3">
          { prefix.length > 0 &&
            <ViewFolder
              open={true}
              key={prefix + '../'}
              prefix={prefix + '../'}
              onSelect={this.selectFolder.bind(this)}
            />
          }
          {
            Array.from(folders).map(([path, content]) => (
              <ViewFolder
                key={path}
                prefix={path}
                uploads={content.uploads}
                archives={content.archives}
                retrievals={content.retrievals}
                onSelect={this.selectFolder.bind(this)}>
                <ViewSummary
                  uploads={content.uploads}
                  archives={content.archives}
                  retrievals={content.retrievals}
                />
              </ViewFolder>
            ))
          }
          {
            uploads.entries.map(upload => (
              <ViewUpload
                key={upload.id}
                prefix={prefix}
                upload={upload}
                onRemove={this.props.removeUpload}
                onRestart={this.props.restartUpload}
              />
            ))
          }
          {
            archives.entries.map((archive) => {
              const retrieval = retrievals.find(
                item => item.archiveId === archive.id
              );

              return (
                retrieval ?
                  <ViewRetrieval
                    key={retrieval.id}
                    prefix={prefix}
                    retrieval={retrieval}
                    onShow={this.showRetrieval.bind(this)}
                    onRemove={this.props.removeRetrieval}
                    onRestart={this.props.restartRetrieval}
                  /> :
                  <ViewArchive
                    key={archive.id}
                    prefix={prefix}
                    archive={archive}
                    onRemove={this.props.removeArchive}
                    onRetrieve={this.retrieveArchive.bind(this)}
                  />
              );
            })
          }
          { !items.length && <ListEmptyItem /> }
        </ul>
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
    prefix,
    vaultName,
    uploads,
    archives,
    retrievals,
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
