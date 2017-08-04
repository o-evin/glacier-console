import {Transfer, Time} from '../../contracts/const';
import {QueueRejectError} from '../../contracts/errors';
import {RequestType, QueueStatus} from '../../contracts/enums';

class Counter {
  constructor() {

    this.counter = [];
    this.listeners = [];

    const self = {
      subscribe: (listener) => {
        this.listeners.push(listener);

        const unsubscribe = () => {
          this.listeners.splice(this.listeners.indexOf(listener), 1);
        };

        return unsubscribe;
      },

      notify: () => {
        this.listeners.forEach(listener => listener.call());
      },

      isEmpty: () =>  {
        for(let key in this.counter) {
          if(this.counter[key]) return false;
        }
        return true;
      },
    };

    return new Proxy(this.counter, {
      get(target, property) {
        if(self.hasOwnProperty(property)) {
          return self[property];
        }
        return target[property];
      },
      set: (target, property, value) => {
        target[property] = value;
        self.notify();
        return true;
      },

    });
  }

}

export default class Queue {

  constructor(options = {requestRate: Transfer.REQUEST_RATE}) {
    this.queue = [];
    this.interval = null;
    this.counter = new Counter();
    this.status = QueueStatus.PENDING;
    this.intervalPeriod = Time.SECOND_IN_MILISECONDS / options.requestRate;
  }

  next() {
    const item = this.queue.shift();

    if(this.isLimitExceeded(item.type)) {
      return this.queue.push(item);
    }

    item.runner();
  }

  isLimitExceeded(type) {

    if(type === RequestType.GENERAL) {
      return false;
    }

    if(type === RequestType.UPLOAD_PART) {
      const uploadLimit = global.config.get('transfer.maximumActiveParts',
        Transfer.ACTIVE_PARTS_LIMIT
      );

      return this.counter[type] >= uploadLimit;
    }

    if(type === RequestType.DOWNLOAD_PART) {
      const downloadLimit = global.config.get('transfer.maximumActiveParts',
        Transfer.ACTIVE_PARTS_LIMIT
      );

      return this.counter[type] >= downloadLimit;
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

  push(data, type = RequestType.GENERAL, refId) {

    if(this.status !== QueueStatus.PROCESSING) throw new QueueRejectError();

    const handlers = Array.isArray(data) ? data : [data];

    if(!this.counter[type]) {
      this.counter[type] = 0;
    }

    if(!this.counter[refId]) {
      this.counter[refId] = 0;
    }

    this.initInterval();

    return Promise.all(
      handlers.map(item => this.deferred(item, type, refId))
    ).then((response) => {
      return Array.isArray(data) ? response : response.shift();
    });
  }

  deferred(handler, type, refId) {
    return new Promise((resolve, reject) => {

      const runner = () => {
        this.counter[type] += 1;
        this.counter[refId] += 1;

        handler()
          .then(resolve, reject)
          .then(() => {
            this.counter[type] -= 1;
            this.counter[refId] -= 1;
          });
      };

      this.queue.push({runner, type, refId});
    });
  }

  remove(refId) {
    return new Promise((resolve, reject) => {
      this.queue = this.queue.filter(
        item => item.refId !== refId
      );

      if(this.counter[refId]) {
        const unsubscribe = this.counter.subscribe(() => {
          if(!this.counter[refId]) {
            unsubscribe();
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  stop() {
    this.status = QueueStatus.PENDING;
    this.queue = [];

    return new Promise((resolve, reject) => {
      if(!this.counter.isEmpty()) {
        const unsubscribe = this.counter.subscribe(() => {
          if(this.counter.isEmpty()) {
            unsubscribe();
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  start() {
    this.status = QueueStatus.PROCESSING;
  }

  isProcessing() {
    return this.queue.length > 0 || !this.counter.isEmpty();
  }

}
