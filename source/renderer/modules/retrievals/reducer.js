import listUpdate from '../../helpers/list_update';

import {
  RETRIEVAL_GET_SUCCESS,
  RETRIEVAL_CREATE_SUCCESS,
  RETRIEVAL_UPDATE_SUCCESS,
  RETRIEVAL_LIST_SUCCESS,
  RETRIEVAL_DELETE_SUCCESS,
  RETRIEVAL_PART_UPDATE_SUCCESS,
  RETRIEVAL_PART_LIST_SUCCESS,
} from '../../../contracts/enums/action_types';

import {PartStatus} from '../../../contracts/enums';

import {chain, union, isEqual} from 'lodash';

import {Retrieval} from '../../../contracts/entities';

function updateStats(stats = new Map(), parts) {
  if(!Array.isArray(parts)) {
    parts = [parts];
  }

  parts = parts.filter(entry => entry.status === PartStatus.DONE);

  const retrievals = new Map(
    chain(parts)
      .groupBy(part => part.parentId)
      .map((value, key) => ([key, value.map(item => item.id)]))
      .value()
  );

  const merged = new Map(stats);

  retrievals.forEach((value, key, map) => {
    const current = merged.get(key);
    merged.set(key, current ? union(current, value) : value);
  });

  return isEqual(merged, stats) ? stats : merged;
}

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

    case RETRIEVAL_PART_UPDATE_SUCCESS:
    case RETRIEVAL_PART_LIST_SUCCESS:
      return {
        ...state,
        stats: updateStats(state.stats, action.payload),
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
