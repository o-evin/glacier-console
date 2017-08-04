import {remote} from 'electron';

import {push as redirectTo} from 'react-router-redux';

import {
  VAULT_CREATE_REQUEST,
  VAULT_CREATE_SUCCESS,
  VAULT_CREATE_FAILURE,
} from '../../../../contracts/enums/action_types';

const glacier = remote.getGlobal('glacier');

export default function createVault(vault, navigateOnSuccess) {
  return (dispatch, getState) => {

    dispatch({type: VAULT_CREATE_REQUEST});

    return glacier.createVault(vault)
      .then((vault) => {

        dispatch({type: VAULT_CREATE_SUCCESS, payload: vault});

        if(navigateOnSuccess) {
          dispatch(redirectTo(navigateOnSuccess));
        }
      })
      .catch((error) => {
        dispatch({type: VAULT_CREATE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
