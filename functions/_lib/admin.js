// STARVIA Admin Service — Cloudflare Pages Functions + KV
// Replaces api/admin-service.mjs
// Storage: STARVIA_KV (key: "premium:pins" — shared with premium service)
// Auth: HS256 JWT (env.STARVIA_ADMIN_JWT_SECRET)

import { signHS256, verifyHS256, extractBearerToken } from './jwt.js';

const PINS_KEY = 'premium:pins';
const DEFAULT_ADMIN_TTL = 12 * 60 * 60; // 12h
const PIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function readPinStore(kv) {
  try {
    const data = await kv.get(PINS_KEY, { type: 'json' });
    if (data && Array.isArray(data.pins)) return data;
  } catch (e) {
    // ignore
  }
  return { pins: [] };
}

async function writePinStore(kv, store) {
  await kv.put(PINS_KEY, JSON.stringify(store));
}

function normalizePin(pin) {
  return String(pin || '').trim().toUpperCase();
}

async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizePin(pin)));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generatePin() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let pin = 'STAR-';
  for (let i = 0; i < 8; i++) {
    pin += PIN_ALPHABET[bytes[i] % PIN_ALPHABET.length];
  }
  return pin;
}

function makePinPublic(record) {
  const now = Date.now();
  const expiresMs = record.expiresAt ? Date.parse(record.expiresAt) : null;
  let status = 'active';
  if (record.usedAt) status = 'used';
  else if (expiresMs && expiresMs <= now) status = 'expired';
  return {
    pin: record.pin || '',
    created: record.createdAt || '',
    expires: record.expiresAt || '',
    used: record.usedAt || null,
    plan: record.plan || 'premium_199',
    note: record.note || '',
    status,
  };
}

// POST /v1/admin/login { password: "..." }
export async function adminLogin(context) {
  const { request, env } = context;
  if (!env.STARVIA_ADMIN_PASSWORD || !env.STARVIA_ADMIN_JWT_SECRET) {
    return json({ success: false, error: 'ADMIN_NOT_CONFIGURED' }, 503);
  }
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400);
  }
  if (!body.password || body.password !== env.STARVIA_ADMIN_PASSWORD) {
    return json({ success: false, error: 'INVALID_PASSWORD', message: 'รหัสผ่านไม่ถูกต้อง' }, 401);
  }
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresIn = Number(env.STARVIA_ADMIN_TOKEN_TTL || DEFAULT_ADMIN_TTL);
  const expiresAt = issuedAt + expiresIn;
  const token = await signHS256(
    { role: 'admin', iat: issuedAt, exp: expiresAt },
    env.STARVIA_ADMIN_JWT_SECRET
  );
  return json({ success: true, token, expiresIn });
}

async function requireAdmin(request, env) {
  if (!env.STARVIA_ADMIN_JWT_SECRET) {
    return { ok: false, error: 'ADMIN_NOT_CONFIGURED', status: 503 };
  }
  const token = extractBearerToken(request.headers.get('authorization') || '');
  if (!token) return { ok: false, error: 'UNAUTHORIZED', status: 401 };
  const verified = await verifyHS256(token, env.STARVIA_ADMIN_JWT_SECRET);
  if (!verified.valid) return { ok: false, error: 'INVALID_TOKEN', status: 401 };
  if (Number(verified.payload.exp) <= Math.floor(Date.now() / 1000)) {
    return { ok: false, error: 'TOKEN_EXPIRED', status: 401 };
  }
  return { ok: true, payload: verified.payload };
}

// GET /v1/admin/stats
export async function getAdminStats(context) {
  const { env } = context;
  if (!env.STARVIA_KV) return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  const store = await readPinStore(env.STARVIA_KV);
  const now = Date.now();
  const total = store.pins.length;
  const unused = store.pins.filter(r => !r.usedAt && (!r.expiresAt || Date.parse(r.expiresAt) > now)).length;
  const used = store.pins.filter(r => !!r.usedAt).length;
  const expired = total - unused - used;
  return json({ success: true, total, unused, used, expired });
}

// GET /v1/admin/pins?status=unused|used|expired
export async function listPins(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  const url = new URL(request.url);
  const statusFilter = (url.searchParams.get('status') || '').toLowerCase();
  const store = await readPinStore(env.STARVIA_KV);
  const now = Date.now();
  let pins = store.pins;
  if (statusFilter === 'unused') {
    pins = store.pins.filter(r => !r.usedAt && (!r.expiresAt || Date.parse(r.expiresAt) > now));
  } else if (statusFilter === 'used') {
    pins = store.pins.filter(r => !!r.usedAt);
  } else if (statusFilter === 'expired') {
    pins = store.pins.filter(r => !r.usedAt && r.expiresAt && Date.parse(r.expiresAt) <= now);
  }
  return json({ success: true, pins: pins.map(makePinPublic) });
}

