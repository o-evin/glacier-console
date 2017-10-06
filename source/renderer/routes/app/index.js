import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {Route, Switch, Redirect, withRouter} from 'react-router-dom';

import Loading from './components/Loading';
import Header from './components/Header';

import Signin from './containers/Signin';
import Settings from './containers/Settings';

import Vaults from '../vaults';
import Operations from '../operations';

import {signout, changeRegion} from '../../modules/auth/actions';

class App extends PureComponent {

  onError(event) {

    event.preventDefault();

    // eslint-disable-next-line
    console.error(event);

    if(event instanceof ErrorEvent) {
      var message = event.error ? event.error.toString() : event.message;
    } else if(event instanceof PromiseRejectionEvent) {
      message = event.reason.message;
    } else {
      message = event.message ||
        'Sorry, an error occurred while processing your request.';
    }

    alert(message);
  }

  componentDidMount() {
    window.addEventListener('error', this.onError);
    window.addEventListener('unhandledrejection', this.onError);
  }

  componentWillUnmount() {
    window.removeEventListener('error', this.onError);
    window.removeEventListener('unhandledrejection', this.onError);
  }

  render() {
    const {isAuthenticated, region} = this.props;

    const Private = ({component: Component, ...rest}) => {
      return (
        <Route {...rest} render={
          (props) => {
            return isAuthenticated ?
              <Component {...props} /> : <Redirect to="/signin" />
            ;
          }}
        />
      );
    };

    return (
      <Switch>
        <Route exact path="/loading" component={Loading} />
        <Route path="/">
          <div>
            <Header
              region={region}
              onSignout={this.props.signout.bind(null, '/signin')}
              onChangeRegion={this.props.changeRegion}
              isAuthenticated={isAuthenticated}
            />
            <Switch>
              <Redirect exact path="/" to="/vaults" />
              <Route exact path="/signin" component={Signin} />
              <Private exact path="/settings" component={Settings} />
              <Private path="/vaults" component={Vaults} />
              <Private path="/operations" component={Operations} />
            </Switch>
          </div>
        </Route>
      </Switch>
    );
  }

}

function mapStateToProps(state) {
  const {isAuthenticated, aws} = state.auth;
  const region = aws && aws.region;

  return {isAuthenticated, region};
}

export default withRouter(connect(
  mapStateToProps,
  {signout, changeRegion}
)(App));
