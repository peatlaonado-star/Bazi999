import crypto from 'node:crypto';
import fs from 'node:fs';

const DEFAULT_PLAN = 'premium_199';
const DEFAULT_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function loadPremiumConfig(env = process.env) {
  const allowedPins = parseAllowedPins(env.STARVIA_PREMIUM_PINS);
  const pinStoreFile = env.STARVIA_PIN_STORE_FILE || '';
  if (!allowedPins.length && !pinStoreFile) {
    throw new Error('STARVIA_PREMIUM_PINS or STARVIA_PIN_STORE_FILE is required');
  }

  if (!env.STARVIA_JWT_SECRET) {
    throw new Error('STARVIA_JWT_SECRET is required');
  }

  return {
    allowedPins,
    pinStoreFile,
    jwtSecret: env.STARVIA_JWT_SECRET,
    plan: env.STARVIA_PREMIUM_PLAN || DEFAULT_PLAN,
    tokenTtlSeconds: Number(env.STARVIA_TOKEN_TTL_SECONDS || DEFAULT_TOKEN_TTL_SECONDS),
    allowedOrigins: parseAllowedOrigins(env.STARVIA_ALLOWED_ORIGINS),
    now: () => Math.floor(Date.now() / 1000),
  };
}

export function verifyPremiumPin(input = {}, config) {
  assertUsableConfig(config);

  const normalizedPin = normalizePin(input.pin);
  if (!normalizedPin) {
    return invalidPinResponse(400);
  }

  const issuedAt = Number(config.now ? config.now() : Math.floor(Date.now() / 1000));
  const storedPinResult = config.pinStoreFile ? consumeStoredPin(normalizedPin, config, issuedAt) : null;
  if (storedPinResult && !storedPinResult.success) {
    return storedPinResult.response;
  }

  if (!storedPinResult) {
    const allowedPins = new Set((config.allowedPins || []).map(normalizePin));
    if (!allowedPins.has(normalizedPin)) {
      return invalidPinResponse(401);
    }
  }

  const expiresIn = Number(config.tokenTtlSeconds || DEFAULT_TOKEN_TTL_SECONDS);
  const expiresAt = issuedAt + expiresIn;
  const plan = (storedPinResult && storedPinResult.record.plan) || config.plan || DEFAULT_PLAN;
  const token = signPremiumToken({
    sub: buildSubjectFromPin(normalizedPin),
    plan,
    iat: issuedAt,
    exp: expiresAt,
  }, config.jwtSecret);

  return {
    status: 200,
    body: {
      success: true,
      token,
      expiresIn,
      plan,
    },
  };
}

export function checkPremiumStatus(input = {}, config) {
  assertUsableConfig(config);

  const token = extractBearerToken(input.authorization);
  if (!token) {
    return premiumStatusError(401, 'TOKEN_REQUIRED', 'กรุณาเข้าสู่ระบบ Premium อีกครั้ง');
  }

  const verified = verifyPremiumToken(token, config.jwtSecret);
  if (!verified.valid) {
    return premiumStatusError(401, verified.error || 'TOKEN_INVALID', 'Token Premium ไม่ถูกต้อง');
  }

  const now = Number(config.now ? config.now() : Math.floor(Date.now() / 1000));
  if (Number(verified.payload.exp) <= now) {
    return premiumStatusError(401, 'TOKEN_EXPIRED', 'สิทธิ์ Premium หมดอายุแล้ว');
  }

  return {
    status: 200,
    body: {
      active: true,
      plan: verified.payload.plan || config.plan || DEFAULT_PLAN,
      expiresAt: new Date(Number(verified.payload.exp) * 1000).toISOString(),
    },
  };
}

export function createPremiumRequestHandler(config) {
  assertUsableConfig(config);

  return async function premiumRequestHandler(req, res) {
    if (req.method === 'OPTIONS') {
      writeJson(res, 204, null, config, req);
      return;
    }

    if (req.method === 'GET' && getPathname(req.url) === '/v1/health') {
      writeJson(res, 200, { ok: true, service: 'starvia-premium-api' }, config, req, {
        'Cache-Control': 'no-store',
      });
      return;
    }

    if (req.method === 'POST' && getPathname(req.url) === '/v1/premium/verify') {
      try {
        const body = await readJsonBody(req);
        const result = verifyPremiumPin(body, config);
        writeJson(res, result.status, result.body, config, req);
      } catch (error) {
        writeJson(res, 400, {
          success: false,
          error: 'BAD_REQUEST',
          message: 'รูปแบบคำขอไม่ถูกต้อง',
        }, config, req);
      }
      return;
    }

    if (req.method === 'GET' && getPathname(req.url) === '/v1/premium/status') {
      const result = checkPremiumStatus({ authorization: req.headers.authorization || '' }, config);
      writeJson(res, result.status, result.body, config, req);
      return;
    }

    writeJson(res, 404, {
      success: false,
      error: 'NOT_FOUND',
      message: 'ไม่พบ endpoint ที่เรียก',
    }, config, req);
  };
}

