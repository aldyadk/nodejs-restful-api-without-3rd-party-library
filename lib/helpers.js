const querystring = require("querystring");
const crypto = require("crypto");
const https = require("https");

const config = require("../config");

const helpers = {};

helpers.hash = function(string) {
  if (typeof string === "string" && string.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(string)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

helpers.parseJsonToObject = function(string) {
  try {
    const obj = JSON.parse(string);
    return obj;
  } catch (e) {
    return {};
  }
};

helpers.createRandomString = function(length) {
  if (typeof length === "number" && length > 0) {
    const template =
      "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890";
    let result = "";
    for (let i = 0; i < length; i++) {
      // result += template[Math.floor(Math.random() * template.length)];
      result += template.charAt(Math.floor(Math.random() * template.length));
    }
    return result;
  } else {
    return false;
  }
};

helpers.sendSms = function(phone, msg, cb) {
  phone =
    typeof phone.trim() === "string" && phone.trim().length > 4
      ? phone.trim()
      : false;
  msg =
    typeof msg.trim() === "string" &&
    msg.trim().length > 0 &&
    msg.trim().length <= 1600
      ? msg.trim()
      : false;
  if (phone && msg) {
    const payload = {
      From: config.twilio.fromPhone,
      To: `+${phone}`,
      Body: msg,
    };
    const stringPayload = querystring.stringify(payload);
    const requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };
    const request = https.request(requestDetails, function(response) {
      const status = response.statusCode;
      if (status === 200 || status === 201) {
        cb(null);
      } else {
        cb("Status code returned: " + status);
      }
    });
    request.on("error", function(err) {
      cb(err);
    });
    request.write(stringPayload);
    request.end();
  } else {
    cb("missing/invalid parameters");
  }
};

module.exports = helpers;
