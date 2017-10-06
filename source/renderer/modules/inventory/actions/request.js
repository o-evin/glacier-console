import {remote} from 'electron';

import {
  INVENTORY_INIT_REQUEST,
  INVENTORY_INIT_SUCCESS,
  INVENTORY_INIT_FAILURE,
} from '../../../../contracts/enums/action_types';


export default function request(vaultName) {
  return (dispatch) => {
    dispatch({type: INVENTORY_INIT_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.requestInventory(vaultName)
      .then((retrieval) => {
        dispatch({type: INVENTORY_INIT_SUCCESS, payload: retrieval});
      })
      .catch((error) => {
        dispatch({type: INVENTORY_INIT_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
