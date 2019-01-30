const net = require("net");

const outbondMessage = "ping";
const client = net.createConnection({ port: 6000 }, function() {
  client.write(outbondMessage);
});

client.on("data", function(inboundMessage) {
  const msgString = inboundMessage.toString();
  console.log("i wrote " + outbondMessage + " and they said " + inboundMessage);
});
