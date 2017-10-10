import {Inventory, Retrieval} from '../../../contracts/entities';
import {ActionType} from '../../../contracts/enums';

const actions = {
  list: ActionType.INVENTORY_LIST_SUCCESS,
  update: ActionType.INVENTORY_UPDATE_SUCCESS,
  remove: ActionType.INVENTORY_REMOVE_SUCCESS,
  listRetrievals: ActionType.INVENTORY_INIT_SUCCESS,
  removeRetrieval: ActionType.INVENTORY_REMOVE_RETRIEVAL,
};

import Dispatcher from './dispatcher';
import IndexedStore from '../indexed_store';

export default class InventoryStore extends Dispatcher {

  constructor() {
    super(actions);
    this.indexed = new IndexedStore();
  }

  reset() {
    return this.indexed.reset('InventoryRetrievals')
      .then(() => this.indexed.reset('Inventory'));
  }

  close() {
    return this.indexed.close('InventoryRetrievals')
      .then(() => this.indexed.close('Inventory'));
  }

  create(value) {
    return this.indexed.create('Inventory', value)
      .then(data => new Inventory(data));
  }

  subscribe(dispatch) {
    const unsubscribe = super.subscribe(dispatch);
    this.list(); // initial data load
    this.listRetrievals(); // initial data load
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
    const vaultName = value.vaultName || value;

    return this.findOneRetrieval({vaultName})
      .then((retrieval) => {
        if(retrieval) {
          return this.removeRetrieval(retrieval);
        }
      })
      .then(() => {
        return this.indexed.remove('Inventory', vaultName);
      });
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

  createRetrieval(value) {
    return this.indexed.create('InventoryRetrievals', value)
      .then(data => new Retrieval(data));
  }

  updateRetrieval(value) {
    return this.indexed.update('InventoryRetrievals', value)
      .then(data => new Retrieval(data));
  }

  getRetrieval(id) {
    return this.indexed.get('InventoryRetrievals', id)
      .then(data => data && new Retrieval(data));
  }

  listRetrievals() {
    return this.indexed.list('InventoryRetrievals')
      .then(data => data.map(item => new Retrieval(item)));
  }

  findOneRetrieval(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.findBy('InventoryRetrievals', key, value)
      .then(data => data && new Retrieval(data));
  }

  findRetrievals(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.getMany('InventoryRetrievals', key, value)
      .then(data => data.map(item => new Retrieval(item)));
  }

  removeRetrieval(value) {
    return this.indexed.remove('InventoryRetrievals', value.id);
  }

}
