import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const TARGET = "wss://2s4.me/m4k/";

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket mirror is running.");
});

const wss = new WebSocketServer({ server });

wss.on("connection", (client, req) => {
  const headers = {};

  if (req.headers["user-agent"]) {
    headers["user-agent"] = req.headers["user-agent"];
  }

  const upstream = new WebSocket(TARGET, {
    headers
  });

  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;

    try {
      client.close();
    } catch {}

    try {
      upstream.close();
    } catch {}
  };

  upstream.on("open", () => {
    client.on("message", (data, isBinary) => {
      if (upstream.readyState === WebSocket.OPEN) {
        upstream.send(data, { binary: isBinary });
      }
    });

    upstream.on("message", (data, isBinary) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  client.on("close", cleanup);
  upstream.on("close", cleanup);

  client.on("error", cleanup);
  upstream.on("error", cleanup);
});

const PORT = process.env.PORT || 8788;

server.listen(PORT, () => {
  console.log(`WebSocket mirror running on port ${PORT}`);
});
