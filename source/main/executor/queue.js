import Debug from 'debug';
import Waiter from './waiter';
import Counter from './counter';

import {QueueJob} from '../../contracts/entities';
import {Transfer, Time} from '../../contracts/const';
import {RequestType, QueueStatus} from '../../contracts/enums';
import {QueueRejectError, HandledRejectionError} from '../../contracts/errors';

const debug = new Debug('executor:queue');

export default class Queue {

  constructor(options = {requestRate: Transfer.REQUEST_RATE}) {
    this.queue = [];
    this.running = [];
    this.status = QueueStatus.PENDING;

    this.counter = new Counter();

    this.interval = null;
    this.intervalPeriod = Time.SECOND_IN_MILISECONDS / options.requestRate;
  }

  next() {
    const next = this.queue.find(
      item => this.counter.getSlots(item.type) > 0
    );

    if(next) {
      this.queue.splice(this.queue.indexOf(next), 1);
      this.runner(next);
    }
  }

  initInterval() {
    if(!this.interval)  {
      this.interval = setInterval(() => {
        if(this.status === QueueStatus.PROCESSING && this.queue.length > 0) {
          this.next();
        } else {
          this.interval = clearInterval(this.interval);
        }
      }, this.intervalPeriod);
    }
  }

  push(handlers, options = {}) {

    if(this.status !== QueueStatus.PROCESSING) {
      throw new QueueRejectError();
    }

    const {
      params,
      context,
      type = RequestType.GENERAL,
      reference = RequestType.GENERAL,
    } = options;

    const jobs = [].concat(handlers).map(
      handler => new QueueJob({handler, type, reference, params, context})
    );

    this.queue.push(...jobs);

    this.initInterval();

    return Promise.all(
      jobs.map(job => this.deferred(job))
    )
      .then((response) => {
        jobs.length = 0;
        return Array.isArray(handlers) ? response : response.shift();
      })
      .catch((error) => {
        throw error;
      });
  }

  deferred(job) {
    return new Promise((resolve, reject) => {
      job.resolve = resolve;
      job.reject = reject;
    });
  }

  runner(job, attempt = 0) {
    debug('RUNNING %s (type: %s)', job.handler.name, job.type);

    if(attempt === 0) {
      this.counter.add(job.type);
      this.running.push(job);
    }

    const {handler, context, params} = job;

    return Promise.race([
      handler.apply(context, params),
      new Promise((resolve, reject) =>
        job.cancel = () => reject(new HandledRejectionError())
      ),
    ])
      .then(job.resolve)
      .catch((error) => {

        if(!(error instanceof HandledRejectionError)) {
          debug('ERROR %s (type: %s, reference: %s): %O',
            handler.name, job.type, job.reference, error
          );

          if(attempt <= Transfer.QUEUE_RETRY_ATTEMPTS) {
            debug('RETRY %s attempt %s (type: %s, reference: %s)',
              handler.name, attempt, job.type, job.reference
            );

            return this.runner(job, attempt + 1);
          }
        } else {
          debug('CANCELLED %s (type: %s)', handler.name, job.type);
        }

        job.reject(error);
      })
      .then(() => {
        if(attempt === 0) {
          this.counter.remove(job.type);
          this.running.splice(this.running.indexOf(job), 1);
        }
      });
  }

  remove(entry) {

    const reference = entry === Object(entry) ? entry.id : entry;

    this.queue = this.queue.filter(
      item => item.reference !== reference
    );

    this.running.forEach(
      item => item.reference === reference && item.cancel()
    );

    return new Waiter({timeout: this.intervalPeriod}).push(
      () => Promise.resolve(this.running.filter(
        item => item.reference === reference
      )),
      {length: 0}
    );
  }

  stop() {
    this.status = QueueStatus.PENDING;
    this.queue.length = 0;

    this.running.forEach(item => item.cancel());

    return new Waiter({timeout: this.intervalPeriod}).push(
      () => Promise.resolve(this.running),
      {length: 0}
    );
  }

  start() {
    this.status = QueueStatus.PROCESSING;
  }

  isProcessing() {
    return this.queue.length > 0 || this.running.length > 0;
  }

}
