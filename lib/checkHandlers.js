const _data = require("./data");
const _tokens = require("./tokenHandlers");
const config = require("./config");
const helpers = require("./helpers");

const _checks = {};

_checks.post = function(data, cb) {
  const protocol =
    typeof data.payload.protocol === "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url === "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  const method =
    typeof data.payload.method === "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes === "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds === "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    _data.read("tokens", token, function(err, tokenData) {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;
        _data.read("users", userPhone, function(err, userData) {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks === "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            if (userChecks.length < config.maxChecks) {
              const checkId = helpers.createRandomString(20);
              const checkObject = {
                id: checkId,
                userPhone,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds,
              };
              _data.create("checks", checkId, checkObject, function(err) {
                if (!err) {
                  userData.checks = userChecks;
                  userData.checks.push(checkId);
                  _data.update("users", userPhone, userData, function(err) {
                    if (!err) {
                      cb(200, checkObject);
                    } else {
                      cb(500, {
                        Error: "Could not update the user with the new check",
                      });
                    }
                  });
                } else {
                  cb(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              cb(400, {
                Error: `User already has max number of checks: ${
                  config.maxChecks
                }`,
              });
            }
          } else {
            cb(400, { Error: "Could not find specified user" });
          }
        });
      } else {
        cb(403, {
          Error: "Missing required token in header or token is invalid",
        });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_checks.get = function(data, cb) {
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        const token =
          typeof data.headers.token === "string" ? data.headers.token : false;

        _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
          if (tokenIsValid) {
            cb(200, checkData);
          } else {
            cb(403, {
              Error: "Missing required token in header or token is invalid",
            });
          }
        });
      } else {
        cb(400, { Error: "Could not find specified check" });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_checks.put = function(data, cb) {
  const id =
    typeof data.payload.id === "string" && data.payload.id.trim().length === 20
      ? data.payload.id.trim()
      : false;

  const protocol =
    typeof data.payload.protocol === "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url === "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  const method =
    typeof data.payload.method === "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes === "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds === "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read("checks", id, function(err, checkData) {
        if (!err && checkData) {
          const token =
            typeof data.headers.token === "string" ? data.headers.token : false;

          _tokens.verifyToken(token, checkData.userPhone, function(
            tokenIsValid
          ) {
            if (tokenIsValid) {
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }
              _data.update("checks", id, checkData, function(err) {
                if (!err) {
                  cb(200);
                } else {
                  cb(500, { Error: "Could not update the check" });
                }
              });
            } else {
              cb(403, {
                Error: "Missing required token in header or token is invalid",
              });
            }
          });
        } else {
          cb(400, { Error: "Check id doesn't exist" });
        }
      });
    } else {
      cb(400, { Error: "Missing fields to update" });
    }
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_checks.delete = function(data, cb) {
  const id =
    typeof data.queryStringObject.id === "string" &&
    data.queryStringObject.id.trim().length === 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        const token =
          typeof data.headers.token === "string" ? data.headers.token : false;

        _tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
          if (tokenIsValid) {
            _data.delete("checks", id, function(err) {
              if (!err) {
                _data.read("users", checkData.userPhone, function(
                  err,
                  userData
                ) {
                  if (!err && userData) {
                    const userChecks =
                      typeof userData.checks === "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];
                    const checkPosition =
                      userChecks.indexOf(id) > -1
                        ? userChecks.indexOf(id)
                        : false;
                    if (checkPosition) {
                      userChecks.splice(checkPosition, 1);
                      _data.update(
                        "users",
                        checkData.userPhone,
                        userData,
                        function(err) {
                          if (!err) {
                            cb(200);
                          } else {
                            cb(500, { Error: "Could not update the user" });
                          }
                        }
                      );
                    } else {
                      cb(500, {
                        Error:
                          "Could not find the check on the user object, so could not remove the check from the list",
                      });
                    }
                  } else {
                    cb(500, {
                      Error:
                        "Could not find user who created the check, so could not remove check from the list on the user object",
                    });
                  }
                });
              } else {
                cb(500, { Error: "Could not delete the check" });
              }
            });
          } else {
            cb(403, {
              Error: "Missing required token in header or token is invalid",
            });
          }
        });
      } else {
        cb(400, { Error: "Could not find specified check" });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

module.exports = _checks;
