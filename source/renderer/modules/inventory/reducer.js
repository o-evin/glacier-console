import {listUpdate} from '../../helpers';
import {Archive, Retrieval, Inventory} from '../../../contracts/entities';

import {
  ARCHIVE_DELETE_SUCCESS,
  INVENTORY_LIST_SUCCESS,
  INVENTORY_UPDATE_SUCCESS,
  INVENTORY_INIT_SUCCESS,
  INVENTORY_CANCEL_SUCCESS,
  INVENTORY_REMOVE_RETRIEVAL,
  INVENTORY_REMOVE_SUCCESS,
} from '../../../contracts/enums/action_types';

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function updateInventory(state, payload) {

  if(!Array.isArray(payload)) {
    payload = [payload];
  }

  let {
    list: inventoryUpdates = [],
    archives: archiveUpdates = [],
  } = state;

  payload.forEach(({archives, ...inventory}) => {
    archiveUpdates = archiveUpdates.filter(
      item => item.vaultName !== inventory.vaultName
    ).concat(
      archives.map(item => new Archive(item))
    );

    inventoryUpdates = inventoryUpdates.filter(
      item => item.vaultName !== inventory.vaultName
    );

    inventoryUpdates.push(new Inventory(inventory));
  });

  return {
    ...state,
    archives: archiveUpdates
      .sort((a, b) => collator.compare(a.description, b.description)),
    list: inventoryUpdates,
  };

}

function cast(data) {
  return Array.isArray(data) ?
    data.map(item => new Retrieval(item)) : new Retrieval(data);
}

export default function(state = {}, action) {

  switch (action.type) {

    case INVENTORY_LIST_SUCCESS:
    case INVENTORY_UPDATE_SUCCESS:
      return updateInventory(state, action.payload);

    case INVENTORY_INIT_SUCCESS:
      return {
        ...state,
        requests: listUpdate(state.requests, cast(action.payload)),
      };

    case INVENTORY_CANCEL_SUCCESS:
    case INVENTORY_REMOVE_RETRIEVAL:
      return {
        ...state,
        requests: state.requests.filter(item => item.id !== action.payload),
      };

    case ARCHIVE_DELETE_SUCCESS:
      return {
        ...state,
        archives: state.archives.filter(item => item.id !== action.payload),
      };

    case INVENTORY_REMOVE_SUCCESS:
      return {
        ...state,
        list: state.list.filter(
          item => item.vaultName !== action.payload
        ),
        archives: state.archives.filter(
          item => item.vaultName !== action.payload
        ),
        requests: state.requests.filter(
          item => item.vaultName !== action.payload
        ),
      };

    default:
      return state;
  }
}
