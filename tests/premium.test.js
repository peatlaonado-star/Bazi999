import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadUiContext(overrides = {}) {
  const source = fs.readFileSync(path.resolve('ui-actions.js'), 'utf8');
  const context = {
    window: { isPremiumUnlocked: false },
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, appendChild: () => {} }),
      body: { appendChild: () => {} },
    },
    setTimeout: () => {},
    CL: 'th',
    html2canvas: () => Promise.resolve({ toDataURL: () => '' }),
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'ui-actions.js' });
  return context;
}

describe('Premium state abstraction', () => {
  it('isPremiumUnlocked() returns false by default', () => {
    const ctx = loadUiContext();
    expect(ctx.isPremiumUnlocked()).toBe(false);
  });

  it('setPremiumUnlocked(true) makes isPremiumUnlocked() return true', () => {
    const ctx = loadUiContext();
    ctx.setPremiumUnlocked(true, 'test-token');
    expect(ctx.isPremiumUnlocked()).toBe(true);
  });

  it('setPremiumUnlocked syncs backward-compat global flag', () => {
    const ctx = loadUiContext();
    ctx.setPremiumUnlocked(true, 'tok');
    expect(ctx.window.isPremiumUnlocked).toBe(true);
  });

  it('setPremiumUnlocked(false) resets state', () => {
    const ctx = loadUiContext();
    ctx.setPremiumUnlocked(true, 'tok');
    ctx.setPremiumUnlocked(false);
    expect(ctx.isPremiumUnlocked()).toBe(false);
    expect(ctx.window.isPremiumUnlocked).toBe(false);
  });

  it('verifyPin calls onPremiumVerified with demo PIN STAR199', () => {
    let verified = false;
    const ctx = loadUiContext({
      document: {
        getElementById: (id) => {
          if (id === 'pdf-pin') return { value: 'STAR199' };
          if (id === 'confirm-pay-btn') return { innerHTML: '', style: {}, disabled: false };
          if (id === 'pin-error') return { style: { display: 'none' } };
          return null;
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        createElement: () => ({ style: {}, appendChild: () => {} }),
        body: { appendChild: () => {} },
      },
    });
    // Override onPremiumVerified to track calls
    ctx.onPremiumVerified = function() { verified = true; };
    ctx.verifyPin();
    expect(verified).toBe(true);
  });

  it('verifyPin rejects wrong PIN', () => {
    let failed = false;
    const ctx = loadUiContext({
      document: {
        getElementById: (id) => {
          if (id === 'pdf-pin') return { value: 'WRONG' };
          if (id === 'confirm-pay-btn') return { innerHTML: '', style: {}, disabled: false };
          if (id === 'pin-error') return { style: { display: 'none' } };
          return null;
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        createElement: () => ({ style: {}, appendChild: () => {} }),
        body: { appendChild: () => {} },
      },
    });
    ctx.onPremiumFailed = function() { failed = true; };
    ctx.verifyPin();
    expect(failed).toBe(true);
  });
});
