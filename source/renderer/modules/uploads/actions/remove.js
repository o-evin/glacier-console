import {remote} from 'electron';

import {
  UPLOAD_DELETE_REQUEST,
  UPLOAD_DELETE_FAILURE,
  UPLOAD_DELETE_SUCCESS,
} from '../../../../contracts/enums/action_types';

export default function removeUpload(upload) {
  return (dispatch) => {

    dispatch({type: UPLOAD_DELETE_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.removeUpload(upload)
      .then(() => {
        dispatch({type: UPLOAD_DELETE_SUCCESS, payload: upload.id});
      })
      .catch((error) => {
        dispatch({type: UPLOAD_DELETE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
