import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ActionButton from '../../../controls/ActionButton';

import {Retrieval} from '../../../../contracts/entities';

export default class InventoryOperation extends PureComponent {

  static propTypes = {
    inventoryRequest: PropTypes.instanceOf(Retrieval).isRequired,
    onCancel: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  abort() {
    if(confirm('Are you sure you want to cancel inventory in this vault?')) {
      return this.props.onCancel(this.props.inventoryRequest);
    }
  }

  select() {
    return this.props.onSelect(this.props.inventoryRequest.vaultName);
  }

  render() {
    const {inventoryRequest} = this.props;

    return (
      <li className="list-group-item p-1">
        <div className="content w-100 d-flex align-items-center text-nowrap">
          <div className="text-truncate px-2 py-1 w-100"
            onClick={this.select.bind(this)} role="button">
            <i className="fa fa-database mr-2" />
            Synchronizing inventory for {inventoryRequest.vaultName}
          </div>
          <div className="d-flex align-items-center">
            <ActionButton title="Abort"
              className="btn btn-small btn-secondary ml-2"
              onClick={this.abort.bind(this)}>
              <i className="fa fa-stop" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

}
