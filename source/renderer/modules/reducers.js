import {combineReducers} from 'redux';
import {routerReducer as routing} from 'react-router-redux';

import {
  AUTH_SIGNOUT_SUCCESS,
} from '../../contracts/enums/action_types';

import auth from './auth/reducer';
import uploads from './uploads/reducer';
import retrievals from './retrievals/reducer';
import inventory from './inventory/reducer';
import vaults from './vaults/reducer';

const appReducer = combineReducers({
  auth,
  uploads,
  retrievals,
  inventory,
  routing,
  vaults,
});

export default (state = {}, action) => {
  if (action.type === AUTH_SIGNOUT_SUCCESS) {
    const {routing} = state;
    state = {routing};
  }
  return appReducer(state, action);
};
