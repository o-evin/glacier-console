import {remote} from 'electron';

import {
  UPLOAD_CREATE_REQUEST,
  UPLOAD_CREATE_SUCCESS,
  UPLOAD_CREATE_FAILURE,
} from '../../../../contracts/enums/action_types';

export default function createUpload({vaultName, prefix, filePath, pathRoot}) {
  return (dispatch) => {

    dispatch({type: UPLOAD_CREATE_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.requestUpload({vaultName, prefix, filePath, pathRoot})
      .then((upload) => {
        dispatch({type: UPLOAD_CREATE_SUCCESS, payload: upload});
      })
      .catch((error) => {
        dispatch({type: UPLOAD_CREATE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
