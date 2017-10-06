import bytes from 'byte-size';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import {Time} from '../../../../contracts/const';
import {TransferStats} from '../../../../contracts/entities';

export default class Stats extends PureComponent {

  static propTypes = {
    entries: PropTypes.arrayOf(PropTypes.shape({
      archiveSize: PropTypes.number.isRequired,
      finishedSize: PropTypes.number.isRequired,
    })).isRequired,
  }

  constructor(props) {
    super(props);

    const stats = this.getData(props.entries);
    this.state = {
      stats: new TransferStats(stats),
    };
  }

  initTimeout() {
    if(this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      const {stats} = this.state;
      stats.reset();
      this.setState({stats});
      this.initTimeout();
    }, Time.MINUTE_IN_MILISECONDS);
  }

  getData(entries) {
    return entries.reduce((stats, item) => {
      stats.size += item.archiveSize;
      stats.finished += item.finishedSize;
      return stats;
    }, {size: 0, finished: 0});
  }

  componentDidMount() {
    this.initTimeout();
  }

  componentWillUnmount() {
    if(this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  componentWillReceiveProps(props) {
    const {stats} = this.state;
    stats.update(this.getData(props.entries));
    this.setState({stats});
    this.initTimeout();
  }

  render() {
    const {stats} = this.state;

    return (
      <span>
        <span className="mr-2" >{stats.completion + '%'}</span>
        { stats.rate ?
          bytes(stats.rate, {units: 'iec'}).toString() + '/s' :
          '--'
        }
        <span className="ml-2">
          { stats.duration > 0 ?
            moment().add(stats.duration, 's').fromNow(true) :
            '--'
          }
        </span>
      </span>
    );
  }
}
