const app = require("..");
const assert = require("assert");
const http = require("http");
const config = require("../config");

const api = {};

const helpers = {};

helpers.makeGetRequest = function(path, cb) {
  const requestDetails = {
    protocol: "http:",
    hostname: "localhost",
    port: config.httpPort,
    method: "GET",
    path,
    headers: {
      "Content-Type": "application/json",
    },
  };

  const req = http.request(requestDetails, function(res) {
    cb(res);
  });
  req.end();
};

api["app.init() should start without throwing"] = function(done) {
  assert.doesNotThrow(function() {
    app.init(function(err) {
      done();
    });
  }, TypeError);
};

api["/ping should response to GET with 200"] = function(done) {
  helpers.makeGetRequest("/ping", function(res) {
    assert.equal(res.statusCode, 200);
    done();
  });
};

api["/api/users should response to GET with 400"] = function(done) {
  helpers.makeGetRequest("/api/users", function(res) {
    assert.equal(res.statusCode, 400);
    done();
  });
};

api["A random path should response to GET with 404"] = function(done) {
  helpers.makeGetRequest("/this/path/shouldnt/exist", function(res) {
    assert.equal(res.statusCode, 404);
    done();
  });
};

module.exports = api;
