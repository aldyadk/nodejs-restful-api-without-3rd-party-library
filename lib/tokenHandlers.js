const _performance = require("perf_hooks").performance;
const PerformanceObserver = require("perf_hooks").PerformanceObserver;
const util = require("util");
const debug = util.debuglog("performance");

const helpers = require("./helpers");
const _data = require("./data");

const _tokens = {};

_tokens.post = function(data, cb) {
  const obs = new PerformanceObserver((list, observer) => {
    const measurements = list.getEntries();
    measurements.forEach(function(measurement) {
      debug("\x1b[33m%s\x1b[0m", measurement.name + " " + measurement.duration);
    });
    _performance.clearMarks();
    observer.disconnect();
  });
  obs.observe({ entryTypes: ["measure"], buffered: true });

  _performance.mark("entered function");
  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length > 4
      ? data.payload.phone.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  _performance.mark("inputs validated");
  if (phone && password) {
    _performance.mark("beginning user lookup");
    _data.read("users", phone, function(err, userData) {
      _performance.mark("user lookup complete");
      if (!err && userData) {
        _performance.mark("beginning password hashing");
        const hashedPassword = helpers.hash(password);
        _performance.mark("password hashing complete");
        if (hashedPassword === userData.hashedPassword) {
          _performance.mark("creating data for the token");
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60;
          const tokenObject = {
            phone,
            id: tokenId,
            expires,
          };
          _performance.mark("beginning storing token");
          _data.create("tokens", tokenId, tokenObject, function(err) {
            _performance.mark("storing token complete");

            _performance.measure(
              "Beginning to end",
              "entered function",
              "storing token complete"
            );
            _performance.measure(
              "Validating user input",
              "entered function",
              "inputs validated"
            );
            _performance.measure(
              "User lookup",
              "beginning user lookup",
              "user lookup complete"
            );
            _performance.measure(
              "Password hashing",
              "beginning password hashing",
              "password hashing complete"
            );
            _performance.measure(
              "Token data creation",
              "creating data for the token",
              "beginning storing token"
            );
            _performance.measure(
              "Token storing",
              "beginning storing token",
              "storing token complete"
            );

            if (!err) {
              cb(200, tokenObject);
            } else {
              cb(500, { Error: "Could not create token" });
            }
          });
        } else {
          cb(400, { Error: "Password did not match" });
        }
      } else {
        cb(400, { Error: "Could not find specified user" });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_tokens.get = function(data, cb) {
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        cb(200, tokenData);
      } else {
        cb(400, { Error: "Could not find specified token" });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_tokens.put = function(data, cb) {
  const id =
    typeof data.payload.id === "string" && data.payload.id.trim().length === 20
      ? data.payload.id.trim()
      : false;

  const extend =
    typeof data.payload.extend === "boolean" && data.payload.extend === true
      ? true
      : false;

  if (id && extend) {
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update("tokens", id, tokenData, function(err) {
            if (!err) {
              cb(200);
            } else {
              cb(500, { Error: "Could not update token expiration" });
            }
          });
        } else {
          cb(400, { Error: "Specified token has already expired" });
        }
      } else {
        cb(400, { Error: "Specified token doesn't exist" });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_tokens.delete = function(data, cb) {
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, function(err, tokenObject) {
      if (!err && tokenObject) {
        _data.delete("tokens", id, function(err) {
          if (!err) {
            cb(200);
          } else {
            cb(400, { Error: "Could not delete specified token" });
          }
        });
      } else {
        cb(400, { Error: "Could not find specified token" });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_tokens.verifyToken = function(id, phone, cb) {
  _data.read("tokens", id, function(err, tokenData) {
    if (!err && tokenData) {
      if (phone === tokenData.phone && tokenData.expires > Date.now()) {
        cb(true);
      } else {
        cb(false);
      }
    } else {
      cb(false);
    }
  });
};

module.exports = _tokens;
