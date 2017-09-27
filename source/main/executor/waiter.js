import Debug from 'debug';
import Queue from './queue';

import {Transfer} from '../../contracts/const';
import {RequestType} from '../../contracts/enums';
import {WaiterJob} from '../../contracts/entities';

const debug = new Debug('executor:waiter');

export default class Waiter {

  constructor(options = {}) {

    const {timeout = Transfer.STATUS_INTERVAL} = options;

    this.timers = [];
    this.listeners = [];
    this.queue = new Queue();
    this.queue.start();
    this.timeout = timeout;
  }

  subscribe(listener) {
    this.listeners.push(listener);

    const unsubscribe = () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };

    return unsubscribe;
  }

  push(handler, criterion, options = {}) {
    const {reference} = options;

    debug('PUSH WAITER', handler.name, criterion);

    return this.deferred(
      new WaiterJob({handler, reference, criterion})
    );
  }

  deferred(job) {
    return new Promise((resolve, reject) => {
      this.wait(job, resolve, reject);
    })
      .then((response) => {
        for(let listener of this.listeners) {
          listener(response);
        }
        return response;
      });
  }

  wait(job, resolve, reject) {
    const {handler, reference} = job;

    debug('CHECK', handler.name);

    return this.queue.push(handler, {type: RequestType.WAITER, reference})
      .then((response) => {

        const {criterion} = job;

        const [key] = Object.keys(criterion);
        const [value] = Object.values(criterion);

        if(response[key] === undefined) {
          throw new TypeError(`Waiter criterion '${key}' is incorrect.`);
        }

        if(response[key] !== value) {
          debug('CONTINUE %s (expected: %s, received: %s)',
            handler.name, value, response[key]);

          const timeout = setTimeout(() => {
            this.wait(job, resolve, reject);
            this.timers.splice(this.timers.indexOf(timeout), 1);
          }, this.timeout);

          return this.timers.push(timeout);
        }

        debug('READY', handler.name);
        resolve(response);
      })
      .catch(reject);
  }

  start() {
    return this.queue.start();
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers.length = 0;
    return this.queue.stop();
  }

  remove(item) {
    return this.queue.remove(item);
  }

}
