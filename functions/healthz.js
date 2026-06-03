// GET /healthz — liveness check (no auth)

export function onRequest() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'starvia-cloudflare-pages',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    }
  );
}
