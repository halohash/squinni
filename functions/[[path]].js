export async function onRequest(context) {
  const upgradeHeader = context.request.headers.get("Upgrade");

  if (upgradeHeader !== "websocket") {
    return new Response("WebSocket mirror running", {
      status: 200
    });
  }

  const pair = new WebSocketPair();

  const client = pair[0];
  const server = pair[1];

  server.accept();

  const upstream = new WebSocket("wss://2s4.me/m4k/");

  upstream.addEventListener("open", () => {
    server.addEventListener("message", event => {
      if (upstream.readyState === 1) {
        upstream.send(event.data);
      }
    });

    upstream.addEventListener("message", event => {
      if (server.readyState === 1) {
        server.send(event.data);
      }
    });
  });

  const closeBoth = () => {
    try {
      upstream.close();
    } catch {}

    try {
      server.close();
    } catch {}
  };

  server.addEventListener("close", closeBoth);
  upstream.addEventListener("close", closeBoth);

  server.addEventListener("error", closeBoth);
  upstream.addEventListener("error", closeBoth);

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}
