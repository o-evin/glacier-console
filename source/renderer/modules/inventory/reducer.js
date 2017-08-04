import listUpdate from '../../helpers/list_update';
import {Archive, Inventory} from '../../../contracts/entities';

import {
  ARCHIVE_DELETE_SUCCESS,
  INVENTORY_LIST_SUCCESS,
  INVENTORY_UPDATE_SUCCESS,
} from '../../../contracts/enums/action_types';

const compare = (a, b) => (b.createdAt - a.createdAt);

function updateInventory(state, data) {

  if(!Array.isArray(data)) {
    data = [data];
  }

  const archives = data.reduce((entries, inventory) => {
    return entries.filter(
      item => item.vaultName !== inventory.vaultName
    ).concat(inventory.archives ?
      inventory.archives.splice(0, inventory.archives.length) : []
    );
  }, state.archives || []).map(item => new Archive(item));

  const inventories = data.map(item => new Inventory(item));

  return {
    ...state,
    archives: archives.sort(compare),
    list: listUpdate(state.list, inventories),
  };

}


export default function(state = {}, action) {
  switch (action.type) {

    case INVENTORY_LIST_SUCCESS:
    case INVENTORY_UPDATE_SUCCESS:
      return updateInventory(state, action.payload);

    case ARCHIVE_DELETE_SUCCESS:
      return {
        ...state,
        archives: state.archives.filter(item => item.id !== action.payload),
      };

    default:
      return state;
  }
}
