import {ActionType} from '../../../contracts/enums';
import {Retrieval} from '../../../contracts/entities';

const actions = {
  create: ActionType.RETRIEVAL_CREATE_SUCCESS,
  update: ActionType.RETRIEVAL_UPDATE_SUCCESS,
  remove: ActionType.RETRIEVAL_DELETE_SUCCESS,
  list: ActionType.RETRIEVAL_LIST_SUCCESS,
};

import Dispatcher from './dispatcher';
import IndexedStore from '../indexed_store';

export default class RetrievalStore extends Dispatcher {

  constructor() {
    super(actions);
    this.indexed = new IndexedStore();
  }

  reset() {
    return this.indexed.reset('Retrievals');
  }

  close() {
    return this.indexed.close('Retrievals');
  }

  subscribe(dispatch) {
    const unsubscribe = super.subscribe(dispatch);
    this.list(); // initial data load
    return unsubscribe;
  }

  create(value) {
    return this.indexed.create('Retrievals', value)
      .then(data => new Retrieval(data));
  }

  update(value) {
    return this.indexed.update('Retrievals', value)
      .then(data => new Retrieval(data));
  }

  remove(value) {
    return this.indexed.remove('Retrievals', value.id);
  }

  get(id) {
    return this.indexed.get('Retrievals', id)
      .then(data => data && new Retrieval(data));
  }

  list() {
    return this.indexed.list('Retrievals')
      .then(data => data.map(item => new Retrieval(item)));
  }

  find(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.getMany('Retrievals', key, value)
      .then(data => data.map(item => new Retrieval(item)));
  }

  findOne(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.findBy('Retrievals', key, value)
      .then(data => data && new Retrieval(data));
  }

}
