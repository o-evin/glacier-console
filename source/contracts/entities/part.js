import {isNil} from  'lodash';

import {PartStatus} from '../enums';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
            case 'status':
              if (Object.values(PartStatus).indexOf(value) < 0) {
                throw new Error('Part status is not valid.');
              }
              break;
            case 'size':
            case 'position':
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


export default class Part extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.id = raw.id;
    this.range = raw.range;
    this.parentId = raw.parentId;
    this.checksum = raw.checksum;
    this.status = raw.status;
    this.position = raw.position;
    this.size = raw.size;
  }

}
