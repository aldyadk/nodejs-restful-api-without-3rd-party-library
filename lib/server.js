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

    const choosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;

    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    choosenHandler(data, function(statusCode, payloadObject) {
      statusCode = typeof statusCode === "number" ? statusCode : 200;
      payloadObject = typeof payloadObject === "object" ? payloadObject : {};
      const payloadString = JSON.stringify(payloadObject);

      res.setHeader("Content-Type", "aplication/json");
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
  ping: handlers.ping,
  users: handlers.users,
  tokens: handlers.tokens,
  checks: handlers.checks,
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
