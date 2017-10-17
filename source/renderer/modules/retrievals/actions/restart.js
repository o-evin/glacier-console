import {remote} from 'electron';

import {
  RETRIEVAL_RESTART_REQUEST,
  RETRIEVAL_RESTART_SUCCESS,
  RETRIEVAL_RESTART_FAILURE,
} from '../../../../contracts/enums/action_types';


export default function restartRetrieval(retrieval, startOver = false) {
  return (dispatch) => {

    dispatch({type: RETRIEVAL_RESTART_REQUEST});

    if(startOver) {
      retrieval.position = 0;
      retrieval.completedSequences.length = 0;
    }

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.restartRetrieval(retrieval)
      .then((upload) => {
        dispatch({type: RETRIEVAL_RESTART_SUCCESS, payload: retrieval});
      })
      .catch((error) => {
        dispatch({type: RETRIEVAL_RESTART_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
