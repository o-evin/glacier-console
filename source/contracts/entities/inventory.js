import {isNil} from 'lodash';

import {Archive} from './';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
            case 'createdAt':
              if (!(value instanceof Date)) {
                value = new Date(value);
              }
              break;
            case 'sizeInBytes':
            case 'numberOfArchives':
              if (!Number.isInteger(value)) {
                value = parseInt(value);
              }
              break;
          }
        }

        object[key] = value;
        return true;
      },
    });
  }
}


export default class Inventory extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.vaultName = raw.vaultName;
    this.createdAt = raw.createdAt;
    this.sizeInBytes = raw.sizeInBytes;
    this.numberOfArchives = raw.numberOfArchives;

    if(raw.archives && raw.archives.length > 0) {
      this.archives = raw.archives.map(item => new Archive(item));
    }

    Object.defineProperty(this, 'id', {
      enumerable: true,
      get: () => {
        return this.vaultName;
      },
    });
  }

}
