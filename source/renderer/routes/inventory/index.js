import React, {PureComponent} from 'react';
import {Route, Switch} from 'react-router-dom';

import List from './containers/List';


export default class Vault extends PureComponent {

  render() {
    return (
      <Switch>
        <Route path="/vaults/:vaultName/:prefix*" component={List} />
      </Switch>
    );
  }
}
