import {remote} from 'electron';
import {push as redirectTo} from 'react-router-redux';
import {signout} from '../actions';
import {signoutHandler} from './signout';
import {authenticateHandler} from './authenticate';


import {
  AUTH_SIGNIN_REQUEST,
  AUTH_SIGNIN_SUCCESS,
  AUTH_SIGNOUT_REQUEST,
  AUTH_SIGNOUT_SUCCESS,
  CHANGE_REGION_REQUEST,
  CHANGE_REGION_SUCCESS,
  CHANGE_REGION_FAILURE,
} from '../../../../contracts/enums/action_types';

export default function changeRegion(region) {
  return (dispatch) => {

    dispatch({type: CHANGE_REGION_REQUEST});

    const config = remote.getGlobal('config');
    const isRemember = config.has('auth.aws.region');

    const {aws} = remote.getGlobal('auth');
    const auth = {...aws, region};

    dispatch(redirectTo('/loading'));
    dispatch({type: AUTH_SIGNOUT_REQUEST});

    return signoutHandler()
      .then(() => {
        dispatch({type: AUTH_SIGNOUT_SUCCESS});
        dispatch({type: AUTH_SIGNIN_REQUEST, auth});
        return authenticateHandler(auth, isRemember, dispatch);
      })
      .then(() => {
        dispatch({type: AUTH_SIGNIN_SUCCESS, auth});
        dispatch(redirectTo('/'));
        dispatch({type: CHANGE_REGION_SUCCESS});
      })
      .catch((error) => {
        dispatch({type: CHANGE_REGION_FAILURE});
        alert(error.message || error.toString());
        dispatch(signout());
      });
  };
}
