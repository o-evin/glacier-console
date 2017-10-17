import {remote} from 'electron';

import {
  UPLOAD_RESTART_REQUEST,
  UPLOAD_RESTART_SUCCESS,
  UPLOAD_RESTART_FAILURE,
} from '../../../../contracts/enums/action_types';


export default function restartUpload(upload, startOver = false) {
  return (dispatch) => {

    dispatch({type: UPLOAD_RESTART_REQUEST});

    if(startOver) {
      startOver.position = 0;
      startOver.completedSequences.length = 0;
    }

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
