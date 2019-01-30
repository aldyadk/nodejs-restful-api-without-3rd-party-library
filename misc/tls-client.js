const tls = require("tls");
const fs = require("fs");
const path = require("path");

const options = {
  ca: fs.readFileSync(path.join(__dirname, "/../https/cert.pem")),
  // ca: fs.readFileSync("./https/cert.pem"),
};

const outbondMessage = "ping";
const client = tls.connect(
  6000,
  options,
  function() {
    client.write(outbondMessage);
  }
);

client.on("data", function(inboundMessage) {
  const msgString = inboundMessage.toString();
  console.log("i wrote " + outbondMessage + " and they said " + inboundMessage);
});
