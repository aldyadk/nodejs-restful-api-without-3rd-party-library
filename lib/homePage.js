const helpers = require("./helpers");

module.exports = function(data, cb) {
  if (data.method === "get") {
    const templateData = {
      "head.title": "Uptime Monitoring - Made Simple",
      "head.description":
        "We offer free simple uptime monitoring for http/https websites.",
      "body.class": "index",
    };
    helpers.getTemplate("index", templateData, function(err, templateString) {
      if (!err && templateString) {
        helpers.addUniversalTemplates(templateString, templateData, function(
          err,
          str
        ) {
          if (!err && str) {
            cb(200, str, "html");
          } else {
            cb(500, null, "html");
          }
        });
      } else {
        cb(500, null, "html");
      }
    });
  } else {
    cb(405, null, "html");
  }
};
