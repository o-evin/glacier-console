import React from 'react';
import cx from 'classnames';

export class Dropdown extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {isOpen: false};
    this.toggle = this.toggle.bind(this);
    this.closureHandler = this.closureHandler.bind(this);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closureHandler);
  }

  closureHandler(event) {
    const dropdown = this.refs.dropdown;
    if (event.target !== dropdown) {
      this.toggle.call(this);
    }
  }

  close() {
    this.setState({isOpen: false});
    document.removeEventListener('click', this.closureHandler);
  }

  open() {
    this.setState({isOpen: true});
    document.addEventListener('click', this.closureHandler);
  }

  toggle() {
    (this.state.isOpen ? this.close : this.open).call(this);
  }

  render() {
    return (
      <div ref="dropdown" className={cx(this.props.className || 'dropdown',
        {'show': this.state.isOpen})}>
        {
          React.Children.map(this.props.children, (child) => {
            if(child.type === DropdownToggle || child.type === DropdownMenu) {
              return React.cloneElement(child, {
                onClick: this.toggle.bind(this),
              });
            }
            return child;
          })
        }
      </div>
    );
  }
}

export function DropdownMenu(props) {
  return (
    <div {...props}
      className={props.className || 'dropdown-menu dropdown-menu-right'}>
    </div>
  );
}

export function DropdownToggle(props) {
  return (
    <button {...props} type="button"
      className={props.className || 'btn-link dropdown-toggle'}>
    </button>
  );
}
