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
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'ui-actions.js' });
  return context;
}

function loadBrowserGlobalUiContext(overrides = {}) {
  const source = fs.readFileSync(path.resolve('ui-actions.js'), 'utf8');
  const context = {
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, appendChild: () => {} }),
      body: { appendChild: () => {} },
    },
    setTimeout: () => {},
    html2canvas: () => Promise.resolve({ toDataURL: () => '' }),
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    ...overrides,
  };
  context.window = context;
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

  it('setPremiumUnlocked syncs backward-compat global flag without replacing the function', () => {
    const ctx = loadUiContext();
    ctx.setPremiumUnlocked(true, 'tok');
    expect(ctx.window.isPremiumUnlockedFlag).toBe(true);
    expect(ctx.isPremiumUnlocked()).toBe(true);
  });

  it('setPremiumUnlocked(false) resets state', () => {
    const ctx = loadUiContext();
    ctx.setPremiumUnlocked(true, 'tok');
    ctx.setPremiumUnlocked(false);
    expect(ctx.isPremiumUnlocked()).toBe(false);
    expect(ctx.window.isPremiumUnlockedFlag).toBe(false);
  });

  it('does not overwrite the browser-global isPremiumUnlocked function', () => {
    const ctx = loadBrowserGlobalUiContext();
    expect(typeof ctx.isPremiumUnlocked).toBe('function');
    ctx.setPremiumUnlocked(true, 'tok');
    expect(typeof ctx.isPremiumUnlocked).toBe('function');
    expect(ctx.isPremiumUnlocked()).toBe(true);
    expect(ctx.isPremiumUnlockedFlag).toBe(true);
  });

  it('initializes premium state even when language bootstrap has not defined CL yet', () => {
    const ctx = loadBrowserGlobalUiContext({ CL: undefined });

    expect(typeof ctx.isPremiumUnlocked).toBe('function');
    expect(ctx.isPremiumUnlocked()).toBe(false);
    expect(ctx._premiumState).toEqual({ unlocked: false, token: null });
  });

  it('does not include a client-side demo PIN fallback', () => {
    const source = fs.readFileSync(path.resolve('ui-actions.js'), 'utf8');

    expect(source).not.toContain('demoPins');
    expect(source).not.toContain(['STAR', '199'].join(''));
    expect(source).not.toContain("mode: 'demo'");
  });

  it('verifyPin posts admin-generated codes to backend', async () => {
    let verifiedToken = null;
    let fetchUrl = null;
    let fetchOptions = null;
    const ctx = loadUiContext({
      window: {
        isPremiumUnlocked: false,
        STARVIA_CONFIG: { apiBaseUrl: 'https://api.example.test/v1' },
      },
      fetch: (url, options) => {
        fetchUrl = url;
        fetchOptions = options;
        return Promise.resolve({ json: () => Promise.resolve({ success: true, token: 'token-123' }) });
      },
      document: {
        getElementById: (id) => {
          if (id === 'pdf-pin') return { value: 'abc123' };
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
    ctx.onPremiumVerified = function(token) { verifiedToken = token; };

    await ctx.verifyPin();

    expect(fetchUrl).toBe('https://api.example.test/v1/premium/verify');
    expect(fetchOptions.method).toBe('POST');
    expect(fetchOptions.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(fetchOptions.body)).toEqual({ pin: 'ABC123' });
    expect(verifiedToken).toBe('token-123');
  });

  it('verifyPin calls onPremiumFailed when backend rejects the PIN', async () => {
    let failed = false;
    const ctx = loadUiContext({
      window: {
        isPremiumUnlocked: false,
        STARVIA_CONFIG: { apiBaseUrl: 'https://api.example.test/v1' },
      },
      fetch: () => Promise.resolve({ json: () => Promise.resolve({ success: false, error: 'INVALID_PIN' }) }),
      document: {
        getElementById: (id) => {
          if (id === 'pdf-pin') return { value: 'wrong' };
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

    await ctx.verifyPin();

    expect(failed).toBe(true);
  });

  it('onPremiumVerified persists backend tokens for later status checks', () => {
    const saved = {};
    const ctx = loadUiContext({
      localStorage: {
        getItem: (key) => saved[key] || null,
        setItem: (key, value) => { saved[key] = value; },
        removeItem: (key) => { delete saved[key]; },
      },
      document: {
        getElementById: (id) => {
          if (id === 'confirm-pay-btn') return { innerHTML: '', style: {}, disabled: false };
          if (id === 'pin-error') return { style: { display: 'none' } };
          if (id === 'payment-modal') return { style: {} };
          return null;
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        createElement: () => ({ style: {}, appendChild: () => {} }),
        body: { appendChild: () => {} },
      },
    });

    ctx.onPremiumVerified('token-abc');

    expect(saved.starviaPremiumToken).toBe('token-abc');
  });

  it('restorePremiumStatus calls backend status and unlocks when saved token is active', async () => {
    let fetchUrl = null;
    let authHeader = null;
    const ctx = loadUiContext({
      window: {
        isPremiumUnlocked: false,
        STARVIA_CONFIG: { apiBaseUrl: 'https://api.example.test/v1' },
      },
      localStorage: {
        getItem: (key) => key === 'starviaPremiumToken' ? 'token-abc' : null,
        setItem: () => {},
        removeItem: () => {},
      },
      fetch: (url, options) => {
        fetchUrl = url;
        authHeader = options.headers.Authorization;
        return Promise.resolve({ json: () => Promise.resolve({ active: true, plan: 'premium_199' }) });
      },
    });

    const result = await ctx.restorePremiumStatus();

    expect(fetchUrl).toBe('https://api.example.test/v1/premium/status');
    expect(authHeader).toBe('Bearer token-abc');
    expect(result.active).toBe(true);
    expect(ctx.isPremiumUnlocked()).toBe(true);
  });

  it('restorePremiumStatus clears saved token when backend says inactive', async () => {
    const removed = [];
    const ctx = loadUiContext({
      window: {
        isPremiumUnlocked: false,
        STARVIA_CONFIG: { apiBaseUrl: 'https://api.example.test/v1' },
      },
      localStorage: {
        getItem: (key) => key === 'starviaPremiumToken' ? 'expired-token' : null,
        setItem: () => {},
        removeItem: (key) => { removed.push(key); },
      },
      fetch: () => Promise.resolve({ json: () => Promise.resolve({ active: false, error: 'TOKEN_EXPIRED' }) }),
    });

    const result = await ctx.restorePremiumStatus();

    expect(result.active).toBe(false);
    expect(removed).toContain('starviaPremiumToken');
    expect(ctx.isPremiumUnlocked()).toBe(false);
  });

  it('automatically restores a saved production token on page load', async () => {
    let fetchCount = 0;
    loadUiContext({
      window: {
        isPremiumUnlocked: false,
        STARVIA_CONFIG: { apiBaseUrl: 'https://api.example.test/v1' },
      },
      localStorage: {
        getItem: (key) => key === 'starviaPremiumToken' ? 'token-abc' : null,
        setItem: () => {},
        removeItem: () => {},
      },
      fetch: () => {
        fetchCount += 1;
        return Promise.resolve({ json: () => Promise.resolve({ active: true, plan: 'premium_199' }) });
      },
    });

    await Promise.resolve();

    expect(fetchCount).toBe(1);
  });
});
