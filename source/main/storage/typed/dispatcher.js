export default class Dispatcher {
  constructor(actions = []) {

    this.listeners = [];

    return new Proxy(this, {
      get: (instance, key, receiver) => {

        const method = instance[key];

        if(!actions.hasOwnProperty(key)) {
          return method;
        }


        return (...args) => {
          return method.apply(instance, args)
            .then((payload) => {
              return instance.dispatch(actions[key], payload);
            });
        };

      },
    });

  }

  subscribe(listener) {
    this.listeners.push(listener);

    const unsubscribe = () => {
      this.listeners.splice(this.listeners.indexOf(listener), 1);
    };

    return unsubscribe;
  }

  dispatch(event, payload) {

    for(let listener of this.listeners) {
      listener({type: event, payload});
    }

    return payload;
  }
}
