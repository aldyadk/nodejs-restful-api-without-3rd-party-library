process.env.NODE_ENV = "testing";

const unit = require("./unit");
const api = require("./api");

const _app = {};

_app.tests = {};

_app.tests.unit = unit;
_app.tests.api = api;

_app.runTests = function() {
  let errors = [];
  let successes = 0;
  let counter = 0;
  const limit = _app.countTests();
  for (let key in _app.tests) {
    if (_app.tests.hasOwnProperty(key)) {
      const subTests = _app.tests[key];
      for (let testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          (function() {
            let tmpTestName = testName;
            let testValue = subTests[testName];
            try {
              testValue(function() {
                //if it calls back without throwing, then it succeeded, so log it in green
                console.log("\x1b[32m%s\x1b[0m", tmpTestName);
                counter++;
                successes++;
                if (counter === limit) {
                  _app.produceTestReport(limit, successes, errors);
                }
              });
            } catch (e) {
              //If it throwns, then it failed. Log it in red.
              errors.push({
                name: tmpTestName,
                error: e,
              });
              console.log("\x1b[31m%s\x1b[0m", tmpTestName);
              counter++;
              if (counter === limit) {
                _app.produceTestReport(limit, successes, errors);
              }
            }
          })();
        }
      }
    }
  }
};

_app.countTests = function() {
  let counter = 0;
  for (var key in _app.tests) {
    if (_app.tests.hasOwnProperty(key)) {
      const subTests = _app.tests[key];
      for (var testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          counter++;
        }
      }
    }
  }
  return counter;
};

_app.produceTestReport = function(limit, successes, errors) {
  console.log("");
  console.log("--------------------BEGIN TEST REPORT--------------------");
  console.log("");
  console.log("Total Test: ", limit);
  console.log("Pass: ", successes);
  console.log("Fail: ", errors.length);
  console.log("");

  if (errors.length > 0) {
    console.log("-------------------BEGIN ERROR DETAILS-------------------");
    console.log("");
    errors.forEach(function(testError) {
      console.log("\x1b[31m%s\x1b[0m", testError.name);
      console.log(testError.error);
      console.log("");
    });
    console.log("");
    console.log("--------------------END ERROR DETAILS--------------------");
  }
  console.log("");
  console.log("---------------------END TEST REPORT---------------------");

  process.exit(0);
};

_app.runTests();
