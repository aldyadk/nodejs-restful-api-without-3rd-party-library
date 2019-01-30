const dgram = require("dgram");

const client = dgram.createSocket("udp4");

const msgString = "This is a msg";
const msgBuffer = Buffer.from(msgString);

client.send(msgBuffer, 6000, "localhost", function(err) {
  client.close();
});
