import {remote} from 'electron';

import {
  UPLOAD_CREATE_REQUEST,
  UPLOAD_CREATE_SUCCESS,
  UPLOAD_CREATE_FAILURE,
} from '../../../../contracts/enums/action_types';

export default function createUpload({vaultName, prefix, filePath, pathRoot}) {
  return (dispatch) => {

    dispatch({type: UPLOAD_CREATE_REQUEST});

    const params = {
      prefix,
      filePath,
      pathRoot,
      vaultName,
    };

    const glacier = remote.getGlobal('glacier');

    return glacier.initiateUpload(params)
      .then((upload) => {
        const {uploader} = remote.getGlobal('queuer');
        return uploader.push(upload);
      })
      .then((upload) => {
        dispatch({type: UPLOAD_CREATE_SUCCESS, payload: upload});
      })
      .catch((error) => {
        dispatch({type: UPLOAD_CREATE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
