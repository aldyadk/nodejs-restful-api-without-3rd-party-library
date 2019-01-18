const helpers = require("./helpers");
const _data = require("./data");
const _tokens = require("./tokenHandlers");

const _users = {};

_users.post = function(data, cb) {
  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

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

  const tosAgreement =
    typeof data.payload.tosAgreement === "boolean" &&
    data.payload.tosAgreement === true
      ? data.payload.tosAgreement
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    _data.read("users", phone, function(err, userData) {
      if (err) {
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          const userData = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement,
          };
          _data.create("users", phone, userData, function(err) {
            if (!err) {
              cb(200);
            } else {
              console.log(err);
              cb(500, { Error: "Could not create user" });
            }
          });
        } else {
          cb(500, { Error: "Could not hash the user's password" });
        }
      } else {
        cb(400, { Error: "Phone number exist" });
      }
    });
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_users.get = function(data, cb) {
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length > 4
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    _tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read("users", phone, function(err, userData) {
          if (!err && userData) {
            delete userData.hashedPassword;
            cb(200, userData);
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

_users.put = function(data, cb) {
  const phone =
    typeof data.payload.phone === "string" &&
    data.payload.phone.trim().length > 4
      ? data.payload.phone.trim()
      : false;

  const firstName =
    typeof data.payload.firstName === "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName === "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const password =
    typeof data.payload.password === "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      const token =
        typeof data.headers.token === "string" ? data.headers.token : false;

      _tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (tokenIsValid) {
          _data.read("users", phone, function(err, userData) {
            if (!err && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                const hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                  userData.hashedPassword = hashedPassword;
                } else {
                  cb(500, { Error: "Could not hash the user's password" });
                }
              }
              _data.update("users", phone, userData, function(err) {
                if (!err) {
                  cb(200);
                } else {
                  console.log(err);
                  cb(500, { Error: "Could not update user" });
                }
              });
            } else {
              cb(400, { Error: "User doesn't exist" });
            }
          });
        } else {
          cb(403, {
            Error: "Missing required token in header or token is invalid",
          });
        }
      });
    } else {
      cb(400, { Error: "Missing fields to update" });
    }
  } else {
    cb(400, { Error: "Missing required fields" });
  }
};

_users.delete = function(data, cb) {
  const phone =
    typeof data.queryStringObject.phone === "string" &&
    data.queryStringObject.phone.trim().length > 4
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    const token =
      typeof data.headers.token === "string" ? data.headers.token : false;

    _tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read("users", phone, function(err, userData) {
          if (!err && userData) {
            _data.delete("users", phone, function(err) {
              if (!err) {
                const userChecks =
                  typeof userData.checks === "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];
                const checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  let checksDeleted = 0;
                  let deletionError = false;
                  userChecks.forEach(function(checkId) {
                    _data.delete("checks", checkId, function(err) {
                      if (err) {
                        deletionError = true;
                      }
                      checksDeleted++;
                      if (checksDeleted === checksToDelete) {
                        if (!deletionError) {
                          cb(200);
                        } else {
                          cb(500, {
                            Error:
                              "Error encountered while attempting to delete all of the user's checks. All check may not have been deleted from the system successfully",
                          });
                        }
                      }
                    });
                  });
                } else {
                  cb(200);
                }
              } else {
                cb(400, { Error: "Could not delete specified user" });
              }
            });
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

module.exports = _users;
