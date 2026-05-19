import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import {
  checkPremiumStatus,
  createPremiumRequestHandler,
  loadPremiumConfig,
  verifyPremiumPin,
} from '../api/premium-service.mjs';

const validConfig = {
  allowedPins: ['STAR199', 'LUCKY777'],
  jwtSecret: 'test-secret-with-enough-length',
  plan: 'premium_199',
  tokenTtlSeconds: 86400,
  now: () => 1_800_000_000,
};

describe('Premium verify service', () => {
  it('accepts a valid PIN and returns a signed premium token', () => {
    const result = verifyPremiumPin({ pin: 'STAR199' }, validConfig);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.plan).toBe('premium_199');
    expect(result.body.expiresIn).toBe(86400);
    expect(result.body.token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it('normalizes lowercase and whitespace before checking PINs', () => {
    const result = verifyPremiumPin({ pin: '  lucky777  ' }, validConfig);

    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
  });

  it('rejects an invalid PIN', () => {
    const result = verifyPremiumPin({ pin: 'WRONG' }, validConfig);

    expect(result.status).toBe(401);
    expect(result.body).toEqual({
      success: false,
      error: 'INVALID_PIN',
      message: 'รหัสผ่านไม่ถูกต้อง',
    });
  });

  it('rejects an empty PIN as a bad request', () => {
    const result = verifyPremiumPin({ pin: '   ' }, validConfig);

    expect(result.status).toBe(400);
    expect(result.body.error).toBe('INVALID_PIN');
  });

  it('requires production PIN source and JWT secret config', () => {
    expect(() => loadPremiumConfig({})).toThrow(/STARVIA_PREMIUM_PINS|STARVIA_PIN_STORE_FILE/);
    expect(() => loadPremiumConfig({ STARVIA_PREMIUM_PINS: 'STAR199' })).toThrow(/STARVIA_JWT_SECRET/);
  });
});

describe('Persistent premium PIN store', () => {
  it('loads config from STARVIA_PIN_STORE_FILE without env PINs', () => {
    const storeFile = writePinStore([{ pin: 'STAR199', plan: 'premium_199' }]);

    const config = loadPremiumConfig({
      STARVIA_PIN_STORE_FILE: storeFile,
      STARVIA_JWT_SECRET: 'test-secret-with-enough-length',
    });

    expect(config.pinStoreFile).toBe(storeFile);
    expect(config.allowedPins).toEqual([]);
  });

  it('accepts an unused stored PIN and marks it used for one-time access', () => {
    const storeFile = writePinStore([{ pin: 'STAR199', plan: 'premium_199' }]);
    const config = {
      allowedPins: [],
      pinStoreFile: storeFile,
      jwtSecret: 'test-secret-with-enough-length',
      plan: 'premium_199',
      tokenTtlSeconds: 86400,
      now: () => 1_800_000_000,
    };

    const first = verifyPremiumPin({ pin: ' star199 ' }, config);
    const second = verifyPremiumPin({ pin: 'STAR199' }, config);
    const stored = JSON.parse(fs.readFileSync(storeFile, 'utf8'));

    expect(first.status).toBe(200);
    expect(first.body.plan).toBe('premium_199');
    expect(stored.pins[0].usedAt).toBe('2027-01-15T08:00:00.000Z');
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('PIN_USED');
  });

  it('rejects expired stored PINs before issuing tokens', () => {
    const storeFile = writePinStore([{ pin: 'OLD199', expiresAt: '2027-01-15T07:59:59.000Z' }]);
    const config = {
      allowedPins: [],
      pinStoreFile: storeFile,
      jwtSecret: 'test-secret-with-enough-length',
      plan: 'premium_199',
      tokenTtlSeconds: 86400,
      now: () => 1_800_000_000,
    };

    const result = verifyPremiumPin({ pin: 'OLD199' }, config);

    expect(result.status).toBe(410);
    expect(result.body.error).toBe('PIN_EXPIRED');
  });
});

describe('Premium status service', () => {
  it('accepts a valid bearer token and returns active premium metadata', () => {
    const verifyResult = verifyPremiumPin({ pin: 'STAR199' }, validConfig);
    const status = checkPremiumStatus({ authorization: `Bearer ${verifyResult.body.token}` }, validConfig);

    expect(status.status).toBe(200);
    expect(status.body.active).toBe(true);
    expect(status.body.plan).toBe('premium_199');
    expect(status.body.expiresAt).toBe('2027-01-16T08:00:00.000Z');
  });

  it('rejects expired premium tokens', () => {
    const verifyResult = verifyPremiumPin({ pin: 'STAR199' }, validConfig);
    const status = checkPremiumStatus(
      { authorization: `Bearer ${verifyResult.body.token}` },
      { ...validConfig, now: () => 1_800_086_401 }
    );

    expect(status.status).toBe(401);
    expect(status.body).toEqual({
      active: false,
      error: 'TOKEN_EXPIRED',
      message: 'สิทธิ์ Premium หมดอายุแล้ว',
    });
  });

  it('rejects missing or malformed bearer tokens', () => {
    const status = checkPremiumStatus({ authorization: '' }, validConfig);

    expect(status.status).toBe(401);
    expect(status.body.error).toBe('TOKEN_REQUIRED');
  });
});

describe('Premium verify HTTP handler', () => {
  it('handles POST /v1/premium/verify with JSON body', async () => {
    const { baseUrl, close } = await startTestServer(validConfig);

    try {
      const response = await fetch(`${baseUrl}/v1/premium/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: 'STAR199' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.token).toMatch(/\./);
    } finally {
      await close();
    }
  });

  it('handles POST /v1/premium/verify against the persistent store and prevents PIN reuse', async () => {
    const storeFile = writePinStore([{ pin: 'LUCKY777', plan: 'premium_199' }]);
    const { baseUrl, close } = await startTestServer({ ...validConfig, allowedPins: [], pinStoreFile: storeFile });

    try {
      const first = await fetch(`${baseUrl}/v1/premium/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: 'LUCKY777' }),
      });
      const second = await fetch(`${baseUrl}/v1/premium/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: 'LUCKY777' }),
      });
      const secondBody = await second.json();

      expect(first.status).toBe(200);
      expect(second.status).toBe(409);
      expect(secondBody.error).toBe('PIN_USED');
    } finally {
      await close();
    }
  });

  it('handles GET /v1/premium/status with a bearer token', async () => {
    const { baseUrl, close } = await startTestServer(validConfig);
    const verifyResult = verifyPremiumPin({ pin: 'STAR199' }, validConfig);

    try {
      const response = await fetch(`${baseUrl}/v1/premium/status`, {
        headers: { Authorization: `Bearer ${verifyResult.body.token}` },
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.active).toBe(true);
      expect(body.plan).toBe('premium_199');
      expect(body.expiresAt).toBe('2027-01-16T08:00:00.000Z');
    } finally {
      await close();
    }
  });

  it('returns CORS headers for preflight requests', async () => {
    const { baseUrl, close } = await startTestServer(validConfig);

    try {
      const response = await fetch(`${baseUrl}/v1/premium/verify`, { method: 'OPTIONS' });

      expect(response.status).toBe(204);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    } finally {
      await close();
    }
  });

  it('returns JSON 404 for unknown routes', async () => {
    const { baseUrl, close } = await startTestServer(validConfig);

    try {
      const response = await fetch(`${baseUrl}/unknown`);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('NOT_FOUND');
    } finally {
      await close();
    }
  });
});

function startTestServer(config) {
  const server = http.createServer(createPremiumRequestHandler(config));

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((closeResolve) => server.close(closeResolve)),
      });
    });
  });
}

function writePinStore(records) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starvia-pin-store-'));
  const storeFile = path.join(dir, 'pins.json');
  fs.writeFileSync(storeFile, JSON.stringify({
    pins: records.map((record) => ({
      pinHash: hashPin(record.pin),
      plan: record.plan || 'premium_199',
      expiresAt: record.expiresAt || null,
      usedAt: record.usedAt || null,
    })),
  }, null, 2));
  return storeFile;
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim().toUpperCase()).digest('hex');
}
