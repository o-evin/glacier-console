import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import ListVaults from '../components/List';
import FetchSpinner from '../../../controls/FetchSpinner';

import {FetchStatus} from '../../../../contracts/enums';
import {listVaults} from '../../../modules/vaults/actions';

class ListVaultsContainer extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      fetchStatus: props.list ? FetchStatus.DONE : FetchStatus.FETCHING,
    };

  }

  componentDidMount() {
    this.props.listVaults();
  }

  componentWillReceiveProps(props) {
    if(props.list) {
      this.setState({fetchStatus: FetchStatus.DONE});
    }
  }

  render() {

    if(this.state.fetchStatus !== FetchStatus.DONE) {
      return <FetchSpinner status={this.state.fetchStatus} />;
    }

    const {list} = this.props;

    return (
      <ListVaults
        list={list}
      />
    );
  }
}

function mapStateToProps(state) {
  const {list} = state.vaults;
  return {list};
}

export default connect(
  mapStateToProps,
  {listVaults}
)(ListVaultsContainer);
