const _users = require("./userHandlers");
const _tokens = require("./tokenHandlers");
const _checks = require("./checkHandlers");

const handlers = {};

handlers.ping = function(data, cb) {
  cb(200);
};

handlers.notFound = function(data, cb) {
  cb(404);
};

handlers._users = _users;
handlers._tokens = _tokens;
handlers._checks = _checks;

handlers.users = function(data, cb) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, cb);
  } else {
    cb(405);
  }
};

handlers.tokens = function(data, cb) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, cb);
  } else {
    cb(405);
  }
};

handlers.checks = function(data, cb) {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, cb);
  } else {
    cb(405);
  }
};

module.exports = handlers;
