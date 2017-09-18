import {remote} from 'electron';

import {
  INVENTORY_CANCEL_REQUEST,
  INVENTORY_CANCEL_FAILURE,
  INVENTORY_CANCEL_SUCCESS,
} from '../../../../contracts/enums/action_types';


export default function cancel(retrieval) {
  return (dispatch) => {

    dispatch({type: INVENTORY_CANCEL_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.cancelInventory(retrieval)
      .then(() => {
        dispatch({type: INVENTORY_CANCEL_SUCCESS, payload: retrieval.id});
      })
      .catch((error) => {
        dispatch({type: INVENTORY_CANCEL_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
