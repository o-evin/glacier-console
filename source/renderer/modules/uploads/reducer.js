import {listUpdate} from '../../helpers';
import {Upload} from '../../../contracts/entities';

import {
  UPLOAD_GET_SUCCESS,
  UPLOAD_CREATE_SUCCESS,
  UPLOAD_UPDATE_SUCCESS,
  UPLOAD_LIST_SUCCESS,
  UPLOAD_DELETE_SUCCESS,
} from '../../../contracts/enums/action_types';

const compare = (a, b) => (a.createdAt - b.createdAt);

function cast(data) {
  return Array.isArray(data) ?
    data.map(item => new Upload(item)) : new Upload(data);
}

export default function(state = {}, action) {

  switch (action.type) {

    case UPLOAD_GET_SUCCESS:
    case UPLOAD_CREATE_SUCCESS:
    case UPLOAD_UPDATE_SUCCESS:
    case UPLOAD_LIST_SUCCESS:
      return {
        ...state,
        list: listUpdate(state.list, cast(action.payload))
          .sort(compare),
      };

    case UPLOAD_DELETE_SUCCESS:
      return {
        ...state,
        list: state.list.filter(item => item.id !== action.payload),
      };

    default:
      return state;
  }
}
