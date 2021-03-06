import uuid from 'uuid';
import {isNil, isFunction} from 'lodash';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        switch (key) {
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


export default class QueueJob extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.id = uuid.v4();

    this.params = raw.params;
    this.context = raw.context;
    this.handler = raw.handler;

    this.type = raw.type;
    this.reference = raw.reference;

    this.reject = null;
    this.resolve = null;
    this.cancel = null;
  }

}
