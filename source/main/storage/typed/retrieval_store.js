import {RetrievalAction, ActionType} from '../../../contracts/enums';
import {Retrieval, Part} from '../../../contracts/entities';

const actions = {
  create: ActionType.RETRIEVAL_CREATE_SUCCESS,
  update: ActionType.RETRIEVAL_UPDATE_SUCCESS,
  remove: ActionType.RETRIEVAL_DELETE_SUCCESS,
  list: ActionType.RETRIEVAL_LIST_SUCCESS,
  updatePart: ActionType.RETRIEVAL_PART_UPDATE_SUCCESS,
  getParts: ActionType.RETRIEVAL_PART_LIST_SUCCESS,
};

import Dispatcher from './dispatcher';
import IndexedStore from '../indexed_store';

export default class RetrievalStore extends Dispatcher {

  constructor() {
    super(actions);
    this.indexed = new IndexedStore();
  }

  reset() {
    return this.indexed.reset('RetrievalParts')
      .then(() => this.indexed.reset('Retrievals'));
  }

  close() {
    return this.indexed.close('RetrievalParts')
      .then(() => this.indexed.close('Retrievals'));
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
    if(value.action === RetrievalAction.INVENTORY) {
      return this.indexed.remove('Retrievals', value.id);
    }
    return this.findParts({parentId: value.id})
      .then((parts) => {
        return Promise.all(parts.map(
          item => this.removePart(item.id)
        ));
      })
      .then(() => {
        return this.indexed.remove('Retrievals', value.id);
      });
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

  createPart(value) {
    return this.indexed.create('RetrievalParts', value)
      .then(data => new Part(data));
  }

  updatePart(value) {
    return this.indexed.update('RetrievalParts', value)
      .then(data => new Part(data));
  }

  getPart(id) {
    return this.indexed.get('RetrievalParts', id)
      .then(data => data && new Part(data));
  }

  getParts() {
    return this.indexed.list('RetrievalParts')
      .then(data => data.map(item => new Part(item)));
  }

  findParts(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.getMany('RetrievalParts', key, value)
      .then(data => data.map(item => new Part(item)));
  }

  removePart(id) {
    return this.indexed.remove('RetrievalParts', id);
  }

}
