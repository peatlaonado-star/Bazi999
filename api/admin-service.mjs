// STARVIA Admin Service — PIN management + dashboard
import crypto from 'node:crypto';
import fs from 'node:fs';

const DEFAULT_ADMIN_TOKEN_TTL = 12 * 60 * 60; // 12 hours

export function loadAdminConfig(env = process.env) {
  if (!env.STARVIA_ADMIN_PASSWORD) {
    throw new Error('STARVIA_ADMIN_PASSWORD is required');
  }
  if (!env.STARVIA_ADMIN_JWT_SECRET) {
    throw new Error('STARVIA_ADMIN_JWT_SECRET is required');
  }
  return {
    adminPassword: env.STARVIA_ADMIN_PASSWORD,
    adminJwtSecret: env.STARVIA_ADMIN_JWT_SECRET,
    pinStoreFile: env.STARVIA_PIN_STORE_FILE || '',
    tokenTtlSeconds: Number(env.STARVIA_ADMIN_TOKEN_TTL || DEFAULT_ADMIN_TOKEN_TTL),
    now: () => Math.floor(Date.now() / 1000),
  };
}

// ── Admin Auth ──

export function adminLogin(password, config) {
  if (!password || password !== config.adminPassword) {
    return { status: 401, body: { success: false, error: 'INVALID_PASSWORD', message: 'รหัสผ่านไม่ถูกต้อง' } };
  }
  const issuedAt = config.now();
  const expiresAt = issuedAt + config.tokenTtlSeconds;
  const token = signAdminToken({ role: 'admin', iat: issuedAt, exp: expiresAt }, config.adminJwtSecret);
  return { status: 200, body: { success: true, token, expiresIn: config.tokenTtlSeconds } };
}

export function verifyAdminAuth(authorization, config) {
  const token = extractBearerToken(authorization);
  if (!token) return null;
  const verified = verifyAdminToken(token, config.adminJwtSecret);
  if (!verified.valid) return null;
  if (Number(verified.payload.exp) <= config.now()) return null;
  return verified.payload;
}

// ── PIN Store Helpers ──

function readPinStore(filePath) {
  if (!filePath) return { pins: [] };
  if (!fs.existsSync(filePath)) return { pins: [] };
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return { ...parsed, pins: Array.isArray(parsed.pins) ? parsed.pins : [] };
}

function writePinStore(filePath, store) {
  if (!filePath) { console.warn('[admin] pinStoreFile not configured, skipping write'); return; }
  fs.mkdirSync(require('node:path').dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(store, null, 2)}\n`);
}

// ── Stats ──

export function getPinStats(config) {
  const store = readPinStore(config.pinStoreFile);
  const now = config.now();
  const total = store.pins.length;
  const unused = store.pins.filter((r) => !r.usedAt && (!r.expiresAt || new Date(r.expiresAt).getTime() > now * 1000)).length;
  const used = store.pins.filter((r) => !!r.usedAt).length;
  const expired = total - unused - used;
  return { status: 200, body: { success: true, total, unused, used, expired } };
}

// ── List PINs ──

export function listPins(query, config) {
  const store = readPinStore(config.pinStoreFile);
  const now = config.now();
  let pins;

  // Filter raw records by status, then map to public format
  const statusFilter = (query.status || '').toLowerCase();
  if (statusFilter === 'unused') {
    pins = store.pins.filter((r) => !r.usedAt && (!r.expiresAt || new Date(r.expiresAt).getTime() > now * 1000)).map(makePinPublic);
  } else if (statusFilter === 'used') {
    pins = store.pins.filter((r) => !!r.usedAt).map(makePinPublic);
  } else if (statusFilter === 'expired') {
    pins = store.pins.filter((r) => !r.usedAt && r.expiresAt && new Date(r.expiresAt).getTime() <= now * 1000).map(makePinPublic);
  } else {
    pins = store.pins.map(makePinPublic);
  }

  return { status: 200, body: { success: true, pins } };
}

function makePinPublic(record) {
  return {
    created: record.createdAt || '',
    expires: record.expiresAt || '',
    used: record.usedAt || null,
    plan: record.plan || 'premium_199',
    note: record.note || '',
    status: record.usedAt ? 'used' : (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now() ? 'expired' : 'active'),
  };
}

// ── Issue PINs ──

const PIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function issuePins(body, config) {
  const count = Math.max(1, Math.min(50, Number(body.count) || 1));
  const days = Math.max(1, Math.min(365, Number(body.days) || 7));
  const plan = (body.plan || 'premium_199');
  const noteBase = body.note || '';
  const store = readPinStore(config.pinStoreFile);
  const nowDate = new Date(config.now() * 1000);
  const issued = [];

  for (let i = 0; i < count; i++) {
    let pin;
    let pinHash;
    do {
      pin = generatePin();
      pinHash = hashPin(pin);
    } while (store.pins.some((r) => r.pinHash === pinHash && !r.usedAt));

    const record = {
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

  writePinStore(config.pinStoreFile, store);
  return { status: 200, body: { success: true, issued, count } };
}

function generatePin() {
  return 'STAR-' + Array.from({ length: 8 }, () => PIN_ALPHABET[crypto.randomInt(0, PIN_ALPHABET.length)]).join('');
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim().toUpperCase()).digest('hex');
}

// ── Expire PIN ──

export function expirePin(body, config) {
  const note = (body.note || '').trim();
  if (!note) return { status: 400, body: { success: false, error: 'MISSING_NOTE', message: 'ระบุ note ของ PIN ที่ต้องการหมดอายุ' } };
  const store = readPinStore(config.pinStoreFile);
  const idx = store.pins.findIndex((r) => r.note === note && !r.usedAt);
  if (idx === -1) return { status: 404, body: { success: false, error: 'NOT_FOUND', message: 'ไม่พบ PIN ที่ยังไม่ถูกใช้' } };

  store.pins[idx] = { ...store.pins[idx], expiresAt: new Date(config.now() * 1000 - 1).toISOString() };
  writePinStore(config.pinStoreFile, store);
  return { status: 200, body: { success: true, expired: note } };
}

// ── Delete PIN ──

export function deletePin(body, config) {
  const note = (body.note || '').trim();
  if (!note) return { status: 400, body: { success: false, error: 'MISSING_NOTE', message: 'ระบุ note ของ PIN ที่ต้องการลบ' } };
  const store = readPinStore(config.pinStoreFile);
  const idx = store.pins.findIndex((r) => r.note === note && !r.usedAt);
  if (idx === -1) return { status: 404, body: { success: false, error: 'NOT_FOUND', message: 'ไม่พบ PIN ที่ยังไม่ถูกใช้' } };

  store.pins.splice(idx, 1);
  writePinStore(config.pinStoreFile, store);
  return { status: 200, body: { success: true, deleted: note } };
}

// ── Token Helpers ──

function signAdminToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(`${encHeader}.${encPayload}`).digest('base64url');
  return `${encHeader}.${encPayload}.${sig}`;
}

function verifyAdminToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return { valid: false };
  const [encHeader, encPayload, sig] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${encHeader}.${encPayload}`).digest('base64url');
  if (!constantTimeEqual(sig, expected)) return { valid: false };
  try {
    const payload = JSON.parse(Buffer.from(encPayload, 'base64url').toString('utf8'));
    return { valid: true, payload };
  } catch { return { valid: false }; }
}

