import React, {PureComponent} from 'react';
import {NavLink, withRouter} from 'react-router-dom';

class AppMenu extends PureComponent {
  render() {
    return (
      <ul className="nav nav-tabs top-nav bg-light pl-3">
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

export default withRouter(AppMenu);
