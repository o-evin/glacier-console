import {isNil} from  'lodash';
import {Time} from '../const';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
            case 'rate':
              if (!Number.isInteger(value)) {
                value = parseInt(value);
              }
              break;
            case 'eta':
              if (!(value instanceof Date)) {
                value = new Date(value);
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


export default class TransferStats extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.size = 0;
    this.finished = 0;
    this.transfered = 0;

    this.rate = null;
    this.duration = null;
    this.startDate = null;

    this.update(raw);
  }

  get completion() {
    return Math.round((this.finished / this.size) * 100) || 0;
  }

  update({size = 0, finished = 0}) {

    if(this.startDate !== null && size !== finished) {

      const sizeDrop = this.size > size ? this.size - size : 0;
      this.transfered += (finished - this.finished) + sizeDrop;

      if(!isFinite(this.transfered) || this.transfered < 0) {
        this.reset();
      } else {
        const timeframe = Date.now() - this.startDate;
        this.rate = Math.round(
          this.transfered / (timeframe / Time.SECOND_IN_MILISECONDS)
        );

        const duration = Math.round((size - finished) / this.rate);
        this.duration = duration > Time.YEAR_IN_SECONDS ? 0 :
          (this.duration + duration) / 2;
      }

    } else {
      this.rate = 0;
      this.duration = 0;
      this.startDate = new Date();
    }

    this.size = size;
    this.finished = finished;
  }

  reset() {
    this.rate = 0;
    this.duration = 0;
    this.transfered = 0;
    this.startDate = null;
    this.lastUpdate = null;
  }

}
