import {isNil, isEqual} from 'lodash';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
            case 'createdAt':
            case 'lastInventoryDate':
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


export default class Vault extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.name = raw.name;
    this.createdAt = raw.createdAt;
    this.sizeInBytes = raw.sizeInBytes;
    this.numberOfArchives = raw.numberOfArchives;
    this.lastInventoryDate = raw.lastInventoryDate;

    Object.defineProperty(this, 'id', {
      enumerable: true,
      get: () => {
        return this.name;
      },
    });
  }


  equal(other) {
    if(!(other instanceof Vault)) {
      other = new Vault(other);
    }

    return isEqual(this, other);
  }

  static parse(data) {
    try {
      return new Vault(data);
    } catch(err) {
      return false;
    }
  }
}
