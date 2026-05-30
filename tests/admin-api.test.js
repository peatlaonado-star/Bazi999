import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  adminLogin,
  verifyAdminAuth,
  getPinStats,
  listPins,
  issuePins,
  expirePin,
  deletePin,
} from '../api/admin-service.mjs';

function tempStorePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starvia-admin-test-'));
  return path.join(dir, 'pins.json');
}

function makeConfig(overrides = {}) {
  return {
    adminPassword: 'test1234',
    adminJwtSecret: 'test-secret-key-32chars-minimum!!',
    pinStoreFile: overrides.pinStoreFile || '',
    tokenTtlSeconds: 43200,
    now: overrides.now || (() => Math.floor(Date.now() / 1000)),
  };
}

describe('Admin Auth', () => {
  it('returns token on correct password', () => {
    const config = makeConfig();
    const result = adminLogin('test1234', config);
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.token).toBeTruthy();
    expect(result.body.expiresIn).toBe(43200);
  });

  it('rejects wrong password', () => {
    const config = makeConfig();
    const result = adminLogin('wrong', config);
    expect(result.status).toBe(401);
    expect(result.body.success).toBe(false);
    expect(result.body.error).toBe('INVALID_PASSWORD');
  });

  it('verifies a valid token', () => {
    const config = makeConfig();
    const login = adminLogin('test1234', config);
    const payload = verifyAdminAuth(`Bearer ${login.body.token}`, config);
    expect(payload).toBeTruthy();
    expect(payload.role).toBe('admin');
  });

  it('rejects expired token', () => {
    const past = Math.floor(Date.now() / 1000) - 86400; // 1 day ago
    const config = makeConfig({ now: () => past });
    const login = adminLogin('test1234', config);
    const nowConfig = makeConfig();
    const payload = verifyAdminAuth(`Bearer ${login.body.token}`, nowConfig);
    expect(payload).toBeNull();
  });

  it('rejects invalid token', () => {
    const config = makeConfig();
    const payload = verifyAdminAuth('Bearer garbage.token.here', config);
    expect(payload).toBeNull();
  });
});

describe('PIN Stats', () => {
  it('returns zero stats for empty store', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    const result = getPinStats(config);
    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true, total: 0, unused: 0, used: 0, expired: 0 });
  });

  it('counts issued PINs correctly', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    // Issue 3 PINs
    issuePins({ count: 3, plan: 'premium_199' }, config);
    const result = getPinStats(config);
    expect(result.body.total).toBe(3);
    expect(result.body.unused).toBe(3);
    expect(result.body.used).toBe(0);
  });
});

describe('Issue PINs', () => {
  it('issues a single PIN by default', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    const result = issuePins({}, config);
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    expect(result.body.count).toBe(1);
    expect(result.body.issued).toHaveLength(1);
    expect(result.body.issued[0].pin).toMatch(/^STAR-[A-Z0-9]{8}$/);
    expect(result.body.issued[0].plan).toBe('premium_199');
  });

  it('issues a batch of PINs', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    const result = issuePins({ count: 10, plan: 'premium_199', days: 30, note: 'BATCH-MAY' }, config);
    expect(result.body.count).toBe(10);
    expect(result.body.issued).toHaveLength(10);
    result.body.issued.forEach((p) => {
      expect(p.pin).toMatch(/^STAR-[A-Z0-9]{8}$/);
      expect(p.note).toMatch(/BATCH-MAY/);
    });
  });

  it('caps batch at 50', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    const result = issuePins({ count: 100 }, config);
    expect(result.body.count).toBe(50);
    expect(result.body.issued).toHaveLength(50);
  });

  it('stores raw PIN alongside pinHash so admin can copy issued codes', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    const result = issuePins({ count: 1 }, config);
    const raw = fs.readFileSync(storeFile, 'utf8');
    expect(raw).toContain(result.body.issued[0].pin);
    expect(raw).toContain('pinHash');
  });
});

describe('List PINs', () => {
  it('lists all PINs with public fields only', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    issuePins({ count: 2, note: 'ORDER-001' }, config);
    const result = listPins({}, config);
    expect(result.status).toBe(200);
    expect(result.body.pins).toHaveLength(2);
    const p = result.body.pins[0];
    expect(p.created).toBeTruthy();
    expect(p.expires).toBeTruthy();
    expect(p.note).toBe('ORDER-001 #1');
    expect(p.status).toBe('active');
    // Should not expose pinHash
    expect(p.pinHash).toBeUndefined();
  });

  it('filters by status', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    issuePins({ count: 3, note: 'TEST' }, config);
    const result = listPins({ status: 'unused' }, config);
    expect(result.body.pins).toHaveLength(3);
    const empty = listPins({ status: 'used' }, config);
    expect(empty.body.pins).toHaveLength(0);
  });
});

describe('Expire PIN', () => {
  it('expires an unused PIN by note', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    issuePins({ count: 1, note: 'EXPIRE-ME' }, config);
    const result = expirePin({ note: 'EXPIRE-ME' }, config);
    expect(result.status).toBe(200);
    expect(result.body.expired).toBe('EXPIRE-ME');
    // Should now show as expired
    const list = listPins({ status: 'expired' }, config);
    expect(list.body.pins).toHaveLength(1);
  });

  it('returns 404 for unknown note', () => {
    const config = makeConfig({ pinStoreFile: tempStorePath() });
    const result = expirePin({ note: 'NONEXISTENT' }, config);
    expect(result.status).toBe(404);
  });
});

describe('Delete PIN', () => {
  it('deletes an unused PIN by note', () => {
    const storeFile = tempStorePath();
    const config = makeConfig({ pinStoreFile: storeFile });
    issuePins({ count: 1, note: 'DELETE-ME' }, config);
    const result = deletePin({ note: 'DELETE-ME' }, config);
    expect(result.status).toBe(200);
    expect(result.body.deleted).toBe('DELETE-ME');
    const list = listPins({}, config);
    expect(list.body.pins).toHaveLength(0);
  });
});
