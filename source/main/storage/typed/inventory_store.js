import {Inventory} from '../../../contracts/entities';
import {ActionType} from '../../../contracts/enums';

const actions = {
  list: ActionType.INVENTORY_LIST_SUCCESS,
  update: ActionType.INVENTORY_UPDATE_SUCCESS,
};

import Dispatcher from './dispatcher';
import IndexedStore from '../indexed_store';

export default class InventoryStore extends Dispatcher {

  constructor() {
    super(actions);
    this.indexed = new IndexedStore();
  }

  reset() {
    return this.indexed.reset('Inventory');
  }

  close() {
    return this.indexed.close('Inventory');
  }

  create(value) {
    return this.indexed.create('Inventory', value)
      .then(data => new Inventory(data));
  }

  subscribe(dispatch) {
    const unsubscribe = super.subscribe(dispatch);
    this.list(); // initial data load
    return unsubscribe;
  }

  update(value) {
    return this.get(value.id)
      .then((current) => {
        if(current === null) {
          return this.create(value);
        } else if(current.createdAt > value.createdAt) {
          return current;
        }
        return this.replace(value);
      });
  }

  replace(value) {
    return this.indexed.update('Inventory', value)
      .then(data => new Inventory(data));
  }

  remove(value) {
    return this.indexed.remove('Inventory', value.id);
  }

  get(id) {
    return this.indexed.get('Inventory', id)
      .then(data => data && new Inventory(data));
  }

  list() {
    return this.indexed.list('Inventory')
      .then(data => data.map(item => new Inventory(item)));
  }

  find(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.getMany('Inventory', key, value)
      .then(data => data.map(item => new Inventory(item)));
  }

  findOne(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.findBy('Inventory', key, value)
      .then(data => data && new Inventory(data));
  }

}
