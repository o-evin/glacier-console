import Signin from '../components/Signin';
import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {authenticate} from '../../../modules/auth/actions';

class SigninContainer extends PureComponent {

  onSubmit(auth, isRemember) {
    this.props.authenticate(auth, isRemember, '/');
  }

  render() {
    return <Signin onSubmit={this.onSubmit.bind(this)} />;
  }
}

export default connect(
  null,
  {authenticate}
)(SigninContainer);
