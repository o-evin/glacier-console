import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {FetchStatus} from '../../../../contracts/enums';
import FetchSpinner from '../../../controls/FetchSpinner';

import {
  getVault,
  updateVault,
} from '../../../modules/vaults/actions';

import Edit from '../components/Edit';

class EditVaultContainer extends PureComponent {

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

  submitVault(vault) {
    this.props.updateVault(vault, '/vaults/' + vault.id);
  }

  render() {
    if(this.state.fetchStatus !== FetchStatus.DONE) {
      return <FetchSpinner status={this.state.fetchStatus} />;
    }

    return (
      <Edit
        isEdit={true}
        value={this.props.vault}
        onSubmit={this.submitVault.bind(this)}
        onValidationError={(message) => { alert(message); }}
      />
    );
  }

}

function mapStateToProps(state, props) {
  const {vaultName} = props.match.params;

  const vault = state.vaults.list &&
    state.vaults.list.find(item => item.name === vaultName);

  return {
    vault,
    vaultName,
  };
}

export default connect(
  mapStateToProps, {
    getVault,
    updateVault,
  }
)(EditVaultContainer);
