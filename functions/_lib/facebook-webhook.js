// ── Facebook Webhook Handler ─────────────────────────────────────
// รับ webhook events จาก Facebook:
//   - Page events (feed/messaging) — จับ user ID จาก comment/message
//   - Payment events — จับ user ID จาก subscription payment
//
// GET  /v1/facebook/webhook  — Facebook verification (hub.mode=subscribe)
// POST /v1/facebook/webhook  — Receive events → บันทึก userID ลง KV
//
// KV key: "premium:subscribers" — JSON array of { id, at, src }

const SUBSCRIBERS_KEY = 'premium:subscribers';

export async function facebookWebhook(context) {
  const { request, env } = context;

  // ── GET: Facebook Verification Request ──
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === env.FB_WEBHOOK_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // ── OPTIONS: CORS ──
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  // ── POST: Event Notification ──
  try {
    const body = await request.json();

    // จับ user IDs จากทุก event type
    const userIds = new Set();

    if (body.object === 'page') {
      // Page events: feed (comments), messaging (messages)
      for (const entry of body.entry || []) {
        // messaging events (Messenger)
        for (const event of entry.messaging || []) {
          if (event.sender?.id) userIds.add(String(event.sender.id));
        }
        // feed events (comments, reactions)
        for (const change of entry.changes || []) {
          if (change.value?.from?.id) userIds.add(String(change.value.from.id));
          if (change.value?.sender_id) userIds.add(String(change.value.sender_id));
        }
      }
    } else if (body.object === 'payment' || body.entry?.[0]?.type === 'payment') {
      // Payment events (subscription payments)
      for (const entry of body.entry || []) {
        if (entry.sender_id) userIds.add(String(entry.sender_id));
        if (entry.user_id) userIds.add(String(entry.user_id));
      }
    }

    // บันทึก user IDs ลง KV
    if (userIds.size > 0) {
      try {
        let subscribers = [];
        try {
          const raw = await env.STARVIA_KV.get(SUBSCRIBERS_KEY, { type: 'json' });
          if (Array.isArray(raw)) subscribers = raw;
        } catch {}

        const existingIds = new Set(subscribers.map(s => s.id));
        let added = 0;
        for (const uid of userIds) {
          if (!existingIds.has(uid)) {
            subscribers.push({
              id: uid,
              at: new Date().toISOString(),
              src: 'webhook',
            });
            added++;
          }
        }

        if (added > 0) {
          // เก็บสูงสุด 10,000 รายการ
          if (subscribers.length > 10000) {
            subscribers = subscribers.slice(-10000);
          }
          await env.STARVIA_KV.put(SUBSCRIBERS_KEY, JSON.stringify(subscribers));
        }
      } catch (e) {
        console.error('KV write error:', e);
      }
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    // Facebook ส่ง event ซ้ำถ้าไม่ได้ 200 — return 200 เสมอ
    return new Response('OK', { status: 200 });
  }
}
