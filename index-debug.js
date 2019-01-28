const server = require("./lib/server");
const workers = require("./lib/workers");
const cli = require("./lib/cli");
const exampleDebuggingProblem = require("./lib/exampleDebuggingProblem");

const app = {};

app.init = function() {
  debugger;
  server.init();
  debugger;
  debugger;
  workers.init();
  debugger;
  debugger;
  setTimeout(function() {
    cli.init();
    debugger;
  }, 50);
  debugger;
  let foo = 1;
  console.log("just assigned 1 to foo");
  debugger;
  foo++;
  console.log("just incremented foo");
  debugger;
  foo = foo * foo;
  console.log("just squared foo");
  debugger;
  foo = foo.toString();
  console.log("just converted foo to string");
  debugger;
  exampleDebuggingProblem.init();
  console.log("just called the library");
  debugger;
};

app.init();

module.exports = app;
