import {remote} from 'electron';

import {
  RETRIEVAL_CREATE_REQUEST,
  RETRIEVAL_CREATE_SUCCESS,
  RETRIEVAL_CREATE_FAILURE,
} from '../../../../contracts/enums/action_types';

export default function initiateRetrieval({archive, tier}) {
  return (dispatch) => {

    dispatch({type: RETRIEVAL_CREATE_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.requestRetrieval({archive, tier})
      .then((retrieval) => {
        dispatch({type: RETRIEVAL_CREATE_SUCCESS, payload: retrieval});
      })
      .catch((error) => {
        dispatch({type: RETRIEVAL_CREATE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
