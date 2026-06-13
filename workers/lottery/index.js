/**
 * STARVIA Lottery Worker — Cloudflare Workers + KV
 * Handles: /v1/lottery/* endpoints
 * 
 * Endpoints:
 *   GET  /v1/lottery/results  — Get cached lottery results
 *   POST /v1/lottery/refresh  — Refresh from GLO API
 *   POST /v1/lottery/manual   — Manual override
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/v1/lottery/health') {
      return jsonResponse({ ok: true, service: 'starvia-lottery-worker' }, corsHeaders);
    }

    // GET /v1/lottery/results
    if (request.method === 'GET' && url.pathname === '/v1/lottery/results') {
      try {
        const results = await getCachedResults(env);
        return jsonResponse({ success: true, ...results }, corsHeaders);
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, corsHeaders, 500);
      }
    }

    // POST /v1/lottery/refresh
    if (request.method === 'POST' && url.pathname === '/v1/lottery/refresh') {
      try {
        const result = await refreshLotteryResults(env);
        return jsonResponse({ success: true, ...result }, corsHeaders);
      } catch (err) {
        return jsonResponse({ success: false, error: err.message }, corsHeaders, 500);
      }
    }

    // POST /v1/lottery/manual
    if (request.method === 'POST' && url.pathname === '/v1/lottery/manual') {
      try {
        const body = await request.json();
        const result = setManualResults(body, env);
        return jsonResponse(result, corsHeaders);
      } catch (err) {
        return jsonResponse({ success: false, error: 'ข้อมูลไม่ถูกต้อง' }, corsHeaders, 400);
      }
    }

    // 404
    return jsonResponse({ success: false, error: 'NOT_FOUND' }, corsHeaders, 404);
  }
};

// ── KV Helpers ──

const CACHE_KEY = 'lottery-results';

async function getCachedResults(env) {
  const cached = await env.KV.get(CACHE_KEY, { type: 'json' });
  if (cached && cached.firstPrize) return cached;
  return { available: false, message: 'ยังไม่มีข้อมูลผลหวย' };
}

async function cacheResults(env, data) {
  await env.KV.put(CACHE_KEY, JSON.stringify(data), { expirationTtl: 86400 * 7 }); // 7 days
}

// ── GLO API Fetch ──

async function fetchFromGLO() {
  const response = await fetch('https://www.glo.or.th/api/lottery/getLatestLottery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`GLO API returned ${response.status}`);
  }

  const parsed = await response.json();
  if (!parsed.status || !parsed.response) {
    throw new Error('GLO API returned unexpected response');
  }

  return parsed.response;
}

function extractSummary(response) {
  const data = response.data || {};
  return {
    date: response.date || '',
    displayDate: response.displayDate || {},
    period: response.period || [],
    firstPrize: (data.first && data.first.number && data.first.number[0]) 
      ? data.first.number[0].value : null,
    last3f: (data.last3f && data.last3f.number)
      ? data.last3f.number.map(n => n.value) : [],
    last3b: (data.last3b && data.last3b.number)
      ? data.last3b.number.map(n => n.value) : [],
    last2: (data.last2 && data.last2.number)
      ? data.last2.number.map(n => n.value) : [],
    near1: (data.near1 && data.near1.number)
      ? data.near1.number.map(n => n.value) : [],
  };
}

// ── Refresh ──

async function refreshLotteryResults(env) {
  const response = await fetchFromGLO();
  const summary = extractSummary(response);

  if (summary.firstPrize || summary.last2.length > 0) {
    const result = { available: true, ...summary, updatedAt: new Date().toISOString(), source: 'glo.or.th' };
    await cacheResults(env, result);
    return { message: 'อัปเดตผลหวยสำเร็จ', data: result };
  }

  return { message: 'ยังไม่ออกรางวัล', data: null };
}

// ── Manual Override ──

function setManualResults(data, env) {
  if (!data || !data.firstPrize) {
    return { success: false, message: 'Missing required fields: firstPrize' };
  }

  const dateStr = data.date || new Date().toISOString().split('T')[0];
  let displayDate = data.displayDate;
  if (!displayDate || (!displayDate.date && !displayDate.month && !displayDate.year)) {
    const parts = dateStr.split('-');
    displayDate = { date: parts[2] || '', month: parts[1] || '', year: parts[0] || '' };
  }

  const result = {
    available: true,
    date: dateStr,
    displayDate,
    period: data.period || [],
    firstPrize: data.firstPrize,
    last3f: data.last3f || [],
    last3b: data.last3b || [],
    last2: data.last2 || [],
    near1: data.near1 || [],
    updatedAt: new Date().toISOString(),
    source: 'manual',
  };

  // Cache manually (no await needed for response)
  env.ctx.waitUntil(cacheResults(env, result));

  return { success: true, message: 'Manual results saved', data: result };
}

// ── Helpers ──

function jsonResponse(data, corsHeaders = {}, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}
