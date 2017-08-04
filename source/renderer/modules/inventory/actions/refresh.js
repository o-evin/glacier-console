import {remote} from 'electron';

import {
  INVENTORY_REFRESH_REQUEST,
  INVENTORY_REFRESH_SUCCESS,
  INVENTORY_REFRESH_FAILURE,
} from '../../../../contracts/enums/action_types';


export default function refresh(vault) {
  return (dispatch) => {

    dispatch({type: INVENTORY_REFRESH_REQUEST});

    const {receiver} = remote.getGlobal('queuer');

    return receiver.requestInventory(vault)
      .then(() => {
        dispatch({type: INVENTORY_REFRESH_SUCCESS, payload: vault});
      })
      .catch((error) => {
        dispatch({type: INVENTORY_REFRESH_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