function parseAllowedPins(value = '') {
  return String(value)
    .split(',')
    .map(normalizePin)
    .filter(Boolean);
}

function parseAllowedOrigins(value = '') {
  return String(value)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function normalizePin(pin) {
  return String(pin || '').trim().toUpperCase();
}

function assertUsableConfig(config) {
  if (!config || ((!Array.isArray(config.allowedPins) || !config.allowedPins.length) && !config.pinStoreFile)) {
    throw new Error('Premium API config requires allowedPins or pinStoreFile');
  }
  if (!config.jwtSecret) {
    throw new Error('Premium API config requires jwtSecret');
  }
}

function invalidPinResponse(status) {
  return {
    status,
    body: {
      success: false,
      error: 'INVALID_PIN',
      message: 'รหัสผ่านไม่ถูกต้อง',
    },
  };
}

function consumeStoredPin(normalizedPin, config, issuedAt) {
  const store = readPinStore(config.pinStoreFile);
  const pinHash = hashStoredPin(normalizedPin);
  const recordIndex = store.pins.findIndex((record) => record.pinHash === pinHash);
  if (recordIndex === -1) {
    return { success: false, response: invalidPinResponse(401) };
  }

  const record = store.pins[recordIndex];
  if (record.usedAt) {
    return { success: false, response: pinStoreError(409, 'PIN_USED', 'รหัสนี้ถูกใช้งานไปแล้ว') };
  }

  if (record.expiresAt && Date.parse(record.expiresAt) <= issuedAt * 1000) {
    return { success: false, response: pinStoreError(410, 'PIN_EXPIRED', 'รหัสนี้หมดอายุแล้ว') };
  }

  const usedAt = new Date(issuedAt * 1000).toISOString();
  store.pins[recordIndex] = {
    ...record,
    plan: record.plan || config.plan || DEFAULT_PLAN,
    usedAt,
  };
  writePinStore(config.pinStoreFile, store);

  return { success: true, record: store.pins[recordIndex] };
}

function readPinStore(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    ...parsed,
    pins: Array.isArray(parsed.pins) ? parsed.pins : [],
  };
}

function writePinStore(filePath, store) {
  fs.writeFileSync(filePath, `${JSON.stringify(store, null, 2)}\n`);
}

function hashStoredPin(pin) {
  return crypto.createHash('sha256').update(normalizePin(pin)).digest('hex');
}

function pinStoreError(status, error, message) {
  return {
    status,
    body: {
      success: false,
      error,
      message,
    },
  };
}

function signPremiumToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function buildSubjectFromPin(pin) {
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex').slice(0, 16);
  return `pin_${pinHash}`;
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function extractBearerToken(value = '') {
  const match = String(value).match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

function verifyPremiumToken(token, secret) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'TOKEN_INVALID' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  if (!constantTimeEqual(signature, expectedSignature)) {
    return { valid: false, error: 'TOKEN_INVALID' };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: 'TOKEN_INVALID' };
  }
}

function premiumStatusError(status, error, message) {
  return {
    status,
    body: {
      active: false,
      error,
      message,
    },
  };
}

function constantTimeEqual(a, b) {
  const aBuffer = Buffer.from(String(a));
  const bBuffer = Buffer.from(String(b));
  if (aBuffer.length !== bBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function getPathname(url = '/') {
  return new URL(url, 'http://localhost').pathname;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => {
      chunks.push(chunk);
      const totalLen = chunks.reduce((s, c) => s + c.length, 0);
      if (totalLen > 10_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function writeJson(res, status, body, config = {}, req = {}, extraHeaders = {}) {
  res.writeHead(status, buildResponseHeaders(config, req, extraHeaders));
  if (body === null) {
    res.end();
    return;
  }
  res.end(JSON.stringify(body));
}

function buildResponseHeaders(config = {}, req = {}, extraHeaders = {}) {
  const headers = { ...JSON_HEADERS, ...extraHeaders };
  const allowedOrigins = Array.isArray(config.allowedOrigins) ? config.allowedOrigins : [];
  const requestOrigin = req.headers ? req.headers.origin : '';

  if (!allowedOrigins.length) {
    headers['Access-Control-Allow-Origin'] = '*';
    return headers;
  }

  headers.Vary = 'Origin';
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  }

  return headers;
}
