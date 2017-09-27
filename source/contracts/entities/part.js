import {isNil} from  'lodash';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
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

    this.range = raw.range;
    this.position = raw.position;
    this.size = raw.size;
  }

}
