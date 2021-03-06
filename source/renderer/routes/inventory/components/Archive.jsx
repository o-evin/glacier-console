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
    archive: PropTypes.instanceOf(Archive),
    onRemove: PropTypes.func.isRequired,
    onRetrieve: PropTypes.func.isRequired,
  }

  retrieve(tier) {
    const {archive} = this.props;
    return this.props.onRetrieve({archive, tier});
  }

  remove() {
    if(confirm('Are you sure you want to delete this archive?')) {
      return this.props.onRemove(this.props.archive);
    }
  }

  render() {
    const {title} = this.props.archive;

    return (
      <li className="list-group-item p-1">
        <div className="content w-100 d-flex align-items-center text-nowrap">
          <div className="text-truncate px-2 mr-auto" title={title}>
            {title}
          </div>
          <div className="d-flex align-items-center">
            <Dropdown className="dropdown btn-group ml-2">
              <ActionButton className="btn btn-secondary"
                onClick={this.retrieve.bind(this, RetrievalTier.STANDARD)} >
                <i className="fa fa-download" />
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
              <i className="fa fa-trash" />
            </ActionButton>
          </div>
        </div>
      </li>
    );
  }

}
