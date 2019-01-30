const async_hooks = require("async_hooks");
const fs = require("fs");

const targetExecutionContext = false;

const whatTimeIsIt = function(cb) {
  setInterval(function() {
    fs.writeSync(
      1,
      "When the set interval runs, the execution context is " +
        async_hooks.executionAsyncId() +
        "\n"
    );
    cb(Date.now());
  }, 1000);
};

whatTimeIsIt(function(time) {
  fs.writeSync(1, "The time is " + time + "\n");
});

const hooks = {
  init(asyncId, type, triggerAsyncId, resource) {
    fs.writeSync(1, "Hook init " + asyncId + "\n");
  },
  before(asyncId) {
    fs.writeSync(1, "Hook before " + asyncId + "\n");
  },
  after(asyncId) {
    fs.writeSync(1, "Hook after " + asyncId + "\n");
  },
  destroy(asyncId) {
    fs.writeSync(1, "Hook destroy " + asyncId + "\n");
  },
  promiseResolve(asyncId) {
    fs.writeSync(1, "Hook promiseResolve " + asyncId + "\n");
  },
};

const asyncHook = async_hooks.createHook(hooks);
asyncHook.enable();
