import http from "http";

const TARGET = "wss://2s4.me/m4k/";

const server = http.createServer((req, res) => {
  if (
    req.headers.upgrade &&
    req.headers.upgrade.toLowerCase() === "websocket"
  ) {
    const targetUrl = new URL(TARGET);

    const upstreamHeaders = [
      `GET ${targetUrl.pathname}${targetUrl.search} HTTP/1.1`,
      `Host: ${targetUrl.host}`,
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Key: ${req.headers["sec-websocket-key"]}`,
      `Sec-WebSocket-Version: ${req.headers["sec-websocket-version"] || "13"}`
    ];

    if (req.headers.origin) {
      upstreamHeaders.push(`Origin: ${req.headers.origin}`);
    }

    const upstream = connectTlsSocket(targetUrl.hostname, 443, () => {
      upstream.write(upstreamHeaders.join("\r\n") + "\r\n\r\n");
    });

    server.emit("connection-mirror", req.socket, upstream);
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket mirror running");
});

server.on("connection-mirror", (client, upstream) => {
  let handshakeDone = false;

  upstream.on("data", chunk => {
    if (!handshakeDone) {
      const response = chunk.toString();

      if (response.includes("101")) {
        handshakeDone = true;
        client.write(chunk);

        client.pipe(upstream);
        upstream.pipe(client);
      } else {
        client.end();
        upstream.end();
      }

      return;
    }
  });

  const close = () => {
    client.destroy();
    upstream.destroy();
  };

  client.on("error", close);
  upstream.on("error", close);

  client.on("close", close);
  upstream.on("close", close);
});

function connectTlsSocket(host, port, callback) {
  const tls = require("tls");

  return tls.connect(
    {
      host,
      port,
      servername: host
    },
    callback
  );
}

const PORT = process.env.PORT || 8788;

server.listen(PORT, () => {
  console.log(`Mirror listening on ${PORT}`);
});
