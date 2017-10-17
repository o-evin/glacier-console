import {remote} from 'electron';

import {push as redirectTo} from 'react-router-redux';

import {
  VAULT_DELETE_REQUEST,
  VAULT_DELETE_SUCCESS,
  VAULT_DELETE_FAILURE,
} from '../../../../contracts/enums/action_types';


export default function removeVault(vault, navigateOnSuccess) {
  return (dispatch) => {

    dispatch({type: VAULT_DELETE_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.removeVault(vault.name)
      .then(() => {

        if(navigateOnSuccess) {
          dispatch(redirectTo(navigateOnSuccess));
        }

        dispatch({type: VAULT_DELETE_SUCCESS, payload: vault.id});
      })
      .catch((error) => {
        dispatch({type: VAULT_DELETE_FAILURE});
        let message = error.toString();

        if(message.indexOf('Vault not empty or recently written to') >= 0) {
          message = 'Amazon Glacier deletes a vault only if there are no ' +
            'archives in the vault as of the last inventory it computed and ' +
            'there have been no writes to the vault since the last ' +
            'inventory. \n\n' +
            'Please ensure there are no archives in the ' + vault.name + ' ' +
            'vault and wait for the next remote inventory to proceed.';
        }

        alert(message);
      });

  };

}
