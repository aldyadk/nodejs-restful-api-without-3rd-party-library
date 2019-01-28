const querystring = require("querystring");
const crypto = require("crypto");
const https = require("https");
const fs = require("fs");
const path = require("path");

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

helpers.getTemplate = function(templateName, data, cb) {
  templateName =
    typeof templateName === "string" && templateName.length > 0
      ? templateName
      : false;

  data = typeof data === "object" && data !== null ? data : {};
  if (templateName) {
    const templateDirectory = path.join(__dirname, "/../templates/");
    fs.readFile(`${templateDirectory}${templateName}.html`, "utf8", function(
      err,
      templateString
    ) {
      if (!err && templateString && templateString.length > 0) {
        const finalString = helpers.interpolate(templateString, data);
        cb(null, finalString);
      } else {
        cb("no template could be found");
      }
    });
  } else {
    cb("valid template name was not specified");
  }
};

helpers.addUniversalTemplates = function(string, data, cb) {
  string = typeof string === "string" && string.length > 0 ? string : false;
  data = typeof data === "object" && data !== null ? data : {};

  helpers.getTemplate("_header", data, function(err, headerString) {
    if (!err && headerString) {
      helpers.getTemplate("_footer", data, function(err, footerString) {
        if (!err && footerString) {
          const fullString = headerString + string + footerString;
          cb(null, fullString);
        } else {
          cb("Could not find header template");
        }
      });
    } else {
      cb("Could not find header template");
    }
  });
};

helpers.interpolate = function(string, data) {
  string = typeof string === "string" && string.length > 0 ? string : "";
  data = typeof data === "object" && data !== null ? data : {};

  for (let keyName in config.templateGlobals) {
    if (config.templateGlobals.hasOwnProperty(keyName)) {
      data[`global.${keyName}`] = config.templateGlobals[keyName];
    }
  }
  for (let keyName in data) {
    if (data.hasOwnProperty(keyName) && typeof data[keyName] === "string") {
      const needToReplace = data[keyName];
      const needToFind = "{" + keyName + "}";
      string = string.replace(needToFind, needToReplace);
    }
  }

  return string;
};

helpers.getStaticAsset = function(fileName, cb) {
  fileName =
    typeof fileName === "string" && fileName.length > 0 ? fileName : false;

  if (fileName) {
    const publicDir = path.join(__dirname, "/../public/");
    fs.readFile(`${publicDir}${fileName}`, function(err, data) {
      if (!err && data) {
        cb(null, data);
      } else {
        cb("No file could be found");
      }
    });
  } else {
    cb("A valid file name was not  specified");
  }
};

helpers.getANumber = function() {
  return 1;
};

module.exports = helpers;
