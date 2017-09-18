import uuid from 'uuid';
import {isNil, isFunction, isDataObject, isEmpty} from 'lodash';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        switch (key) {
          case 'criterion':
            if(isEmpty(value) || !isDataObject(value)) {
              throw new TypeError('Wait criterion is invalid');
            }
            break;
          case 'handler':
            if(!isFunction(value)) {
              throw new TypeError('Job Handler must be a function');
            }
            break;
        }

        object[key] = value;
        return true;
      },
    });
  }
}


export default class WaiterJob extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.id = uuid.v4();
    this.handler = raw.handler;
    this.criterion = raw.criterion;
    this.reference = raw.reference;

  }

}
