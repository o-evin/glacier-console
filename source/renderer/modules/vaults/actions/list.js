import {remote} from 'electron';

import {
  VAULT_LIST_REQUEST,
  VAULT_LIST_SUCCESS,
  VAULT_LIST_FAILURE,
} from '../../../../contracts/enums/action_types';

const glacier = remote.getGlobal('glacier');

export default function listVaults() {
  return (dispatch, getState) => {

    dispatch({type: VAULT_LIST_REQUEST});

    return glacier.listVaults()
      .then((vaults) => {
        dispatch({type: VAULT_LIST_SUCCESS, payload: vaults});
        return vaults;
      })
      .catch((error) => {
        dispatch({type: VAULT_LIST_FAILURE});
      });

  };

}
