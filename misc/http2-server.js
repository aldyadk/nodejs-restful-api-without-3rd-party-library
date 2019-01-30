const http2 = require("http2");

const server = http2.createServer();
server.on("stream", function(stream, headers) {
  stream.respond({
    status: 200,
    "Content-Type": "text/html",
  });
  stream.end("<html><body><p>Hello word</p></body></html>");
});
server.listen(6000, function() {
  console.log("listening on 6000");
});
