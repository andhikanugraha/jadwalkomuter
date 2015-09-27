var storage = {
  get(key) {
    if (key === undefined) {
      return undefined;
    }

    return JSON.parse(window.localStorage.getItem(key));
  },
  set(key, value) {
    if (key === undefined) {
      return undefined;
    }

    window.localStorage.setItem(key, JSON.stringify(value));

    var listeners = storage.eventListeners[key];
    if (listeners !== undefined) {
      listeners.forEach(listener => {
        listener(value);
      });
    }
  },
  toggle(key) {
    return storage.set(key, !storage.get(key));
  },
  eventListeners: {},
  bind(key, callback, execute) {
    var eventListeners = storage.eventListeners;
    if (eventListeners[key] === undefined) {
      eventListeners[key] = [];
    }
    eventListeners[key].push(callback);

    if (execute) {
      callback(storage.get(key));
    }
  },
  setDefault(key, defaultValue) {
    if (storage.get(key) === null) {
      storage.set(key, defaultValue);
    }
  }
};

module.exports = storage;