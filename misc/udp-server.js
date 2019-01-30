const dgram = require("dgram");

const server = dgram.createSocket("udp4");

server.on("message", function(msgBuffer, sender) {
  const msgString = msgBuffer.toString();
  console.log(msgString);
});

server.bind(6000, function() {
  console.log("listening to 6000");
});
