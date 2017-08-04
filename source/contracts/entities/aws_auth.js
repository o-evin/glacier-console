import {isNil} from  'lodash';

import {AwsRegion} from '../enums';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
            case 'region':
              if (Object.values(AwsRegion).indexOf(value) < 0) {
                throw new Error('Region is not valid.');
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


export default class AwsAuth extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.key = raw.key;
    this.secret = raw.secret;
    this.region = raw.region;
  }
}
