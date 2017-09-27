import {isNil} from 'lodash';
import {RequestType} from '../../contracts/enums';

export default class Counter {
  constructor() {
    this.counter = [];
  }

  isEmpty() {
    for(let type in this.counter) {
      if(this.counter[type]) return false;
    }
    return true;
  }

  add(type) {
    if(isNil(this.counter[type])) {
      this.counter[type] = 0;
    }

    this.counter[type] += 1;
  }

  remove(type) {
    this.counter[type] -= 1;
  }

  get(type) {
    return this.counter[type] || 0;
  }

  getSlots(type) {

    if(type === RequestType.UPLOAD_PART) {
      const {maximumActiveParts} = global.config.get('transfer');
      return maximumActiveParts - this.get(type);
    }

    if(type === RequestType.DOWNLOAD_PART) {
      const {maximumActiveParts} = global.config.get('transfer');
      return maximumActiveParts - this.get(type);
    }

    return Number.MAX_SAFE_INTEGER;
  }

}
