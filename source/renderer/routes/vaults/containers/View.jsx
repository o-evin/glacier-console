
import React, {PureComponent} from 'react';
import {Route} from 'react-router-dom';
import {connect} from 'react-redux';

import Inventory from '../../inventory';
import ViewVault from '../components/View';
import FetchSpinner from '../../../controls/FetchSpinner';

import {FetchStatus} from '../../../../contracts/enums';

import {
  getVault,
  removeVault,
} from '../../../modules/vaults/actions';

import {
  cancelInventory,
  requestInventory,
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

  render() {
    if(this.state.fetchStatus !== FetchStatus.DONE) {
      return <FetchSpinner status={this.state.fetchStatus} />;
    }

    const {vault, inventory, inventoryRetrieval} = this.props;

    return (
      <div className="container-fluid">
        <ViewVault
          vault={vault}
          inventory={inventory}
          inventoryRetrieval={inventoryRetrieval}
          onRemove={this.props.removeVault}
          onCancelInventory={this.props.cancelInventory}
          onRequestInventory={this.props.requestInventory}>
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

  const inventoryRetrieval = state.inventory.requests &&
    state.inventory.requests.find(item => item.vaultName === vaultName);

  return {
    vault,
    vaultName,
    prefix,
    inventory,
    inventoryRetrieval,
  };
}

export default connect(
  mapStateToProps,
  {
    getVault,
    removeVault,
    cancelInventory,
    requestInventory,
  }
)(ViewVaultContainer);
