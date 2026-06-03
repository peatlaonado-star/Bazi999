// ===== Share & Viral Engine Tests =====
import { describe, it, beforeEach, expect } from 'vitest';

function loadContext(birthData) {
  const store = {};
  const window = {
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    document: {
      readyState: 'loading',
      addEventListener: () => {},
      getElementById: () => null,
    },
    open: () => {},
    PersonalalizedFortune: null,
  };

  if (birthData) {
    store['starvia_onboarding'] = JSON.stringify({
      step: 2,
      startedAt: '2026-05-28T10:00:00Z',
      birthData: birthData
    });
  }

  global.window = window;
  global.localStorage = window.localStorage;
  global.document = window.document;
  Object.defineProperty(global, "navigator", { value: { clipboard: null, share: null }, writable: true, configurable: true });

  // Load daily fortune first (dependency)
  delete require.cache[require.resolve('../js/daily-fortune.js')];
  require('../js/daily-fortune.js');

  // Load share-viral
  delete require.cache[require.resolve('../js/share-viral.js')];
  require('../js/share-viral.js');

  return { window, store };
}

describe('ShareViral', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadContext({ dob: '1990-06-15', name: 'Test' });
  });

  describe('generateShareMessage', () => {
    it('should return a non-empty string', () => {
      const SV = window.ShareViral;
      const msg = SV.generateShareMessage();
      expect(msg).toBeTruthy();
      expect(msg.length > 10).toBeTruthy();
    });

    it('should include fortune teaser text', () => {
      const SV = window.ShareViral;
      const msg = SV.generateShareMessage();
      // Should contain some fortune-related content
      expect(msg.includes('🔮') || msg.includes('✨') || msg.includes('🌟') || msg.includes('💫') || msg.includes('⭐')).toBeTruthy();
    });

    it('should be deterministic for same user + day', () => {
      const SV = window.ShareViral;
      const a = SV.generateShareMessage();
      const b = SV.generateShareMessage();
      expect(a).toBe(b);
    });

    it('should work without birth data', () => {
      const ctx2 = loadContext(null);
      const SV = window.ShareViral;
      const msg = SV.generateShareMessage();
      expect(msg).toBeTruthy();
      expect(msg.length > 10).toBeTruthy();
    });
  });

  describe('recordShare', () => {
    it('should track share count in localStorage', () => {
      const SV = window.ShareViral;
      SV.recordShare('line');
      const data = JSON.parse(ctx.store['starvia_shares']);
      expect(data.total).toBe(1);
      expect(data.platforms.line).toBe(1);
    });

    it('should increment on multiple shares', () => {
      const SV = window.ShareViral;
      SV.recordShare('line');
      SV.recordShare('facebook');
      SV.recordShare('line');
      const data = JSON.parse(ctx.store['starvia_shares']);
      expect(data.total).toBe(3);
      expect(data.platforms.line).toBe(2);
      expect(data.platforms.facebook).toBe(1);
    });

    it('should track different platforms', () => {
      const SV = window.ShareViral;
      SV.recordShare('line');
      SV.recordShare('facebook');
      SV.recordShare('x');
      SV.recordShare('copy');
      SV.recordShare('native');
      const data = JSON.parse(ctx.store['starvia_shares']);
      expect(data.total).toBe(5);
      expect(Object.keys(data.platforms).length).toBe(5);
    });
  });

  describe('Public API', () => {
    it('should expose all share functions', () => {
      const SV = window.ShareViral;
      expect(typeof SV.shareToLine).toBe('function');
      expect(typeof SV.shareToFacebook).toBe('function');
      expect(typeof SV.shareToX).toBe('function');
      expect(typeof SV.copyShareLink).toBe('function');
      expect(typeof SV.nativeShare).toBe('function');
      expect(typeof SV.generateShareMessage).toBe('function');
      expect(typeof SV.recordShare).toBe('function');
    });
  });
});
