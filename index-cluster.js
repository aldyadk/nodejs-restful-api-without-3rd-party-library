const cluster = require("cluster");
const os = require("os");

const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");

const app = {};

app.init = function(cb) {
  if (cluster.isMaster) {
    workers.init();
    setTimeout(function() {
      cli.init();
      cb();
    }, 50);
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }
  } else {
    server.init();
  }
};

//self invoked only if required directly
if (require.main === module) {
  app.init(function() {});
}

module.exports = app;
