const tls = require("tls");
const fs = require("fs");
const path = require("path");

const options = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
};

const server = tls.createServer(options, function(connection) {
  const outbondMessage = "pong";
  connection.write(outbondMessage);
  connection.on("data", function(inboundMessage) {
    const msgString = inboundMessage.toString();
    console.log(
      "i wrote " + outbondMessage + " and they said " + inboundMessage
    );
  });
});

server.listen(6000, function() {
  console.log("listening on 6000");
});
