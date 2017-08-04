import React, {PureComponent} from 'react';
import {NavLink} from 'react-router-dom';

export default class AppMenu extends PureComponent {
  render() {
    return (
      <ul className="nav nav-tabs top-nav bg-faded pl-3">
        <li className="nav-item">
          <NavLink to="/vaults" activeClassName="active"
            className="nav-link">
            Vaults
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to="/operations" activeClassName="active"
            className="nav-link">
            Operations
          </NavLink>
        </li>
      </ul>
    );
  }
}
