import React, {PureComponent} from 'react';
import {Route, Switch} from 'react-router-dom';

import Create from './containers/Create';
import List from './containers/List';
import View from './containers/View';
import Edit from './containers/Edit';

export default class Vault extends PureComponent {

  render() {
    return (
      <Switch>
        <Route exact path="/vaults" component={List} />
        <Route exact path="/vaults/create" component={Create} />
        <Route exact path="/vaults/:vaultName/edit" component={Edit} />
        <Route path="/vaults/:vaultName/:prefix*" component={View} />
      </Switch>
    );
  }
}
