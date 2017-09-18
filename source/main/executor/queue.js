import Debug from 'debug';
import ObservableCounter from './counter';

import {QueueJob} from '../../contracts/entities';
import {Transfer, Time} from '../../contracts/const';
import {RequestType, QueueStatus} from '../../contracts/enums';
import {HandledRejectError, QueueRejectError} from '../../contracts/errors';

const debug = new Debug('executor:queue');

export default class Queue {

  constructor(options = {requestRate: Transfer.REQUEST_RATE}) {

    this.queue = [];
    this.running = new Map();
    this.status = QueueStatus.PENDING;

    this.counter = new ObservableCounter();

    this.interval = null;
    this.intervalPeriod = Time.SECOND_IN_MILISECONDS / options.requestRate;
  }

  next() {
    const item = this.queue.shift();

    if(this.isLimitExceeded(item.type)) {
      return this.queue.push(item);
    }

    item.run();
  }

  isLimitExceeded(type) {

    if(type === RequestType.GENERAL) {
      return false;
    }

    if(type === RequestType.UPLOAD_PART) {
      const {maximumActiveParts} = global.config.get('transfer');
      return this.counter.get(type) >= maximumActiveParts;
    }

    if(type === RequestType.DOWNLOAD_PART) {
      const {maximumActiveParts} = global.config.get('transfer');
      return this.counter.get(type) >= maximumActiveParts;
    }

    return false;
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
      type = RequestType.GENERAL,
      reference = RequestType.GENERAL,
    } = options;

    const jobs = [].concat(handlers).map(
      handler => new QueueJob({handler, type, reference})
    );

    this.initInterval();

    return Promise.all(
      jobs.map(this.deferred.bind(this))
    ).then((response) => {
      return Array.isArray(handlers) ? response : response.shift();
    });
  }

  deferred(job, attempt = 0) {

    return new Promise((resolve, reject) => {

      job.run = () => {
        debug('RUNNING %s (type: %s)',
          job.handler.name, job.type
        );

        if(attempt === 0) {
          this.counter.add(job);
          this.running.set(job.id, job);
        }

        this.execute(job)
          .then(resolve)
          .catch((error) => {
            if(!(error instanceof HandledRejectError)) {

              debug('ERROR %s (type: %s, reference: %s): %O',
                job.handler.name, job.type, job.reference, error
              );

              if(attempt <= Transfer.QUEUE_RETRY_ATTEMPTS) {
                debug('RETRY %s attempt %s (type: %s, reference: %s)',
                  job.handler.name, attempt, job.type, job.reference
                );

                return this.deferred(job, ++attempt);
              }

              reject(error);
            }
          })
          .then(() => {
            if(attempt === 0) {
              this.counter.remove(job);
              this.running.delete(job.id);
            }
          });
      };

      this.queue.push(job);

    });
  }

  execute(job) {

    return new Promise((resolve, reject) => {
      let isCancelled = false;

      job.cancel = () => {
        debug('CANCELLED  %s (type: %s)', job.handler.name, job.type);
        isCancelled = true;
        reject(new HandledRejectError());
      };

      return job.handler()
        .then((response) => {
          if(!isCancelled) {
            debug('DONE %s (type: %s)', job.handler.name, job.type);
            resolve(response);
          }
        })
        .catch((error) => {
          if(!isCancelled) {
            reject(error);
          }
        });
    });

  }

  remove(entry) {
    return new Promise((resolve, reject) => {
      const reference = entry === Object(entry) ? entry.id : entry;

      this.queue = this.queue.filter(
        item => item.reference !== reference
      );

      if(this.counter.get(reference)) {
        const unsubscribe = this.counter.subscribe(() => {
          if(!this.counter.get(reference)) {
            unsubscribe();
            resolve();
          }
        });

        this.running.forEach(
          job => job.reference === reference && job.cancel()
        );

      } else {
        resolve();
      }
    });
  }

  stop() {
    this.status = QueueStatus.PENDING;
    this.queue.length = 0;

    return new Promise((resolve, reject) => {

      if(!this.counter.isEmpty()) {
        const unsubscribe = this.counter.subscribe(() => {
          if(this.counter.isEmpty()) {
            unsubscribe();
            resolve();
          }
        });

        this.running.forEach(job => job.cancel());

      } else {
        resolve();
      }

    });
  }

  start() {
    this.status = QueueStatus.PROCESSING;
  }

  isProcessing() {
    return this.queue.length > 0 || this.running.size > 0;
  }

}
