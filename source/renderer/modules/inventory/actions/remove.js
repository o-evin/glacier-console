import {remote} from 'electron';

import {
  ARCHIVE_DELETE_REQUEST,
  ARCHIVE_DELETE_SUCCESS,
  ARCHIVE_DELETE_FAILURE,
} from '../../../../contracts/enums/action_types';


export default function removeArchive(archive) {
  return (dispatch) => {

    dispatch({type: ARCHIVE_DELETE_REQUEST});

    const glacier = remote.getGlobal('glacier');

    return glacier.deleteArchive(archive.id, archive.vaultName)
      .then(() => {

        const {receiver} = remote.getGlobal('queuer');

        return receiver.removeArchive(archive);
      })
      .then(() => {
        dispatch({type: ARCHIVE_DELETE_SUCCESS, payload: archive.id});
      })
      .catch((error) => {
        dispatch({type: ARCHIVE_DELETE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
