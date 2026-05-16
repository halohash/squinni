export async function onRequest() {
  return new Response("Something Went Wrong", {
    status: 503,
    headers: {
      "Content-Type": "text/plain"
    }
  });
}
