import Queue from './queue';
import {Transfer} from '../../contracts/const';
import {RequestType} from '../../contracts/enums';
import {WaiterJob} from '../../contracts/entities';

import logger from '../../utils/logger';
const debug = logger('executor:waiter');

export default class Waiter {

  constructor(options = {}) {

    const {timeout = Transfer.STATUS_INTERVAL} = options;

    this.timers = new Map();
    this.queue = new Queue();
    this.queue.start();
    this.timeout = timeout;
  }

  push(handler, criterion, options = {}) {
    let {reference} = options;

    if(reference && Object(reference)) {
      reference = reference.id;
    }

    debug('PUSH WAITER', handler.name, criterion);

    return this.deferred(
      new WaiterJob({handler, reference, criterion})
    );
  }

  deferred(job) {
    return new Promise((resolve, reject) => {
      this.wait(job, resolve, reject);
    });
  }

  wait(job, resolve, reject) {
    const {handler, reference} = job;

    debug('CHECK', handler.name);

    this.queue.push(handler, {type: RequestType.WAITER, reference})
      .then((response) => {

        const {criterion} = job;

        const [key] = Object.keys(criterion);
        const [value] = Object.values(criterion);

        if(response[key] === undefined) {
          throw new TypeError(`Waiter criterion '${key}' is incorrect.`);
        }

        if(!this.timers.has(reference)) {
          this.timers.set(reference, []);
        }

        const timers = this.timers.get(reference);

        if(response[key] !== value) {
          debug('CONTINUE %s (expected: %s, received: %s)',
            handler.name, value, response[key]);

          const timeout = setTimeout(() => {
            this.wait(job, resolve, reject);
            timers.splice(timers.indexOf(timeout), 1);
          }, this.timeout);

          timers.push(timeout);

        } else {
          if(timers.length === 0) {
            this.timers.delete(reference);
          }

          debug('READY', handler.name);
          resolve(response);
        }
      })
      .catch(reject);
  }

  start() {
    return this.queue.start();
  }

  stop() {
    this.timers.forEach((timers) => {
      timers.forEach(clearTimeout);
    });

    this.timers.clear();
    return this.queue.stop();
  }

  remove(entry) {
    const reference = entry === Object(entry) ? entry.id : entry;
    const timers = this.timers.get(reference);

    if(timers) {
      timers.forEach(clearTimeout);
      this.timers.delete(reference);
    }

    return this.queue.remove(reference);
  }

}
