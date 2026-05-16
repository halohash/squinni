export async function onRequest(context) {
  const upgradeHeader = context.request.headers.get("Upgrade");

  if (upgradeHeader !== "websocket") {
    return new Response("WebSocket mirror running");
  }

  const pair = new WebSocketPair();

  const client = pair[0];
  const server = pair[1];

  server.accept();

  const upstream = new WebSocket("wss://2s4.me/m4k/");

  let upstreamOpen = false;

  upstream.addEventListener("open", () => {
    upstreamOpen = true;
  });

  server.addEventListener("message", event => {
    if (upstreamOpen) {
      upstream.send(event.data);
    }
  });

  upstream.addEventListener("message", event => {
    try {
      server.send(event.data);
    } catch {}
  });

  const closeSockets = () => {
    try {
      upstream.close();
    } catch {}

    try {
      server.close();
    } catch {}
  };

  server.addEventListener("close", closeSockets);
  upstream.addEventListener("close", closeSockets);

  server.addEventListener("error", closeSockets);
  upstream.addEventListener("error", closeSockets);

  return new Response(null, {
    status: 101,
    webSocket: client
  });
}
