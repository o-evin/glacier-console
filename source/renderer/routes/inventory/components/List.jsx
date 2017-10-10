import PropTypes from 'prop-types';
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
  Folder,
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

  getContextItems() {
    const {prefix} = this.props;

    const folders = new Map();

    const group = (entries, map, type) => {
      entries.forEach((item) => {
        const {description} = item;
        const index = description.indexOf('/', prefix.length) + 1;
        const dirname = index > 0 ? description.substring(0, index) : prefix;

        if(!map.has(dirname)) {
          map.set(dirname, new Folder({prefix: dirname}));
        }
        map.get(dirname)[type].push(item);
      });
    };

    group(this.props.archives, folders, 'archives');

    folders.forEach((folder) => {
      folder.retrievals = this.props.retrievals.filter(
        item => folder.archives.some(entry => entry.id === item.archiveId)
      );
    });

    group(this.props.uploads, folders, 'uploads');

    if(folders.has(prefix)) {
      var current = folders.get(prefix);
      folders.delete(prefix);
    }

    const entries = Array.from(folders.values())
      .sort((a, b) => a.title.localeCompare(b.title));

    if(current) {
      const {uploads, retrievals} = current;
      const archives = current.archives.map(item =>
        retrievals.find(entry => entry.archiveId === item.id) || item
      );

      entries.concat(uploads, archives);
    }

    return entries;
  }

  render() {
    const {prefix} = this.props;
    const items = this.getContextItems();
    return (
      <div className="inventory-list mt-3">
        <ul className="list-group list-progress mb-3">
          { prefix.length > 0 &&
            <ViewFolder
              open={true}
              prefix={prefix + '../'}
              onSelect={this.props.onNavigate}
            />
          }
          { items.map(this.renderEntry, this) }
          { !items.length && <ListEmptyItem /> }
        </ul>
      </div>
    );
  }


  renderEntry(entry, idx) {

    if(entry instanceof Folder) {
      return (
        <ViewFolder
          key={idx}
          prefix={entry.prefix}
          onSelect={this.props.onNavigate}>
          <ViewSummary
            uploads={entry.uploads}
            archives={entry.archives}
            retrievals={entry.retrievals}
          />
        </ViewFolder>
      );
    }

    if(entry instanceof Upload) {
      return (
        <ViewUpload
          key={idx}
          upload={entry}
          onRemove={this.props.onRemoveUpload}
          onRestart={this.props.onRestartUpload}
        />
      );
    }

    if(entry instanceof Retrieval) {
      return (
        <ViewRetrieval
          key={idx}
          retrieval={entry}
          onRemove={this.props.onRemoveRetrieval}
          onRestart={this.props.onRestartRetrieval}
          onDisplay={this.props.onDisplay}
        />
      );
    }

    if(entry instanceof Archive) {
      return (
        <ViewArchive
          key={idx}
          archive={entry}
          onRemove={this.props.onRemoveArchive}
          onRetrieve={this.props.onRetrieve}
        />
      );
    }

  }

}
