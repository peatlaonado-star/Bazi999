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
  facebookInboxAuth,
  facebookSendAuth,
  facebookAutoPinAuth,
} from '../../_lib/facebook.js';
import {
  facebookAutoPostAuth,
  facebookAutoPostPreviewAuth,
} from '../../_lib/auto-post.js';
// DISABLED 20 ก.ค.69 (Option A): keyword auto-reply เลิกใช้
// ระบบหลัก = ~/.hermes/scripts/starvia-autoreply-llm.py (cron 2f1b6bfd4c21)
// ไฟล์เก่าอยู่ที่ functions/_lib/_disabled/auto-reply.js — ยังไม่ deploy ปิด production

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

    // GET /v1/facebook/inbox (reads conversations)
    if (path === 'inbox' && request.method === 'GET') {
      return facebookInboxAuth(context);
    }

    // POST /v1/facebook/send (sends message)
    if (path === 'send' && request.method === 'POST') {
      return facebookSendAuth(context);
    }

    // POST /v1/facebook/auto-pin (auto-PIN from inbox slips)
    if (path === 'auto-pin' && request.method === 'POST') {
      return facebookAutoPinAuth(context);
    }

    // POST /v1/facebook/auto-post (daily horoscope auto-post)
    if (path === 'auto-post' && request.method === 'POST') {
      return facebookAutoPostAuth(context);
    }

    // GET /v1/facebook/auto-post (preview today's post without posting)
    if (path === 'auto-post' && request.method === 'GET') {
      return facebookAutoPostPreviewAuth(context);
    }

    // POST /v1/facebook/auto-reply — DISABLED 20 ก.ค.69
    // ระบบหลัก = starvia-autoreply-llm.py เท่านั้น (ห้ามเปิด keyword endpoint ซ้ำ)
    if (path === 'auto-reply' || path === 'auto-reply/test') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'DISABLED',
          message: 'Keyword auto-reply เลิกใช้แล้ว — ใช้ Python LLM (cron) แทน',
        }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
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
