import cx from 'classnames';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

import ActionButton from '../../../controls/ActionButton';
import {
  Dropdown,
  DropdownMenu,
  DropdownToggle,
} from '../../../controls/Dropdown';

import {
  RetrievalTier,
} from '../../../../contracts/enums';

import {
  Archive,
} from '../../../../contracts/entities';

export default class ViewArchive extends PureComponent {

  static propTypes = {
    prefix: PropTypes.string,
    value: PropTypes.instanceOf(Archive),
    onRemove: PropTypes.func.isRequired,
    onRetrieve: PropTypes.func.isRequired,
  }

  retrieve(archive, tier) {
    return this.props.onRetrieve(archive, tier);
  }

  remove(archive) {
    if(confirm('Are you sure you want to delete this archive?')) {
      return this.props.onRemove(archive);
    }
  }

  render() {
    const {value: archive, prefix} = this.props;

    const description = prefix ?
      archive.description.slice(prefix.length + 1) :
      archive.description;

    return (
      <li className="list-group-item p-1">
        <div className="content w-100 d-flex">
          <div title={description}
            className="description p-2 align-self-center mr-auto">
            {description}
          </div>
          <div className="actions">
            <Dropdown className="dropdown btn-group ml-2">
              <ActionButton className="btn btn-secondary"
                onClick={this.retrieve.bind(this, archive,
                  RetrievalTier.STANDARD)} >
                <i className="fa fa-download text-muted" />
              </ActionButton>
              <DropdownToggle className={cx('btn btn-secondary',
                'dropdown-toggle dropdown-toggle-split')} >
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu dropdown-menu-right">
                <button className="btn btn-link dropdown-item"
                  onClick={this.retrieve.bind(this, archive,
                    RetrievalTier.STANDARD)}>
                  Standard
                </button>
                <button className="btn btn-link dropdown-item"
                  onClick={this.retrieve.bind(this, archive,
                    RetrievalTier.EXPEDITED)}>
                  Expedited
                </button>
                <button className="btn btn-link dropdown-item"
                  onClick={this.retrieve.bind(this, archive,
                    RetrievalTier.BULK)}>
                  Bulk
                </button>
              </DropdownMenu>
            </Dropdown>
            <ActionButton className="btn btn-secondary ml-2"
              title="Delete"
              onClick={this.remove.bind(this, archive)}>
              <i className="fa fa-trash text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

}
