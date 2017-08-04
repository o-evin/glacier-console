import {isFunction} from 'lodash';

import Uploader from './uploader';
import Receiver from './receiver';

export default class Queuer {

  constructor() {
    this.uploader = new Uploader();
    this.receiver = new Receiver();
  }

  subscribe(listener) {
    if(!isFunction(listener)) {
      throw new Error('Listener must be a function.');
    }

    const unsubscribe = [
      this.uploader.subscribe(listener),
      this.receiver.subscribe(listener),
    ];

    return () => unsubscribe.forEach(unsubscribe => unsubscribe());
  }

  start() {
    return Promise.all([
      this.uploader.start(),
      this.receiver.start(),
    ]);
  }

  stop() {
    return Promise.all([
      this.uploader.stop(),
      this.receiver.stop(),
    ]);
  }

  isProcessing() {
    return this.uploader.isProcessing() || this.receiver.isProcessing();
  }

}
