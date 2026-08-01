// STARVIA Pick-a-Card Service — quota (1/day) + streak (consecutive days) + history
// Storage: STARVIA_KV (key: "pick:{fingerprint}")
// Fingerprint = SHA-256(UA + IP) → 16 hex (same pattern as streak.js)

import { jsonResponse, errorResponse, getClientIp } from './cors.js';

const DAILY_QUOTA = 1;
const HISTORY_CAP = 10;
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

// ── Pure helpers ────────────────────────────────

/** Today's key YYYY-MM-DD in Bangkok time (UTC+7) */
export function todayKey(now = new Date()) {
  return new Date(now.getTime() + BANGKOK_OFFSET_MS).toISOString().slice(0, 10);
}

function yesterdayKey(today) {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function emptyState() {
  return { quotaLeft: DAILY_QUOTA, streak: 0, lastPickDate: null, lastStreakDate: null, history: [] };
}

/**
 * Refresh per-day quota. If today differs from lastPickDate → reset quota to 1.
 * Pure: returns a new state object, never mutates prev.
 */
export function refreshDaily(prev, today) {
  if (!prev) return emptyState();
  const isNewDay = prev.lastPickDate !== today;
  if (!isNewDay) return { ...prev };
  return { ...prev, quotaLeft: DAILY_QUOTA, lastPickDate: today };
}

/**
 * Spend 1 quota, update streak, push history entry (newest first, capped).
 * Assumes quota was already refreshed by the caller. Pure.
 */
export function applyDraw(prev, today, entry) {
  const streak =
    prev.lastStreakDate === today ? prev.streak
    : prev.lastStreakDate === yesterdayKey(today) ? prev.streak + 1
    : 1;
  const history = [
    { ...entry, date: new Date().toISOString() },
    ...(prev.history || []),
  ].slice(0, HISTORY_CAP);
  return {
    ...prev,
    quotaLeft: Math.max(0, prev.quotaLeft - 1),
    streak,
    lastPickDate: today,
    lastStreakDate: today,
    history,
  };
}

// ── KV access ───────────────────────────────────

function stateKey(fingerprint) {
  return `pick:${fingerprint}`;
}

async function readState(kv, fingerprint) {
  try {
    const data = await kv.get(stateKey(fingerprint), { type: 'json' });
    if (data && typeof data === 'object') return data;
  } catch (e) {
    // ignore → fresh state
  }
  return emptyState();
}

// ── Fingerprint (same as streak.js) ─────────────

export async function createFingerprint(request) {
  const ua = request.headers.get('user-agent') || '';
  const ip = getClientIp(request);
  const combined = `${ua}:${ip}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined));
  const arr = new Uint8Array(buf);
  let hex = '';
  for (let i = 0; i < 8; i++) hex += arr[i].toString(16).padStart(2, '0');
  return hex;
}

// ── HTTP handlers ───────────────────────────────

/** GET /v1/pick/state — returns quota/streak/history for this visitor */
export async function getPickState(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');
  const fingerprint = await createFingerprint(request);
  const today = todayKey();

  const prev = await readState(env.STARVIA_KV, fingerprint);
  const next = refreshDaily(prev, today);
  if (next.lastPickDate !== prev.lastPickDate || prev.lastPickDate === null) {
    await env.STARVIA_KV.put(stateKey(fingerprint), JSON.stringify(next));
  }

  return jsonResponse({ success: true, ...next, today });
}

/** POST /v1/pick/draw { topic, slug, name, emoji } — spend quota, return new state */
export async function drawPick(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) return errorResponse(500, 'KV_NOT_BOUND', 'เซิร์ฟเวอร์ยังไม่พร้อม');

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    return errorResponse(400, 'INVALID_JSON', 'ส่งข้อมูลไม่ถูกต้อง');
  }
  if (!body.slug) return errorResponse(400, 'MISSING_CARD', 'ไม่พบข้อมูลไพ่');

  const fingerprint = await createFingerprint(request);
  const today = todayKey();

  const prev = await readState(env.STARVIA_KV, fingerprint);
  const refreshed = refreshDaily(prev, today);
  if (refreshed.quotaLeft <= 0) {
    return errorResponse(429, 'QUOTA_EXCEEDED', 'วันนี้เปิดไพ่ครบ 1 ครั้งแล้ว พรุ่งนี้มาใหม่นะคะ ✨');
  }

  const entry = {
    slug: body.slug,
    name: body.name || body.slug,
    emoji: body.emoji || '🃏',
    topic: body.topic || 'general',
    reading: body.reading || '',
    pos: body.pos != null ? Number(body.pos) : null,
    sub: body.sub || '',
    num: body.num || '',
    color: body.color || '',
    do: body.do || '',
    dont: body.dont || '',
  };
  const next = applyDraw(refreshed, today, entry);
  await env.STARVIA_KV.put(stateKey(fingerprint), JSON.stringify(next));

  return jsonResponse({ success: true, ...next, today });
}
