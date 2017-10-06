import bytes from 'byte-size';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import {Vault} from '../../../../contracts/entities';

export default class Vaults extends PureComponent {

  static propTypes = {
    list: PropTypes.arrayOf(PropTypes.instanceOf(Vault)).isRequired,
  }

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.object.isRequired,
    }),
  };

  select(name) {
    this.context.router.history.push('/vaults/' + name);
  }

  create(name) {
    this.context.router.history.push('/vaults/create');
  }

  renderVault(vault, idx) {

    const {name, lastInventoryDate, sizeInBytes, numberOfArchives} = vault;

    return (
      <tr key={idx} onClick={this.select.bind(this, name)} role="button">
        <th className="col-6 text-truncate">{name}</th>
        <td className="col-2 text-truncate">
          { lastInventoryDate ?
            moment(lastInventoryDate).fromNow() : '--'
          }
        </td>
        <td className="text-right col-2">
          {sizeInBytes ? bytes(sizeInBytes).toString() : '--'}
        </td>
        <td className="text-right col-2">
          {numberOfArchives ? numberOfArchives.toString() : '--'}
        </td>
      </tr>
    );
  }

  render() {

    const {list} = this.props;

    return(
      <div className="container-fluid pt-3">
        <h4 className="d-flex">
          <span className="align-self-center mr-auto p-2">
            Vaults
          </span>
          <div>
            <button className="btn btn-secondary ml-2"
              onClick={this.create.bind(this)}>
              <i className="fa fa-plus mr-2" />
              Create
            </button>
          </div>
        </h4>
        <table className="table table-hover mt-3 scrollable">
          <thead>
            <tr>
              <th className="col-6">Name</th>
              <th className="col-2">Inventory</th>
              <th className="text-right col-2">Size</th>
              <th className="text-right col-2">Archives</th>
            </tr>
          </thead>
          <tbody className="vaults-list text-nowrap">
            { list.length > 0 ? list.map(this.renderVault.bind(this)) :
              <tr>
                <td className="col-12" colSpan="4">No items found.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    );
  }
}
