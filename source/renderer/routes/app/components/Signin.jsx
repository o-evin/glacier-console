import cx from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import Component from '../../../helpers/component';
import ActionButton from '../../../controls/ActionButton';
import {AwsAuth} from '../../../../contracts/entities';
import {AwsRegion} from '../../../../contracts/enums';
import {AwsRegionDetails} from '../../../../contracts/dictionary';

import logo from '../../../assets/images/aws-glacier.svg';

export default class Signin extends Component {

  static propTypes = {
    onSubmit: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);
    const auth = new AwsAuth({
      region: AwsRegion.US_WEST_OREGON,
    });

    this.state = {
      ...auth,
      isRemember: false,
    };
  }

  onSubmit(event) {
    event.preventDefault();
    const auth = new AwsAuth(this.state);
    return this.props.onSubmit(auth, this.state.isRemember);
  }

  render() {

    const {key, secret, region, isRemember} = this.state;

    return (
      <div>
        <img className="fixed-top public-background" src={logo} />
        <div className="container-fluid vertical-center w-100">
          <div
            className={cx('form-xs mx-auto bg-faded px-5 py-3',
              'rounded box-shadow')}>

            <h4 className="form-group mt-3">AWS API Credentials</h4>

            <div className="form-group mt-3">
              <div className="input-group">
                <input value={key || ''} className="form-control"
                  placeholder="Key" onChange={this.onChange('key')}
                />
              </div>
            </div>
            <div className="form-group">
              <input value={secret || ''} className="form-control"
                placeholder="Secret" onChange={this.onChange('secret')}
              />
            </div>

            <div className="form-group">
              <select value={region || ''} className="form-control"
                onChange={this.onChange('region')}>
                {[...AwsRegionDetails].map(([key, value]) => {
                  return <option key={key} value={key}>{value.name}</option>;
                })}
              </select>
            </div>

            <div className="form-group d-flex justify-content-start">
              <div className="form-check my-2">
                <label className="form-check-label">
                  <input className="form-check-input mr-2" type="checkbox"
                    checked={isRemember}
                    onChange={this.onChange('isRemember')}
                  />
                  Remember
                </label>
              </div>
              <ActionButton animate={true}
                onClick={this.onSubmit.bind(this)}
                className="btn btn-success ml-auto" type="submit">
                Connect
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
