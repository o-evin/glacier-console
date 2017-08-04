import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import Edit from '../components/Edit';

import {Vault} from '../../../../contracts/entities';
import {createVault} from '../../../modules/vaults/actions';

class CreateVaultContainer extends PureComponent {

  onSubmit(vault) {
    return this.props.createVault(vault, '/vaults/' + vault.name);
  }

  render() {

    const initial = new Vault();

    return (
      <Edit
        isEdit={false}
        value={initial}
        onSubmit={this.onSubmit.bind(this)}
        onValidationError={alert}
      />
    );
  }
}

function mapStateToProps(state) {
  return {};
}

export default connect(
  mapStateToProps,
  {createVault}
)(CreateVaultContainer);
