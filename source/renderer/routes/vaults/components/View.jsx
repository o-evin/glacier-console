import bytes from 'byte-size';
import moment from 'moment';
import plur from 'pluralize';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import {
  Vault,
  Inventory,
  Retrieval,
} from '../../../../contracts/entities';

import ActionButton from '../../../controls/ActionButton';

export default class ViewVault extends PureComponent {

  static propTypes = {
    vault: PropTypes.instanceOf(Vault).isRequired,
    inventory: PropTypes.instanceOf(Inventory),
    inventoryRetrieval: PropTypes.instanceOf(Retrieval),
    onRemove: PropTypes.func.isRequired,
    onCancelInventory: PropTypes.func.isRequired,
    onRequestInventory: PropTypes.func.isRequired,
  }

  removeVault() {
    if(confirm('Are you sure you want to permanently delete this vault ' +
      'and all its content?')) {
      return this.props.onRemove(this.props.vault);
    }
  }

  requestInventory() {
    return this.props.onRequestInventory(this.props.vault.name);
  }

  cancelInventory() {
    return this.props.onCancelInventory(this.props.inventoryRetrieval);
  }

  render() {
    const {vault, inventory, inventoryRetrieval} = this.props;

    const {
      name: vaultName,
      lastInventoryDate: vaultLastInventoryDate,
      sizeInBytes: vaultSizeInBytes,
      numberOfArchives: vaultNumberOfArchives,
    } = vault;

    const {
      createdAt: inventoryCreatedAt,
      sizeInBytes: inventorySizeInBytes,
      numberOfArchives: inventoryNumberOfArchives,
    } = inventory || {};

    return (
      <div className="card mt-3">
        <h4 className="card-header d-flex">
          <span className="align-self-center mr-auto text-truncate pr-3">
            {vaultName}
          </span>
          <div>
            <ActionButton className="btn btn-secondary" title="Remove vault"
              onClick={this.removeVault.bind(this)}>
              <i className="fa fa-trash" />
            </ActionButton>
          </div>
        </h4>
        <div className="card-block row p-3">
          <div className="media col-6">
            <div className="d-flex text-muted">
              <span className="text-center mr-3">
                <i className="fa fa-3x fa-fw fa-cloud" />
                <span className="d-block small">Remote</span>
              </span>
            </div>
            <div className="media-body small text-truncate text-nowrap">
              <div className="d-flex align-items-center mb-1">
                <span className="text-muted vault-label pr-2">
                  Inventory:
                </span>
                { vaultLastInventoryDate ?
                  moment(vaultLastInventoryDate).format('D MMM, YYYY HH:mm')
                  : '--'
                }
                <i className="fa fa-info-circle text-muted ml-2"
                  title="Updates approximately once a day"
                />
              </div>
              <div className="d-flex align-items-center mb-1">
                <span className="text-muted vault-label pr-2">
                  Size:
                </span>
                { vaultSizeInBytes ? bytes(vaultSizeInBytes).toString() : '--'}
              </div>
              <div className="d-flex align-items-center">
                <span className="text-muted vault-label pr-2">
                  Archives:
                </span>
                { vaultNumberOfArchives ?
                  plur('archive', vaultNumberOfArchives, true) : '--'
                }
              </div>
            </div>
          </div>
          <div className="media col-6">
            <div className="d-flex text-muted">
              <span className="text-center mr-3">
                <i className="fa fa-3x fa-fw fa-database" />
                <span className="d-block small">Local</span>
              </span>
            </div>
            <div className="media-body small text-nowrap text-truncate">
              <div className="d-flex align-items-center mb-1">
                <span className="text-muted vault-label pr-2">
                  Inventory:
                </span>
                { inventoryCreatedAt ?
                  moment(inventoryCreatedAt).format('D MMM, YYYY HH:mm')
                  : '--'
                }
                { vaultLastInventoryDate &&
                  (inventoryRetrieval ?
                    <ActionButton onClick={this.cancelInventory.bind(this)}
                      className="btn btn-sm btn-secondary ml-3 btn-inline"
                      title={'Inventory update is currently in progress. ' +
                      'That process may take up to 24 hours.'}>
                      <i className="fa fa-refresh fa-spin mr-2" />
                      Cancel
                    </ActionButton>
                    :
                    <ActionButton onClick={this.requestInventory.bind(this)}
                      className="btn btn-sm btn-secondary ml-2 btn-inline">
                      <i className="fa fa-refresh mr-2" />
                      Resync
                    </ActionButton>
                  )
                }
              </div>
              <div className="d-flex align-items-center mb-1">
                <span className="text-muted vault-label pr-2">
                  Size:
                </span>
                { inventorySizeInBytes ?
                  bytes(inventorySizeInBytes).toString() : '--'
                }
              </div>
              <div className="d-flex align-items-center">
                <span className="text-muted vault-label pr-2">
                  Archives:
                </span>
                { inventoryNumberOfArchives ?
                  plur('archive', inventoryNumberOfArchives, true) : '--'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
