const http = require("http");
const https = require("https");
const fs = require("fs");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const path = require("path");
const util = require("util");
const debug = util.debuglog("server");

const config = require("../config");
const handlers = require("./handlers");
const helpers = require("./helpers");

const server = {};

server.httpServer = http.createServer(function(req, res) {
  server.unifiedServer(req, res);
});

server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(
  req,
  res
) {
  server.unifiedServer(req, res);
});

server.unifiedServer = function(req, res) {
  const parsedUrl = url.parse(req.url, true);
  debug("\x1b[33m%s\x1b[0m", JSON.stringify(parsedUrl));

  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");
  debug("\x1b[35m%s\x1b[0m%s", "request path: ", trimmedPath);

  const method = req.method.toLowerCase();
  debug("\x1b[35m%s\x1b[0m%s", "request method: ", method);

  const queryStringObject = parsedUrl.query;
  debug(
    "\x1b[35m%s\x1b[0m%o",
    "request query string parameters: ",
    queryStringObject
  );

  const headers = req.headers;
  debug("request headers: ", headers);

  const decoder = new StringDecoder("utf-8");
  let buffer = "";
  req.on("data", function(data) {
    buffer += decoder.write(data);
  });
  req.on("end", function() {
    buffer += decoder.end();

    let choosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    choosenHandler =
      trimmedPath.indexOf("public/") > -1 ? handlers.public : choosenHandler;

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    choosenHandler(data, function(statusCode, payload, contentType) {
      contentType = typeof contentType === "string" ? contentType : "json";
      statusCode = typeof statusCode === "number" ? statusCode : 200;

      let payloadString = "";
      if (contentType === "json") {
        res.setHeader("Content-Type", "application/json");
        payloadObject = typeof payload === "object" ? payload : {};
        payloadString = JSON.stringify(payloadObject);
      }

      if (contentType === "html") {
        res.setHeader("Content-Type", "text/html");
        payloadString = typeof payload === "string" ? payload : "";
      }

      if (contentType === "favicon") {
        res.setHeader("Content-Type", "image/x-icon");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }

      if (contentType === "css") {
        res.setHeader("Content-Type", "text/css");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }

      if (contentType === "png") {
        res.setHeader("Content-Type", "image/png");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }

      if (contentType === "jpg") {
        res.setHeader("Content-Type", "image/jpeg");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }

      if (contentType === "plain") {
        res.setHeader("Content-Type", "text/plain");
        payloadString = typeof payload !== "undefined" ? payload : "";
      }

      res.writeHead(statusCode);
      res.end(payloadString);

      if (statusCode === 200) {
        debug("%s\x1b[32m%s\x1b[0m", "request payloads: ", buffer);
        debug("%s\x1b[32m%s\x1b[0m", "status code: ", statusCode);
      } else {
        debug("%s\x1b[31m%s\x1b[0m", "request payloads: ", buffer);
        debug("%s\x1b[31m%s\x1b[0m", "status code: ", statusCode);
      }
    });
  });
};

server.router = {
  "": handlers.index,
  ping: handlers.ping,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "session/create": handlers.sessionCreate,
  "session/deleted": handlers.sessionDeleted,
  "checks/all": handlers.checksList,
  "checks/create": handlers.checksCreate,
  "checks/edit": handlers.checksEdit,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/checks": handlers.checks,
  "favicon.ico": handlers.favicon,
  public: handlers.public,
};

server.init = function() {
  server.httpServer.listen(config.httpPort, function() {
    console.log(
      "\x1b[34m%s\x1b[0m",
      `${config.envName} server is listening on port ${config.httpPort}`
    );
  });
  server.httpsServer.listen(config.httpsPort, function() {
    console.log(
      "\x1b[36m%s\x1b[0m",
      `${config.envName} server is listening on port ${config.httpsPort}`
    );
  });
};

module.exports = server;
