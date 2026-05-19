import { describe, expect, it } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { issuePremiumPin } from '../scripts/issue-premium-pin.mjs';

function tempStorePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starvia-admin-pin-'));
  return path.join(dir, 'pins.json');
}

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin).trim().toUpperCase()).digest('hex');
}

describe('Manual premium PIN issuing tool', () => {
  it('creates a new store file with a hashed one-time PIN record and no raw PIN', () => {
    const storeFile = tempStorePath();

    const result = issuePremiumPin({
      storeFile,
      pin: ' paid199 ',
      plan: 'premium_199',
      days: 7,
      now: () => new Date('2026-05-19T12:00:00.000Z'),
    });
    const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));

    expect(result.pin).toBe('PAID199');
    expect(result.expiresAt).toBe('2026-05-26T12:00:00.000Z');
    expect(store.pins).toHaveLength(1);
    expect(store.pins[0]).toEqual({
      pinHash: hashPin('PAID199'),
      plan: 'premium_199',
      createdAt: '2026-05-19T12:00:00.000Z',
      expiresAt: '2026-05-26T12:00:00.000Z',
      usedAt: null,
      note: '',
    });
    expect(JSON.stringify(store)).not.toContain('PAID199');
  });

  it('appends generated PINs without overwriting existing records', () => {
    const storeFile = tempStorePath();
    issuePremiumPin({ storeFile, pin: 'FIRST1', now: () => new Date('2026-05-19T12:00:00.000Z') });
    const result = issuePremiumPin({ storeFile, plan: 'premium_199', now: () => new Date('2026-05-20T12:00:00.000Z') });
    const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));

    expect(result.pin).toMatch(/^STAR-[A-Z0-9]{8}$/);
    expect(store.pins).toHaveLength(2);
    expect(store.pins[0].pinHash).toBe(hashPin('FIRST1'));
    expect(store.pins[1].pinHash).toBe(hashPin(result.pin));
  });

  it('refuses to issue a duplicate unused PIN', () => {
    const storeFile = tempStorePath();
    issuePremiumPin({ storeFile, pin: 'DUP199', now: () => new Date('2026-05-19T12:00:00.000Z') });

    expect(() => issuePremiumPin({ storeFile, pin: ' dup199 ', now: () => new Date('2026-05-19T13:00:00.000Z') }))
      .toThrow(/already exists/i);
  });

  it('CLI writes JSON output with the issued PIN for manual delivery', () => {
    const storeFile = tempStorePath();
    const result = spawnSync(process.execPath, [
      'scripts/issue-premium-pin.mjs',
      '--store', storeFile,
      '--pin', 'CLI199',
      '--days', '3',
      '--note', 'manual transfer',
      '--json',
    ], {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    const output = JSON.parse(result.stdout);
    const store = JSON.parse(fs.readFileSync(storeFile, 'utf8'));

    expect(result.status).toBe(0);
    expect(output.pin).toBe('CLI199');
    expect(output.storeFile).toBe(storeFile);
    expect(store.pins[0].note).toBe('manual transfer');
    expect(JSON.stringify(store)).not.toContain('CLI199');
  });
});
