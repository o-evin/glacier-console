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
    archive: PropTypes.instanceOf(Archive),
    onRemove: PropTypes.func.isRequired,
    onRetrieve: PropTypes.func.isRequired,
  }

  retrieve(tier) {
    return this.props.onRetrieve(this.props.archive, tier);
  }

  remove() {
    if(confirm('Are you sure you want to delete this archive?')) {
      return this.props.onRemove(this.props.archive);
    }
  }

  render() {
    const {archive, prefix} = this.props;
    const {description} = archive;
    const title = description.slice(prefix.length);

    return (
      <li className="list-group-item p-1">
        <div className="content w-100 d-flex">
          <div className="description p-2 align-self-center mr-auto"
            title={title}>{title}</div>
          <div className="text-nowrap">
            <Dropdown className="dropdown btn-group ml-2">
              <ActionButton className="btn btn-secondary"
                onClick={this.retrieve.bind(this, RetrievalTier.STANDARD)} >
                <i className="fa fa-download text-muted" />
              </ActionButton>
              <DropdownToggle className={cx('btn btn-secondary',
                'dropdown-toggle dropdown-toggle-split')} >
              </DropdownToggle>
              <DropdownMenu className="dropdown-menu dropdown-menu-right">
                <button className="btn btn-link dropdown-item"
                  onClick={this.retrieve.bind(this, RetrievalTier.STANDARD)}>
                  Standard
                </button>
                <button className="btn btn-link dropdown-item"
                  onClick={this.retrieve.bind(this, RetrievalTier.EXPEDITED)}>
                  Expedited
                </button>
                <button className="btn btn-link dropdown-item"
                  onClick={this.retrieve.bind(this, RetrievalTier.BULK)}>
                  Bulk
                </button>
              </DropdownMenu>
            </Dropdown>
            <ActionButton className="btn btn-secondary ml-2"
              title="Delete"
              onClick={this.remove.bind(this)}>
              <i className="fa fa-trash text-muted" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

}
