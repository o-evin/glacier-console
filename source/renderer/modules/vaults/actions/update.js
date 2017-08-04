import {remote} from 'electron';

import {push as redirectTo} from 'react-router-redux';

import {
  VAULT_UPDATE_REQUEST,
  VAULT_UPDATE_SUCCESS,
  VAULT_UPDATE_FAILURE,
} from '../../../../contracts/enums/action_types';

const glacier = remote.getGlobal('glacier');

export default function updateVault(vault, navigateOnSuccess) {
  return (dispatch, getState) => {

    dispatch({type: VAULT_UPDATE_REQUEST});

    return glacier.updateVault(vault)
      .then((vault) => {

        dispatch({type: VAULT_UPDATE_SUCCESS, payload: vault});

        if(navigateOnSuccess) {
          dispatch(redirectTo(navigateOnSuccess));
        }
      })
      .catch((error) => {
        dispatch({type: VAULT_UPDATE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
