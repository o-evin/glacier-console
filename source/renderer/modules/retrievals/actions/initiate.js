import path from 'path';
import {remote} from 'electron';

import {
  RETRIEVAL_CREATE_REQUEST,
  RETRIEVAL_CREATE_SUCCESS,
  RETRIEVAL_CREATE_FAILURE,
} from '../../../../contracts/enums/action_types';

import {Transfer as Defaults} from '../../../../contracts/const';

export default function initiateRetrieval({vaultName, archive, tier}) {
  return (dispatch) => {

    dispatch({type: RETRIEVAL_CREATE_REQUEST});

    const config = remote.getGlobal('config');

    const partSize = config.get(
      'transfer.partSizeInBytes',
      Defaults.PART_SIZE_IN_BYTES
    );

    const downloadsPath = config.get(
      'transfer.downloadsPath',
      remote.app.getPath('downloads')
    );

    const filePath = path.join(downloadsPath, archive.description);

    const params = {
      filePath,
      vaultName,
      tier: tier,
      archiveId: archive.id,
      description: archive.description,
      partSize: partSize,
      archiveSize: archive.size,
    };

    const glacier = remote.getGlobal('glacier');

    return glacier.initiateRetrieval(params)
      .then((retrieval) => {

        const {receiver} = remote.getGlobal('queuer');

        return receiver.push(retrieval);
      })
      .then((retrieval) => {
        dispatch({type: RETRIEVAL_CREATE_SUCCESS, payload: retrieval});
      })
      .catch((error) => {
        dispatch({type: RETRIEVAL_CREATE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
