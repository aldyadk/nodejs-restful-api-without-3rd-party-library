const net = require("net");

const server = net.createServer(function(connection) {
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
