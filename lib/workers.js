const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");
const util = require("util");
const debug = util.debuglog("workers");

const _data = require("./data");
const _logs = require("./logs");
const helpers = require("./helpers");

const workers = {};

workers.gatherAllChecks = function() {
  _data.list("checks", function(err, checks) {
    if (!err && checks && checks.length > 0) {
      checks.forEach(function(checkName) {
        _data.read("checks", checkName, function(err, originalCheckData) {
          if (!err && originalCheckData) {
            workers.validateCheckData(originalCheckData);
          } else {
            debug(`Error reading check with the name: ${checkName}`);
          }
        });
      });
    } else {
      debug("Could not find any checks to process");
    }
  });
};

workers.validateCheckData = function(originalCheckData) {
  originalCheckData =
    typeof originalCheckData === "object" && originalCheckData !== null
      ? originalCheckData
      : {};

  originalCheckData.id =
    typeof originalCheckData.id === "string" &&
    originalCheckData.id.length === 20
      ? originalCheckData.id
      : false;

  originalCheckData.userPhone =
    typeof originalCheckData.userPhone === "string" &&
    originalCheckData.userPhone.trim().length > 4
      ? originalCheckData.userPhone.trim()
      : false;

  originalCheckData.protocol =
    typeof originalCheckData.protocol === "string" &&
    ["http", "https"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;

  originalCheckData.url =
    typeof originalCheckData.url === "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false;

  originalCheckData.method =
    typeof originalCheckData.method === "string" &&
    ["post", "get", "put", "delete"].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false;

  originalCheckData.successCodes =
    typeof originalCheckData.successCodes === "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;

  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds === "number" &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false;

  originalCheckData.state =
    typeof originalCheckData.state === "string" &&
    ["up", "down"].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : "down";

  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked === "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    debug(
      `One of the checks is not properly formatted: ${originalCheckData.id}`
    );
  }
};

workers.performCheck = function(originalCheckData) {
  const checkOutcome = {
    error: false,
    responseCode: false,
  };
  let outcomeSent = false;

  const parsedUrl = url.parse(
    `${originalCheckData.protocol}://${originalCheckData.url}`,
    true
  );
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path;

  const requestDetail = {
    protocol: `${originalCheckData.protocol}:`,
    hostname,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  let _moduleToUse = originalCheckData.protocol === "https" ? https : http;

  const request = _moduleToUse.request(requestDetail, function(response) {
    checkOutcome.responseCode = response.statusCode;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  request.on("error", function(err) {
    checkOutcome.error = {
      error: true,
      value: err,
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  request.on("timeout", function(err) {
    checkOutcome.error = {
      error: true,
      value: "timeout",
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  request.end();
};

workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";

  const alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;

  const timeOfCheck = Date.now();
  workers.log(
    originalCheckData,
    checkOutcome,
    state,
    alertWarranted,
    timeOfCheck
  );

  const newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;

  _data.update("checks", newCheckData.id, newCheckData, function(err) {
    if (!err) {
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        debug("check not changed, no alert needed");
      }
    } else {
      debug(`Error trying to update the checks with id:${newCheckData.id}`);
    }
  });
};

workers.alertUserToStatusChange = function(newCheckData) {
  const msg = `Your check for ${newCheckData.method.toUpperCase()} ${
    newCheckData.protocol
  }://${newCheckData.url} is currently ${newCheckData.state}`;
  helpers.sendSms(newCheckData.userPhone, msg, function(err) {
    if (!err) {
      debug("Success! User alerted via sms");
    } else {
      debug("Failed to sent sms.", err);
    }
  });
};

workers.log = function(
  originalCheckData,
  checkOutcome,
  state,
  alertWarranted,
  timeOfCheck
) {
  const logData = {
    check: originalCheckData,
    outcome: checkOutcome,
    state,
    alert: alertWarranted,
    timeOfCheck,
  };

  const logString = JSON.stringify(logData);

  const logFileName = originalCheckData.id;

  _logs.append(logFileName, logString, function(err) {
    if (!err) {
      debug("Logging to file succeeded");
    } else {
      debug("Logging to file failed");
    }
  });
};

workers.rotateLogs = function() {
  _logs.list(false, function(err, logs) {
    if (!err && logs && logs.length > 0) {
      logs.forEach(function(logName) {
        const logId = logName.replace(".log", "");
        const newFileId = logId + "-" + Date.now();
        _logs.compress(logId, newFileId, function(err) {
          if (!err) {
            _logs.truncate(logId, function(err) {
              if (!err) {
                debug("Success truncating log file");
              } else {
                debug("Could not truncate one of the log files");
              }
            });
          } else {
            debug("Could not compress one of the log files:", err);
          }
        });
      });
    } else {
      debug("Could not find any logs to rotate");
    }
  });
};

workers.loop = function() {
  setInterval(function functionName() {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

workers.logRotationLoop = function() {
  setInterval(function functionName() {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

workers.init = function() {
  console.log("\x1b[33m%s\x1b[0m", "Background workers are running");
  workers.gatherAllChecks();
  workers.loop();
  workers.rotateLogs();
  workers.logRotationLoop();
};

module.exports = workers;
