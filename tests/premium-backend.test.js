import { describe, expect, it } from 'vitest';
import http from 'node:http';

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

  it('requires production PIN and JWT secret config', () => {
    expect(() => loadPremiumConfig({})).toThrow(/STARVIA_PREMIUM_PINS/);
    expect(() => loadPremiumConfig({ STARVIA_PREMIUM_PINS: 'STAR199' })).toThrow(/STARVIA_JWT_SECRET/);
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
