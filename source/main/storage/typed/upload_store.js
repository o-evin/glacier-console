import {Upload} from '../../../contracts/entities';
import {ActionType} from '../../../contracts/enums';

const actions = {
  update: ActionType.UPLOAD_UPDATE_SUCCESS,
  remove: ActionType.UPLOAD_DELETE_SUCCESS,
  list: ActionType.UPLOAD_LIST_SUCCESS,
};

import Dispatcher from './dispatcher';
import IndexedStore from '../indexed_store';

export default class UploadeStore extends Dispatcher {

  constructor() {
    super(actions);
    this.indexed = new IndexedStore();
  }

  reset() {
    return this.indexed.reset('Uploads');
  }

  close() {
    return this.indexed.close('Uploads');
  }

  create(value) {
    return this.indexed.create('Uploads', value)
      .then(data => new Upload(data));
  }

  subscribe(dispatch) {
    const unsubscribe = super.subscribe(dispatch);
    this.list(); // initial data load
    return unsubscribe;
  }

  update(value) {
    return this.indexed.update('Uploads', value)
      .then(data => new Upload(data));
  }

  remove(value) {
    return this.indexed.remove('Uploads', value.id);
  }

  get(id) {
    return this.indexed.get('Uploads', id)
      .then(data => data && new Upload(data));
  }

  list() {
    return this.indexed.list('Uploads')
      .then(data => data.map(item => new Upload(item)));
  }

  find(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.getMany('Uploads', key, value)
      .then(data => data.map(item => new Upload(item)));
  }

  findOne(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.findBy('Uploads', key, value)
      .then(data => data && new Upload(data));
  }

}
