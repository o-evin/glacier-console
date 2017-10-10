import path from 'path';
import {isNil} from  'lodash';

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
            case 'size':
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


export default class Archive extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.id = raw.id;
    this.vaultName = raw.vaultName;
    this.size = raw.size;
    this.checksum = raw.checksum;
    this.createdAt = raw.createdAt;
    this.description = raw.description;

    Object.defineProperty(this, 'title', {
      enumerable: true,
      get: () => {
        return path.basename(this.description);
      },
    });
  }


}
