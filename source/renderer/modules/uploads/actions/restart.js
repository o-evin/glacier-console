import {remote} from 'electron';

import {
  UPLOAD_RESTART_REQUEST,
  UPLOAD_RESTART_SUCCESS,
  UPLOAD_RESTART_FAILURE,
} from '../../../../contracts/enums/action_types';


export default function restartUpload(upload) {
  return (dispatch) => {

    dispatch({type: UPLOAD_RESTART_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.restartUpload(upload)
      .then((upload) => {
        dispatch({type: UPLOAD_RESTART_SUCCESS, payload: upload});
      })
      .catch((error) => {
        dispatch({type: UPLOAD_RESTART_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
