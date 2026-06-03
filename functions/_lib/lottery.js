// STARVIA Lottery Service — Cloudflare Pages Functions + KV
// Replaces api/lottery-service.mjs Node.js implementation
// Storage: STARVIA_KV (key: "lottery:results")
// Fallback: HARDCODED_SEED (last known result)

const RESULTS_KEY = 'lottery:results';
const RESULTS_TTL_SECONDS = 60 * 60 * 24; // 24h cache

// Last known result (fallback when KV is empty) — updated 2026-06-01
const HARDCODED_SEED = {
  available: true,
  date: '2026-06-01',
  displayDate: { date: '01', month: '06', year: '2026' },
  period: [],
  firstPrize: '173770',
  last3f: ['848', '415'],
  last3b: ['410', '938'],
  last2: ['95'],
  near1: ['173769', '173771'],
  updatedAt: '2026-06-02T08:30:00.000Z',
  source: 'thairath.co.th',
};

async function getCachedResults(kv) {
  // Try KV first
  try {
    const cached = await kv.get(RESULTS_KEY, { type: 'json' });
    if (cached && cached.firstPrize) return { data: cached, source: 'kv' };
  } catch (e) {
    // KV read failed — fall through
  }
  // Fall back to hardcoded seed and store in KV
  try {
    await kv.put(RESULTS_KEY, JSON.stringify(HARDCODED_SEED), {
      expirationTtl: RESULTS_TTL_SECONDS,
    });
  } catch (e) {
    // KV write failed — still return hardcoded
  }
  return { data: HARDCODED_SEED, source: 'hardcoded' };
}

async function setResults(kv, data) {
  await kv.put(RESULTS_KEY, JSON.stringify(data), {
    expirationTtl: RESULTS_TTL_SECONDS,
  });
  return true;
}

// Best-effort fetch from GLO (สำนักงานสลากกินแบ่งรัฐบาล) — usually delayed
async function tryFetchFromGLO() {
  try {
    const res = await fetch('https://www.glo.or.th/api/lottery/getLatestLottery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const parsed = await res.json();
    if (parsed.status && parsed.response && parsed.response.firstPrize) {
      return parsed.response;
    }
  } catch (e) {
    // ignore — GLO is often down or delayed
  }
  return null;
}

// Public lottery endpoint — GET /v1/lottery/results
export async function handleLotteryResults(context) {
  const { env } = context;
  const kv = env.STARVIA_KV;

  if (!kv) {
    return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  }

  const { data, source } = await getCachedResults(kv);

  // Best-effort: try GLO for fresher data (don't block on it)
  const gloResult = await tryFetchFromGLO();
  let result = data;
  if (gloResult && gloResult.date !== data.date) {
    result = gloResult;
    await setResults(kv, gloResult);
  }

  return json({
    success: true,
    ...result,
    _source: source, // debug — remove in production
  });
}

// Manual update — POST /v1/lottery/manual (admin only — see admin.js for auth)
export async function setLotteryResults(context, data) {
  const { env } = context;
  if (!env.STARVIA_KV) {
    return json({ success: false, error: 'KV_NOT_BOUND' }, 500);
  }
  if (!data || !data.firstPrize) {
    return json({ success: false, error: 'MISSING_DATA' }, 400);
  }
  await env.STARVIA_KV.put(RESULTS_KEY, JSON.stringify(data), {
    expirationTtl: RESULTS_TTL_SECONDS,
  });
  return json({ success: true, ...data });
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
