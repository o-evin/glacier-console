import React from 'react';
import ReactDOM from 'react-dom';
import thunkMiddleware from 'redux-thunk';

import {remote} from 'electron';
import {Provider} from 'react-redux';
import {createMemoryHistory} from 'history';
import {createStore, applyMiddleware} from 'redux';
import {ConnectedRouter, routerMiddleware} from 'react-router-redux';

import App from './routes/app';
import reducers from './modules/reducers';
import {authenticate} from './modules/auth/actions';

import './assets/stylesheets/main.scss';

const history = createMemoryHistory();
const routerHistoryMiddleware = routerMiddleware(history);

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware,
  routerHistoryMiddleware,
)(createStore);

const store = createStoreWithMiddleware(reducers);

const render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter basename="/" history={history}>
        <App />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('root')
  );
};

const config = remote.getGlobal('config');
const creds = remote.getGlobal('auth').aws || config.get('auth.aws');

if(creds && creds.key && creds.secret) {
  const unsubscribe = store.subscribe(() => {
    const {auth} = store.getState();

    if(!auth.aws || auth.isAuthenticated) {
      unsubscribe();
      render();
    }
  });

  store.dispatch(authenticate(creds));

} else {
  render();
}
