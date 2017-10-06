import PropTypes from 'prop-types';
import {groupBy, union} from 'lodash';
import React, {PureComponent} from 'react';

import ViewFolder from '../components/Folder';
import ViewUpload from '../components/Upload';
import ViewArchive from '../components/Archive';
import ViewRetrieval from '../components/Retrieval';
import ViewSummary from '../components/Summary';

import ListEmptyItem from '../../../controls/ListEmptyItem';

import {
  Archive,
  Upload,
  Retrieval,
} from '../../../../contracts/entities';


export default class ListInventory extends PureComponent {

  static propTypes = {
    prefix: PropTypes.string.isRequired,
    uploads: PropTypes.arrayOf(PropTypes.instanceOf(Upload)).isRequired,
    archives: PropTypes.arrayOf(PropTypes.instanceOf(Archive)).isRequired,
    retrievals: PropTypes.arrayOf(PropTypes.instanceOf(Retrieval)).isRequired,
    onNavigate: PropTypes.func.isRequired,
    onRemoveUpload: PropTypes.func.isRequired,
    onRestartUpload: PropTypes.func.isRequired,
    onRetrieve: PropTypes.func.isRequired,
    onRemoveRetrieval: PropTypes.func.isRequired,
    onRestartRetrieval: PropTypes.func.isRequired,
    onRemoveArchive: PropTypes.func.isRequired,
    onDisplay: PropTypes.func.isRequired,
  }

  splitContext(data) {
    const {prefix} = this.props;

    const entries = [], directory = [];
    data.forEach(item => item.description.indexOf('/', prefix.length) > 0 ?
      directory.push(item) : entries.push(item)
    );

    return {entries, directory};
  }

  groupFolders(uploads, archives) {
    const {prefix} = this.props;

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
    const {prefix} = this.props;

    const uploads = this.splitContext(this.props.uploads);
    const archives = this.splitContext(this.props.archives);
    const folders = this.groupFolders(uploads.directory, archives.directory);

    const retrievals = this.props.retrievals.filter(
      item => archives.entries.some(entry => entry.id === item.archiveId)
    );

    const items = union(uploads.entries, archives.entries);

    return (
      <div className="inventory-list mt-3">
        <ul className="list-group list-progress mb-3">
          { prefix.length > 0 &&
            <ViewFolder
              open={true}
              key={prefix + '../'}
              prefix={prefix + '../'}
              onSelect={this.props.onNavigate}
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
                onSelect={this.props.onNavigate}>
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
                onRemove={this.props.onRemoveUpload}
                onRestart={this.props.onRestartUpload}
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
                    onRemove={this.props.onRemoveRetrieval}
                    onRestart={this.props.onRestartRetrieval}
                    onDisplay={this.props.onDisplay}
                  /> :
                  <ViewArchive
                    key={archive.id}
                    prefix={prefix}
                    archive={archive}
                    onRemove={this.props.onRemoveArchive}
                    onRetrieve={this.props.onRetrieve}
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
