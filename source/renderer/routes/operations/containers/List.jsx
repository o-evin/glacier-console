import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';

import {
  removeUpload,
  restartUpload,
} from '../../../modules/uploads/actions';

import {
  removeRetrieval,
  restartRetrieval,
} from '../../../modules/retrievals/actions';

import {
  cancelInventory,
} from '../../../modules/inventory/actions';

import ListOperations from '../components/List';

class OperationsContainer extends PureComponent {

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
    }),
  };

  selectVault(name) {
    this.context.router.history.push('/vaults/' + name);
  }

  render() {
    const {uploads, retrievals, inventoryRequests} = this.props;

    return (
      <ListOperations
        uploads={uploads}
        retrievals={retrievals}
        inventoryRequests={inventoryRequests}
        onSelect={this.selectVault.bind(this)}
        onRemoveUpload={this.props.removeUpload}
        onRemoveRetrieval={this.props.removeRetrieval}
        onRestartUpload={this.props.restartUpload}
        onRestartRetrieval={this.props.restartRetrieval}
        onCancelInventory={this.props.cancelInventory}
      />
    );
  }
}

function mapStateToProps(state) {
  const {list: uploads} = state.uploads;
  const {list: retrievals} = state.retrievals;
  const {requests: inventoryRequests} = state.inventory;

  return {uploads, retrievals, inventoryRequests};
}

export default connect(
  mapStateToProps,
  {
    removeUpload,
    restartUpload,
    removeRetrieval,
    restartRetrieval,
    cancelInventory,
  }
)(OperationsContainer);
