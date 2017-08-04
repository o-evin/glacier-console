import {Upload, Part} from '../../../contracts/entities';
import {ActionType} from '../../../contracts/enums';

const actions = {
  update: ActionType.UPLOAD_UPDATE_SUCCESS,
  remove: ActionType.UPLOAD_DELETE_SUCCESS,
  list: ActionType.UPLOAD_LIST_SUCCESS,
  updatePart: ActionType.UPLOAD_PART_UPDATE_SUCCESS,
  getParts: ActionType.UPLOAD_PART_LIST_SUCCESS,
};

import Dispatcher from './dispatcher';
import IndexedStore from '../indexed_store';

export default class UploadeStore extends Dispatcher {

  constructor() {
    super(actions);
    this.indexed = new IndexedStore();
  }

  reset() {
    return this.indexed.reset('UploadParts')
      .then(() => this.indexed.reset('Uploads'));
  }

  close() {
    return this.indexed.close('UploadParts')
      .then(() => this.indexed.close('Uploads'));
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
    return this.findParts({parentId: value.id})
      .then((parts) => {
        return Promise.all(parts.map(
          item => this.removePart(item.id)
        ));
      })
      .then(() => {
        return this.indexed.remove('Uploads', value.id);
      });
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

  createPart(value) {
    return this.indexed.create('UploadParts', value)
      .then(data => new Part(data));
  }

  updatePart(value) {
    return this.indexed.update('UploadParts', value)
      .then(data => new Part(data));
  }

  getPart(id) {
    return this.indexed.get('UploadParts', id)
      .then(data => data && new Part(data));
  }

  getParts() {
    return this.indexed.list('UploadParts')
      .then(data => data.map(item => new Part(item)));
  }

  findParts(criterion) {
    const [key] = Object.keys(criterion);
    const [value] = Object.values(criterion);
    return this.indexed.getMany('UploadParts', key, value)
      .then(data => data.map(item => new Part(item)));
  }

  removePart(id) {
    return this.indexed.remove('UploadParts', id);
  }

}
