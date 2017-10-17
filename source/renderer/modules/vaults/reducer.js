import {listUpdate} from '../../helpers';
import {Vault} from '../../../contracts/entities';

import {
  VAULT_GET_SUCCESS,
  VAULT_UPDATE_SUCCESS,
  VAULT_CREATE_SUCCESS,
  VAULT_LIST_SUCCESS,
  VAULT_DELETE_SUCCESS,
} from '../../../contracts/enums/action_types';

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

function cast(data) {
  return Array.isArray(data) ?
    data.map(item => new Vault(item)) : new Vault(data);
}

export default function(state = {}, action) {

  switch (action.type) {
    case VAULT_GET_SUCCESS:
    case VAULT_UPDATE_SUCCESS:
    case VAULT_CREATE_SUCCESS:
    case VAULT_LIST_SUCCESS:
      return {
        ...state,
        list: listUpdate(state.list, cast(action.payload))
          .sort((a, b) => collator.compare(a.name, b.name)),
      };

    case VAULT_DELETE_SUCCESS:
      return {
        ...state,
        list: state.list.filter(item => item.id !== action.payload),
      };

    default:
      return state;
  }
}
