import cx from 'classnames';
import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

export default class ViewFolder extends PureComponent {

  static defaultProps = {
    open: false,
  }

  static propTypes = {
    open: PropTypes.bool.isRequired,
    prefix: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  select() {
    return this.props.onSelect(this.props.prefix);
  }

  render() {
    const title = this.props.prefix.match(/([^/]*)\/*$/)[1];

    return(
      <li className="list-group-item p-1" >
        <div className="content w-100 align-items-center d-flex">
          <i className={cx('fa fa-2x ml-2', this.props.open ?
            'fa-folder-open-o' : 'fa-folder-o')}
          />
          <div title={title} className="text-truncate p-2 mr-auto"
            onClick={this.select.bind(this)} role="button">
            {title}
          </div>
          <div className="text-nowrap">
            {this.props.children}
          </div>
        </div>
      </li>
    );
  }
}