// POST /v1/admin/pins/issue { count: 1, days: 7, plan: "premium_199", note: "..." }
export async function issuePins(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400);
  }
  const count = Math.max(1, Math.min(50, Number(body.count) || 1));
  const days = Math.max(1, Math.min(365, Number(body.days) || 7));
  const plan = body.plan || 'premium_199';
  const noteBase = body.note || '';
  const store = await readPinStore(env.STARVIA_KV);
  const nowDate = new Date();
  const issued = [];
  for (let i = 0; i < count; i++) {
    let pin, pinHash;
    do {
      pin = await generatePin();
      pinHash = await hashPin(pin);
    } while (store.pins.some(r => r.pinHash === pinHash && !r.usedAt));
    const record = {
      pin,
      pinHash,
      plan,
      createdAt: nowDate.toISOString(),
      expiresAt: new Date(nowDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString(),
      usedAt: null,
      note: count > 1 ? `${noteBase} #${i + 1}`.trim() : noteBase,
    };
    store.pins.push(record);
    issued.push({ pin, plan, created: record.createdAt, expires: record.expiresAt, note: record.note });
  }
  await writePinStore(env.STARVIA_KV, store);
  return json({ success: true, issued, count });
}

// POST /v1/admin/pins/revoke { pin: "STAR-XXXXXXXX" }
// Revoke a PIN by its code — marks it as used+expired immediately
export async function revokePin(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400);
  }
  const pin = normalizePin(body.pin);
  if (!pin) return json({ success: false, error: 'MISSING_PIN', message: 'ระบุรหัส PIN' }, 400);

  const store = await readPinStore(env.STARVIA_KV);
  const idx = await findPinByHash(store, pin);
  if (idx === -1) return json({ success: false, error: 'NOT_FOUND', message: 'ไม่พบ PIN นี้' }, 404);

  const record = store.pins[idx];
  if (record.usedAt) {
    return json({ success: false, error: 'ALREADY_USED', message: 'PIN นี้ถูกใช้ไปแล้ว' }, 409);
  }

  // Mark as used + expired
  store.pins[idx] = {
    ...record,
    usedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() - 1).toISOString(),
    note: (record.note || '') + ' [REVOKED]',
  };
  await writePinStore(env.STARVIA_KV, store);
  return json({ success: true, revoked: pin });
}

// POST /v1/admin/pins/expire { note: "..." }
export async function expirePin(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400);
  }
  const note = (body.note || '').trim();
  if (!note) return json({ success: false, error: 'MISSING_NOTE', message: 'ระบุ note ของ PIN ที่ต้องการหมดอายุ' }, 400);
  const store = await readPinStore(env.STARVIA_KV);
  const idx = store.pins.findIndex(r => r.note === note && !r.usedAt);
  if (idx === -1) return json({ success: false, error: 'NOT_FOUND', message: 'ไม่พบ PIN ที่ยังไม่ถูกใช้' }, 404);
  store.pins[idx] = { ...store.pins[idx], expiresAt: new Date(Date.now() - 1).toISOString() };
  await writePinStore(env.STARVIA_KV, store);
  return json({ success: true, expired: note });
}

// POST /v1/admin/pins/delete { note: "..." }
export async function deletePin(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400);
  }
  const note = (body.note || '').trim();
  if (!note) return json({ success: false, error: 'MISSING_NOTE', message: 'ระบุ note ของ PIN ที่ต้องการลบ' }, 400);
  const store = await readPinStore(env.STARVIA_KV);
  const idx = store.pins.findIndex(r => r.note === note && !r.usedAt);
  if (idx === -1) return json({ success: false, error: 'NOT_FOUND', message: 'ไม่พบ PIN ที่ยังไม่ถูกใช้' }, 404);
  store.pins.splice(idx, 1);
  await writePinStore(env.STARVIA_KV, store);
  return json({ success: true, deleted: note });
}

// Auth wrapper for admin routes
export async function withAdminAuth(context, handler) {
  const check = await requireAdmin(context.request, context.env);
  if (!check.ok) {
    return json({ success: false, error: check.error, message: 'กรุณาเข้าสู่ระบบก่อน' }, check.status);
  }
  return handler(context);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
