const { AsyncLocalStorage } = require("async_hooks");

class RequestContext {
  constructor() {
    this.storage = new AsyncLocalStorage();
  }

  run(context, callback) {
    this.storage.run(context, callback);
  }

  get(key) {
    return this.storage.getStore()?.[key] || null;
  }
}

module.exports = new RequestContext();
