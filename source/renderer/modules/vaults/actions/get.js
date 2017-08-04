import {remote} from 'electron';

import {
  VAULT_GET_REQUEST,
  VAULT_GET_SUCCESS,
  VAULT_GET_FAILURE,
} from '../../../../contracts/enums/action_types';

const glacier = remote.getGlobal('glacier');

export default function getVault(id) {
  return (dispatch, getState) => {

    dispatch({type: VAULT_GET_REQUEST});

    return glacier.describeVault(id)
      .then((vault) => {
        dispatch({type: VAULT_GET_SUCCESS, payload: vault});
      })
      .catch((error) => {
        dispatch({type: VAULT_GET_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
