const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");

const app = {};

app.init = function(cb) {
  server.init();
  workers.init();
  setTimeout(function() {
    cli.init();
    cb();
  }, 50);
};

//self invoked only if required directly
if (require.main === module) {
  app.init(function() {});
}

module.exports = app;
