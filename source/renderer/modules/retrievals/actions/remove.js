import {remote} from 'electron';

import {
  RETRIEVAL_DELETE_REQUEST,
  RETRIEVAL_DELETE_FAILURE,
  RETRIEVAL_DELETE_SUCCESS,
} from '../../../../contracts/enums/action_types';


export default function removeRetrieval(retrieval) {
  return (dispatch) => {

    dispatch({type: RETRIEVAL_DELETE_REQUEST});

    const jobExecutor = remote.getGlobal('jobExecutor');

    return jobExecutor.removeRetrieval(retrieval)
      .then(() => {
        dispatch({type: RETRIEVAL_DELETE_SUCCESS, payload: retrieval.id});
      })
      .catch((error) => {
        dispatch({type: RETRIEVAL_DELETE_FAILURE});
        alert(error.message || error.toString());
      });

  };

}
