import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ViewFolder from '../components/Folder';
import ViewUpload from '../components/Upload';
import ViewArchive from '../components/Archive';
import ViewRetrieval from '../components/Retrieval';
import ViewSummary from '../components/Summary';

import ListEmptyItem from '../../../controls/ListEmptyItem';
import ListLoadingItem from '../../../controls/ListLoadingItem';

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

  constructor(props) {
    super(props);

    this.state = {
      listHeight: null,
      itemHeight: null,
      scrollTop: 0,
      items: this.getContextItems(props),
    };

    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    const {clientHeight: listHeight} = ReactDOM.findDOMNode(this.refs.list);
    const {clientHeight: itemHeight} = ReactDOM.findDOMNode(this.refs.loading);
    this.setState({itemHeight, listHeight});
  }

  componentWillReceiveProps(props) {
    this.setState({items: this.getContextItems(props)});
  }

  handleScroll(event) {
    const {scrollTop} = event.target;
    this.setState({scrollTop});
  }

  getContextItems(props) {
    const {prefix} = props;

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

    group(props.archives, folders, 'archives');

    folders.forEach((folder) => {
      folder.retrievals = props.retrievals.filter(
        item => folder.archives.some(entry => entry.id === item.archiveId)
      );
    });

    group(props.uploads, folders, 'uploads');

    if(folders.has(prefix)) {
      var current = folders.get(prefix);
      folders.delete(prefix);
    }

    const collator = new Intl.Collator(undefined, {
      numeric: true,
      sensitivity: 'base',
    });

    const entries = Array.from(folders.values())
      .sort((a, b) => collator.compare(a.title, b.title));

    if(current) {
      const {uploads, retrievals} = current;

      const archives = current.archives.map(item =>
        retrievals.find(entry => entry.archiveId === item.id) || item
      );

      entries.push(...uploads);
      entries.push(...archives);
    }

    if(prefix.length > 0) {
      entries.unshift(
        new Folder({prefix: prefix + '../'})
      );
    }

    return entries;
  }

  render() {
    const visibleItems = [];
    const {itemHeight} = this.state;

    if(itemHeight) {
      const {listHeight, scrollTop, items} = this.state;

      const sliceTop = Math.floor(scrollTop / itemHeight);
      const sliceCount = Math.ceil(listHeight / itemHeight) + 5;

      var paddingTop = sliceTop * itemHeight;
      var minHeight = items.length * itemHeight;

      visibleItems.push(...items.slice(sliceTop, sliceTop + sliceCount));

      if(items.length === 0) {
        visibleItems.push(<ListEmptyItem key="empty" />);
      }

    } else {
      visibleItems.push(
        <ListLoadingItem ref="loading" key="loading" />
      );
    }

    return (
      <div className="inventory-list mt-3" ref="list"
        onScroll={this.handleScroll}>
        <ul className="list-group list-progress mb-3"
          style={{minHeight, paddingTop}}>
          {visibleItems.map(this.renderEntry, this)}
        </ul>
      </div>
    );
  }

  renderEntry(entry) {

    if(entry instanceof Folder) {
      return (
        <ViewFolder
          key={entry.prefix}
          prefix={entry.prefix}
          open={entry.prefix.endsWith('../')}
          onSelect={this.props.onNavigate}>
          { entry.hasStats &&
            <ViewSummary
              uploads={entry.uploads}
              archives={entry.archives}
              retrievals={entry.retrievals}
            />
          }
        </ViewFolder>
      );
    }

    if(entry instanceof Upload) {
      return (
        <ViewUpload
          key={entry.id}
          upload={entry}
          onRemove={this.props.onRemoveUpload}
          onRestart={this.props.onRestartUpload}
        />
      );
    }

    if(entry instanceof Retrieval) {
      return (
        <ViewRetrieval
          key={entry.id}
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
          key={entry.id}
          archive={entry}
          onRemove={this.props.onRemoveArchive}
          onRetrieve={this.props.onRetrieve}
        />
      );
    }

    return entry;

  }

}
