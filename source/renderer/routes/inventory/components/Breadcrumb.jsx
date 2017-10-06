import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';

export default class Breadcrumb extends PureComponent {

  static defaultProps = {
    title: 'Inventory',
  }

  static propTypes = {
    title: PropTypes.string.isRequired,
    prefix: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired,
  }

  render() {
    const {prefix, title} = this.props;

    const folders = prefix.split('/').filter(Boolean)
      .map((name, idx, self) => (
        [name, self.slice(0, idx + 1).join('/')]
      ));

    return (
      <span className="text-nowrap text-truncate h4 m-0">
        <span role="button" onClick={this.props.onSelect.bind(null, './')}>
          {title}
        </span>
        {
          folders.map(([name, path], index) => (
            <span key={index}>
              <i className="fa fa-angle-right px-1" />
              {(index === folders.length - 1) ?
                <span className="text-muted small">{name}</span> :
                <span className="small" role="button"
                  onClick={this.props.onSelect.bind(null, path)}>
                  {name}
                </span>
              }
            </span>
          ))
        }
      </span>
    );

  }

}
