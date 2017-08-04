import {remote} from 'electron';
import {push as redirectTo} from 'react-router-redux';

import {
  AUTH_SIGNOUT_REQUEST,
  AUTH_SIGNOUT_SUCCESS,
  AUTH_SIGNOUT_FAILURE,
} from '../../../../contracts/enums/action_types';

export function signoutHandler() {
  const queuer = remote.getGlobal('queuer');

  return queuer.stop()
    .then(() => {

      const config = remote.getGlobal('config');

      if(config.has('auth.aws')) {
        config.remove('auth.aws');
      }

      remote.getGlobal('auth').aws = null;

    });
}


export default function signout(navigateOnSuccess) {
  return (dispatch) => {

    dispatch({type: AUTH_SIGNOUT_REQUEST});
    dispatch(redirectTo('/loading'));

    return signoutHandler()
      .then(() => {
        dispatch({type: AUTH_SIGNOUT_SUCCESS});

        if(navigateOnSuccess) {
          dispatch(redirectTo(navigateOnSuccess));
        }
      })
      .catch((error) => {
        dispatch({type: AUTH_SIGNOUT_FAILURE});
        alert(error.toString());
      });
  };

}
