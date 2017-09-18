import Debug from 'debug';
import Queue from './queue';

import {Transfer} from '../../contracts/const';
import {RequestType} from '../../contracts/enums';
import {WaiterJob} from '../../contracts/entities';

const debug = new Debug('executor:waiter');

export default class Waiter {

  constructor(queue) {
    this.queue = new Queue();
  }

  push(handler, criterion, options = {}) {
    const {reference} = options;

    return this.deferred(
      new WaiterJob({handler, reference, criterion})
    );
  }

  deferred(job) {
    return new Promise((resolve, reject) => {
      this.wait(job, resolve).catch(reject);
    });
  }

  wait(job, resolve) {
    const {handler, reference} = job;

    debug('REQUEST UPDATE', handler.name);

    return this.queue.push(handler, {type: RequestType.WAITER, reference})
      .then((response) => {

        const {criterion} = job;

        const [key] = Object.keys(criterion);
        const [value] = Object.values(criterion);

        if(response[key] === undefined) {
          throw new TypeError(`Waiter criterion '${key}' is incorrect.`);
        }

        if(response[key] !== value) {
          debug('CONTINUE WAIT', handler.name);

          return setTimeout(
            this.wait.bind(this, job, resolve),
            Transfer.STATUS_INTERVAL
          );
        }

        debug('READY', handler.name);
        resolve(value);
      });
  }

  stop() {
    throw Error('Not yet implemented');
  }

}
