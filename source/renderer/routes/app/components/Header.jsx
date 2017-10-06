import PropTypes from 'prop-types';
import React, {PureComponent} from 'react';
import {Link} from 'react-router-dom';

import logo from '../../../assets/images/aws-glacier.svg';

import AppMenu from '../components/AppMenu';

import {AwsRegionDetails} from '../../../../contracts/dictionary';

import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
} from '../../../controls/Dropdown';

export default class Header extends PureComponent {

  static propTypes = {
    region: PropTypes.string,
    isAuthenticated: PropTypes.bool,
    onSignout: PropTypes.func.isRequired,
    onChangeRegion: PropTypes.func.isRequired,
  }

  signout() {
    this.props.onSignout();
  }

  render() {

    const {isAuthenticated, region} = this.props;

    return (
      <div>
        <header className="px-2 m-0 w-100">
          <span className="navbar-brand logo">
            <img src={logo} className="w-100 p-2" />
            AWS Glacier
          </span>
          { isAuthenticated &&
            <div className="float-right pt-3 d-flex flex-row">
              <Dropdown className="dropdown mr-2">
                <DropdownToggle className="btn btn-secondary dropdown-toggle">
                  {AwsRegionDetails.get(region).name}
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu dropdown-menu-right">
                  {[...AwsRegionDetails].map(([key, value]) => {
                    return (
                      <button key={key} className="btn btn-link dropdown-item"
                        onClick={this.props.onChangeRegion.bind(null, key)}>
                        {value.name}
                      </button>
                    );
                  })}
                </DropdownMenu>
              </Dropdown>
              <Dropdown className="dropdown mr-2">
                <DropdownToggle className="btn btn-secondary">
                  <i className="fa fa-bars fa-lg" />
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu dropdown-menu-right">
                  <Link className="dropdown-item" to="/settings">
                    Preferences
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="btn btn-link dropdown-item"
                    onClick={this.signout.bind(this)}>
                    Signout
                  </button>
                </DropdownMenu>
              </Dropdown>
            </div>
          }
        </header>
        { isAuthenticated && <AppMenu /> }
      </div>
    );
  }
}
