import listUpdate from '../../helpers/list_update';

import {
  RETRIEVAL_GET_SUCCESS,
  RETRIEVAL_CREATE_SUCCESS,
  RETRIEVAL_UPDATE_SUCCESS,
  RETRIEVAL_LIST_SUCCESS,
  RETRIEVAL_DELETE_SUCCESS,
} from '../../../contracts/enums/action_types';

import {Retrieval} from '../../../contracts/entities';

const compare = (a, b) => (a.createdAt - b.createdAt);

function cast(data) {
  return Array.isArray(data) ?
    data.map(item => new Retrieval(item)) : new Retrieval(data);
}

export default function(state = {}, action) {

  switch (action.type) {

    case RETRIEVAL_GET_SUCCESS:
    case RETRIEVAL_CREATE_SUCCESS:
    case RETRIEVAL_UPDATE_SUCCESS:
    case RETRIEVAL_LIST_SUCCESS:
      return {
        ...state,
        list: listUpdate(state.list, cast(action.payload))
          .sort(compare),
      };

    case RETRIEVAL_DELETE_SUCCESS:
      return {
        ...state,
        list: state.list.filter(item => item.id !== action.payload),
      };

    default:
      return state;
  }
}
