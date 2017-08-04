import {push as redirectTo} from 'react-router-redux';
import {remote} from 'electron';
import {signout} from '../../auth/actions';

import {
  AUTH_SIGNIN_REQUEST,
  AUTH_SIGNIN_SUCCESS,
  AUTH_SIGNIN_FAILURE,
} from '../../../../contracts/enums/action_types';

export function authenticateHandler(creds, isRemember, listener) {

  const glacier = remote.getGlobal('glacier');

  remote.getGlobal('auth').aws = creds;

  return glacier.verifyAuthentication()
    .then(() => {

      if(isRemember) {
        remote.getGlobal('config').set('auth.aws', creds);
      }

      if(listener) {
        const queuer = remote.getGlobal('queuer');
        queuer.start();
        const unsubscribe = queuer.subscribe(listener);
        window.addEventListener('beforeunload', () => {
          unsubscribe();
        }, {once: true});
      }

    });
}

export default function authenticate(auth, isRemember, navigateOnSuccess) {
  return (dispatch) => {

    dispatch({type: AUTH_SIGNIN_REQUEST, auth});

    return authenticateHandler(auth, isRemember, dispatch)
      .then(() => {
        dispatch({type: AUTH_SIGNIN_SUCCESS, auth});

        if(navigateOnSuccess) {
          dispatch(redirectTo(navigateOnSuccess));
        }
      })
      .catch((error) => {
        dispatch({type: AUTH_SIGNIN_FAILURE});
        dispatch(signout());
        alert(error.message || error.toString());
      });

  };

}
