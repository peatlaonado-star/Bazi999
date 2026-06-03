// STARVIA Streak Service — Cloudflare Pages Functions + KV
// Replaces api/streak-service.mjs
// Storage: STARVIA_KV (key: "streak:rewards" — JSON array of all rewards)

const REWARDS_KEY = 'streak:rewards';
const SEED = { rewards: [] };

async function readRewards(kv) {
  try {
    const data = await kv.get(REWARDS_KEY, { type: 'json' });
    if (data && Array.isArray(data.rewards)) return data;
  } catch (e) {
    // ignore
  }
  // First run — seed empty
  try {
    await kv.put(REWARDS_KEY, JSON.stringify(SEED));
  } catch (e) {
    // ignore
  }
  return { ...SEED };
}

async function writeRewards(kv, store) {
  await kv.put(REWARDS_KEY, JSON.stringify(store));
  return true;
}

function genCode() {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `STREAK-${hex}`;
}

function createFingerprint(request) {
  const ua = request.headers.get('user-agent') || '';
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const combined = `${ua}:${ip}`;
  // SHA-256 hash → first 16 hex chars (matches Node version)
  return crypto.subtle
    .digest('SHA-256', new TextEncoder().encode(combined))
    .then(buf => {
      const arr = new Uint8Array(buf);
      let hex = '';
      for (let i = 0; i < 8; i++) hex += arr[i].toString(16).padStart(2, '0');
      return hex;
    });
}

async function hasClaimedThisMonth(kv, fingerprint) {
  const store = await readRewards(kv);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return store.rewards.some(
    r => r.fingerprint === fingerprint && r.claimedAt && r.claimedAt.startsWith(currentMonth)
  );
}

// POST /v1/streak/reward — create new streak reward
export async function createStreakReward(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) {
    return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  }

  const fingerprint = await createFingerprint(request);

  // Rate limit: 1 per month per user
  if (await hasClaimedThisMonth(env.STARVIA_KV, fingerprint)) {
    return json({
      success: false,
      error: 'ALREADY_CLAIMED',
      message: 'คุณรับรางวัลเดือนนี้ไปแล้ว เดือนหน้ามาใหม่นะคะ!',
    }, 429);
  }

  const code = genCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const store = await readRewards(env.STARVIA_KV);
  store.rewards.push({
    code,
    fingerprint,
    claimedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
    type: 'streak_7day',
  });
  await writeRewards(env.STARVIA_KV, store);

  return json({
    success: true,
    code,
    expiresAt: expiresAt.toISOString(),
    message: 'ปลดล็อก Premium ฟรี 24 ชม.!',
  });
}

// POST /v1/streak/verify { code: "STREAK-..." }
export async function verifyStreakReward(context) {
  const { request, env } = context;
  if (!env.STARVIA_KV) {
    return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'INVALID_JSON' }, 400);
  }
  const code = body.code;
  if (!code) {
    return json({ success: false, error: 'MISSING_CODE' }, 400);
  }

  const store = await readRewards(env.STARVIA_KV);
  const reward = store.rewards.find(r => r.code === code);

  if (!reward) {
    return json({ success: false, error: 'INVALID_CODE', message: 'รหัสไม่ถูกต้อง' }, 404);
  }
  if (reward.used) {
    return json({ success: false, error: 'CODE_USED', message: 'รหัสนี้ถูกใช้ไปแล้ว' }, 410);
  }
  if (new Date(reward.expiresAt) <= new Date()) {
    return json({ success: false, error: 'CODE_EXPIRED', message: 'รหัสนี้หมดอายุแล้ว' }, 410);
  }

  // Mark as used
  reward.used = true;
  reward.usedAt = new Date().toISOString();
  await writeRewards(env.STARVIA_KV, store);

  return json({
    success: true,
    message: 'ปลดล็อก Premium สำเร็จ!',
    expiresIn: 24 * 60 * 60,
  });
}

// GET /v1/streak/stats — admin view
export async function getStreakStats(context) {
  const { env } = context;
  if (!env.STARVIA_KV) {
    return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  }
  const store = await readRewards(env.STARVIA_KV);
  const now = new Date();
  return json({
    success: true,
    total: store.rewards.length,
    active: store.rewards.filter(r => !r.used && new Date(r.expiresAt) > now).length,
    used: store.rewards.filter(r => r.used).length,
    expired: store.rewards.filter(r => !r.used && new Date(r.expiresAt) <= now).length,
  });
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
