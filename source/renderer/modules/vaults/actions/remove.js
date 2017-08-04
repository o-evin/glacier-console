import {remote} from 'electron';

import {push as redirectTo} from 'react-router-redux';

import {
  VAULT_DELETE_REQUEST,
  VAULT_DELETE_SUCCESS,
  VAULT_DELETE_FAILURE,
} from '../../../../contracts/enums/action_types';

const glacier = remote.getGlobal('glacier');

export default function removeVault(vault, navigateOnSuccess) {
  return (dispatch) => {

    dispatch({type: VAULT_DELETE_REQUEST});

    return glacier.deleteVault(vault)
      .then(() => {

        if(navigateOnSuccess) {
          dispatch(redirectTo(navigateOnSuccess));
        }

        dispatch({type: VAULT_DELETE_SUCCESS, payload: vault.id});
      })
      .catch((error) => {
        dispatch({type: VAULT_DELETE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
