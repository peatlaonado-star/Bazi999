// Facebook Page API Router
// Endpoints:
//   GET  /v1/facebook/health              → liveness check (public)
//   POST /v1/facebook/post                → post to page (admin auth)
//   DELETE /v1/facebook/post?id=…         → delete a post (admin auth)

import {
  facebookHealth,
  facebookPostAuth,
  facebookDeleteAuth,
  facebookExchangeNoAuth,
} from '../../_lib/facebook.js';

export async function onRequest(context) {
  const { request } = context;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/v1\/facebook\/?/, '').replace(/\/$/, '');

  try {
    // GET /v1/facebook/health (or just /v1/facebook/)
    if (path === '' || path === 'health') {
      if (request.method === 'GET') return facebookHealth(context);
      return new Response(JSON.stringify({ success: false, error: 'METHOD_NOT_ALLOWED' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // POST /v1/facebook/post
    if (path === 'post' && request.method === 'POST') {
      return facebookPostAuth(context);
    }

    // DELETE /v1/facebook/post?id=…
    if (path === 'post' && request.method === 'DELETE') {
      return facebookDeleteAuth(context);
    }

    // POST /v1/facebook/exchange (App Secret in env IS the auth barrier)
    if (path === 'exchange' && request.method === 'POST') {
      return facebookExchangeNoAuth(context);
    }

    return new Response(
      JSON.stringify({ success: false, error: 'NOT_FOUND', path }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'INTERNAL_ERROR', message: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