function extractBearerToken(value = '') {
  const match = String(value).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function constantTimeEqual(a, b) {
  const ab = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// ── Request handler factory ──

export function createAdminRequestHandler(config) {
  return function adminRequestHandler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      writeJson(res, 204, null, config, req);
      return;
    }

    // Health — no auth needed
    if (req.method === 'GET' && pathname(req.url) === '/v1/admin/health') {
      writeJson(res, 200, { ok: true, service: 'starvia-admin-api' });
      return;
    }

    // Auth-required routes
    const admin = verifyAdminAuth(req.headers.authorization || '', config);

    if (req.method === 'POST' && pathname(req.url) === '/v1/admin/login') {
      handleJson(req, (body) => {
        const result = adminLogin(body.password, config);
        writeJson(res, result.status, result.body, config, req);
      }, () => writeJson(res, 400, { success: false, error: 'BAD_REQUEST' }, config, req));
      return;
    }

    if (!admin) {
      writeJson(res, 401, { success: false, error: 'UNAUTHORIZED', message: 'กรุณาเข้าสู่ระบบก่อน' });
      return;
    }

    if (req.method === 'GET' && pathname(req.url) === '/v1/admin/stats') {
      const result = getPinStats(config);
      writeJson(res, result.status, result.body);
      return;
    }

    if (req.method === 'GET' && pathname(req.url) === '/v1/admin/pins') {
      const query = parseQuery(req.url);
      const result = listPins(query, config);
      writeJson(res, result.status, result.body);
      return;
    }

    if (req.method === 'POST' && pathname(req.url) === '/v1/admin/pins/issue') {
      handleJson(req, (body) => {
        try {
          const result = issuePins(body, config);
          writeJson(res, result.status, result.body);
        } catch (e) {
          writeJson(res, 400, { success: false, error: 'ISSUE_ERROR', message: e.message });
        }
      }, () => writeJson(res, 400, { success: false, error: 'BAD_REQUEST', message: 'Invalid JSON body' }));
      return;
    }

    if (req.method === 'POST' && pathname(req.url) === '/v1/admin/pins/expire') {
      handleJson(req, (body) => {
        const result = expirePin(body, config);
        writeJson(res, result.status, result.body);
      }, () => writeJson(res, 400, { success: false, error: 'BAD_REQUEST' }));
      return;
    }

    if (req.method === 'POST' && pathname(req.url) === '/v1/admin/pins/delete') {
      handleJson(req, (body) => {
        const result = deletePin(body, config);
        writeJson(res, result.status, result.body);
      }, () => writeJson(res, 400, { success: false, error: 'BAD_REQUEST' }));
      return;
    }

    writeJson(res, 404, { success: false, error: 'NOT_FOUND' });
  };
}

// ── Utilities ──

function pathname(url) {
  try { return new URL(url, 'http://localhost').pathname; } catch { return '/'; }
}

function parseQuery(url) {
  const params = {};
  try { new URL(url, 'http://localhost').searchParams.forEach((v, k) => { params[k] = v; }); } catch {}
  return params;
}

function handleJson(req, onSuccess, onError) {
  const chunks = [];
  req.on('data', (chunk) => {
    chunks.push(chunk);
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    if (totalLen > 10_000) { req.destroy(); onError(); }
  });
  req.on('end', () => {
    try {
      const raw = Buffer.concat(chunks).toString('utf8');
      onSuccess(raw ? JSON.parse(raw) : {});
    } catch { onError(); }
  });
  req.on('error', onError);
}

function writeJson(res, status, body, _config, _req) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  if (body === null) { res.end(); return; }
  res.end(JSON.stringify(body));
}
