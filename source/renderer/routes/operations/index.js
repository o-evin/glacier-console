import React, {PureComponent} from 'react';
import {Route, Switch} from 'react-router-dom';

import List from './containers/List';

export default class Operations extends PureComponent {

  render() {
    return (
      <Switch>
        <Route exact path="/operations" component={List} />
      </Switch>
    );
  }
}
