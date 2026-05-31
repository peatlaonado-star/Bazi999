// ===== Share & Viral Engine Tests =====
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

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
  global.navigator = { clipboard: null, share: null };

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
      assert.ok(msg);
      assert.ok(msg.length > 10);
    });

    it('should include fortune teaser text', () => {
      const SV = window.ShareViral;
      const msg = SV.generateShareMessage();
      // Should contain some fortune-related content
      assert.ok(msg.includes('🔮') || msg.includes('✨') || msg.includes('🌟') || msg.includes('💫') || msg.includes('⭐'),
        `Message should have emoji: ${msg}`);
    });

    it('should be deterministic for same user + day', () => {
      const SV = window.ShareViral;
      const a = SV.generateShareMessage();
      const b = SV.generateShareMessage();
      assert.equal(a, b);
    });

    it('should work without birth data', () => {
      const ctx2 = loadContext(null);
      const SV = window.ShareViral;
      const msg = SV.generateShareMessage();
      assert.ok(msg);
      assert.ok(msg.length > 10);
    });
  });

  describe('recordShare', () => {
    it('should track share count in localStorage', () => {
      const SV = window.ShareViral;
      SV.recordShare('line');
      const data = JSON.parse(ctx.store['starvia_shares']);
      assert.equal(data.total, 1);
      assert.equal(data.platforms.line, 1);
    });

    it('should increment on multiple shares', () => {
      const SV = window.ShareViral;
      SV.recordShare('line');
      SV.recordShare('facebook');
      SV.recordShare('line');
      const data = JSON.parse(ctx.store['starvia_shares']);
      assert.equal(data.total, 3);
      assert.equal(data.platforms.line, 2);
      assert.equal(data.platforms.facebook, 1);
    });

    it('should track different platforms', () => {
      const SV = window.ShareViral;
      SV.recordShare('line');
      SV.recordShare('facebook');
      SV.recordShare('x');
      SV.recordShare('copy');
      SV.recordShare('native');
      const data = JSON.parse(ctx.store['starvia_shares']);
      assert.equal(data.total, 5);
      assert.equal(Object.keys(data.platforms).length, 5);
    });
  });

  describe('Public API', () => {
    it('should expose all share functions', () => {
      const SV = window.ShareViral;
      assert.equal(typeof SV.shareToLine, 'function');
      assert.equal(typeof SV.shareToFacebook, 'function');
      assert.equal(typeof SV.shareToX, 'function');
      assert.equal(typeof SV.copyShareLink, 'function');
      assert.equal(typeof SV.nativeShare, 'function');
      assert.equal(typeof SV.generateShareMessage, 'function');
      assert.equal(typeof SV.recordShare, 'function');
    });
  });
});
