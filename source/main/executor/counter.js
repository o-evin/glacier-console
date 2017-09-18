import {isNil} from 'lodash';

export default class ObservableCounter {
  constructor() {
    this.counter = [];
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);

    const unsubscribe = () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };

    return unsubscribe;
  }

  notify() {
    if(!this.listeners.length) return;
    this.listeners.forEach(listener => listener.call());
  }

  isEmpty() {
    for(let key in this.counter) {
      if(this.counter[key]) return false;
    }
    return true;
  }

  add(job) {
    if(isNil(this.counter[job.type])) {
      this.counter[job.type] = 0;
    }

    if(isNil(this.counter[job.reference])) {
      this.counter[job.reference] = 0;
    }

    this.counter[job.type] += 1;
    this.counter[job.reference] += 1;

    this.notify();
  }

  remove(job) {
    this.counter[job.type] -= 1;
    this.counter[job.reference] -= 1;

    this.notify();
  }

  get(key) {
    return this.counter[key];
  }

}
