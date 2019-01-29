const assert = require("assert");
const helpers = require("../lib/helpers");
const logs = require("../lib/logs");
const exampleDebuggingProblem = require("../lib/exampleDebuggingProblem");

const unit = {};

unit["helpers.getANumber() should return a number"] = function(done) {
  const val = helpers.getANumber();
  assert.equal(typeof val, "number");
  done();
};

unit["helpers.getANumber() should return 1"] = function(done) {
  const val = helpers.getANumber();
  assert.equal(val, 1);
  done();
};

unit["helpers.getANumber() should return 2"] = function(done) {
  const val = helpers.getANumber();
  assert.equal(val, 2);
  done();
};

unit[
  "logs.list() should callbacks null error and an array of log names"
] = function(done) {
  logs.list(true, function(err, logFileNames) {
    assert.equal(err, null);
    assert.ok(logFileNames instanceof Array);
    assert.ok(logFileNames.length > 0);
    done();
  });
};

unit[
  "logs.truncate() should never throw if the logId doesn't exist, is should callback an error instead"
] = function(done) {
  assert.doesNotThrow(function() {
    logs.truncate("i do not exist", function(err) {
      assert.ok(err);
      done();
    });
  }, TypeError);
};

unit["exampleDebuggingProblem.init() should not throw but it does"] = function(
  done
) {
  assert.doesNotThrow(function() {
    exampleDebuggingProblem.init();
    done();
  }, TypeError);
};

module.exports = unit;
