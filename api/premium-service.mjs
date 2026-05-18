import crypto from 'node:crypto';

const DEFAULT_PLAN = 'premium_199';
const DEFAULT_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function loadPremiumConfig(env = process.env) {
  const allowedPins = parseAllowedPins(env.STARVIA_PREMIUM_PINS);
  if (!allowedPins.length) {
    throw new Error('STARVIA_PREMIUM_PINS is required');
  }

  if (!env.STARVIA_JWT_SECRET) {
    throw new Error('STARVIA_JWT_SECRET is required');
  }

  return {
    allowedPins,
    jwtSecret: env.STARVIA_JWT_SECRET,
    plan: env.STARVIA_PREMIUM_PLAN || DEFAULT_PLAN,
    tokenTtlSeconds: Number(env.STARVIA_TOKEN_TTL_SECONDS || DEFAULT_TOKEN_TTL_SECONDS),
    now: () => Math.floor(Date.now() / 1000),
  };
}

export function verifyPremiumPin(input = {}, config) {
  assertUsableConfig(config);

  const normalizedPin = normalizePin(input.pin);
  if (!normalizedPin) {
    return invalidPinResponse(400);
  }

  const allowedPins = new Set(config.allowedPins.map(normalizePin));
  if (!allowedPins.has(normalizedPin)) {
    return invalidPinResponse(401);
  }

  const issuedAt = Number(config.now ? config.now() : Math.floor(Date.now() / 1000));
  const expiresIn = Number(config.tokenTtlSeconds || DEFAULT_TOKEN_TTL_SECONDS);
  const expiresAt = issuedAt + expiresIn;
  const token = signPremiumToken({
    sub: buildSubjectFromPin(normalizedPin),
    plan: config.plan || DEFAULT_PLAN,
    iat: issuedAt,
    exp: expiresAt,
  }, config.jwtSecret);

  return {
    status: 200,
    body: {
      success: true,
      token,
      expiresIn,
      plan: config.plan || DEFAULT_PLAN,
    },
  };
}

export function createPremiumRequestHandler(config) {
  assertUsableConfig(config);

  return async function premiumRequestHandler(req, res) {
    if (req.method === 'OPTIONS') {
      writeJson(res, 204, null);
      return;
    }

    if (req.method === 'POST' && getPathname(req.url) === '/v1/premium/verify') {
      try {
        const body = await readJsonBody(req);
        const result = verifyPremiumPin(body, config);
        writeJson(res, result.status, result.body);
      } catch (error) {
        writeJson(res, 400, {
          success: false,
          error: 'BAD_REQUEST',
          message: 'รูปแบบคำขอไม่ถูกต้อง',
        });
      }
      return;
    }

    writeJson(res, 404, {
      success: false,
      error: 'NOT_FOUND',
      message: 'ไม่พบ endpoint ที่เรียก',
    });
  };
}

function parseAllowedPins(value = '') {
  return String(value)
    .split(',')
    .map(normalizePin)
    .filter(Boolean);
}

function normalizePin(pin) {
  return String(pin || '').trim().toUpperCase();
}

function assertUsableConfig(config) {
  if (!config || !Array.isArray(config.allowedPins) || !config.allowedPins.length) {
    throw new Error('Premium API config requires allowedPins');
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

function getPathname(url = '/') {
  return new URL(url, 'http://localhost').pathname;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 10_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function writeJson(res, status, body) {
  res.writeHead(status, JSON_HEADERS);
  if (body === null) {
    res.end();
    return;
  }
  res.end(JSON.stringify(body));
}
