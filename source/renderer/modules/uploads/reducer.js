import listUpdate from '../../helpers/list_update';

import {Upload} from '../../../contracts/entities';
import {PartStatus} from '../../../contracts/enums';

import {chain, union, isEqual} from 'lodash';

import {
  UPLOAD_GET_SUCCESS,
  UPLOAD_CREATE_SUCCESS,
  UPLOAD_UPDATE_SUCCESS,
  UPLOAD_LIST_SUCCESS,
  UPLOAD_DELETE_SUCCESS,
  UPLOAD_PART_UPDATE_SUCCESS,
  UPLOAD_PART_LIST_SUCCESS,
} from '../../../contracts/enums/action_types';


function updateStats(stats = new Map(), parts) {
  if(!Array.isArray(parts)) {
    parts = [parts];
  }

  parts = parts.filter(entry => entry.status === PartStatus.DONE);

  const updates = new Map(
    chain(parts)
      .groupBy(part => part.parentId)
      .map((value, key) => ([key, value.map(item => item.id)]))
      .value()
  );

  const merged = new Map(stats);

  updates.forEach((value, key, map) => {
    const current = merged.get(key);
    merged.set(key, current ? union(current, value) : value);
  });

  return isEqual(merged, stats) ? stats : merged;
}

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

    case UPLOAD_PART_UPDATE_SUCCESS:
    case UPLOAD_PART_LIST_SUCCESS:
      return {
        ...state,
        stats: updateStats(state.stats, action.payload),
      };

    default:
      return state;
  }
}
