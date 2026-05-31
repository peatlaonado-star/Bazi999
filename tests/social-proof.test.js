// ===== Social Proof Engine Tests =====
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

function loadContext(birthData) {
  const store = {};
  const elements = {};
  const window = {
    localStorage: {
      getItem: (k) => store[k] || null,
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    },
    document: {
      readyState: 'loading',
      addEventListener: () => {},
      getElementById: (id) => elements[id] || null,
      querySelector: () => null,
      querySelectorAll: () => [],
    },
    requestAnimationFrame: (fn) => setTimeout(fn, 0),
    IntersectionObserver: class { observe() {} unobserve() {} },
    setInterval: () => {},
    setTimeout: (fn) => fn(),
  };

  if (birthData) {
    store['starvia_onboarding'] = JSON.stringify({
      step: 2, startedAt: '2026-05-28T10:00:00Z', birthData: birthData
    });
  }

  global.window = window;
  global.localStorage = window.localStorage;
  global.document = window.document;
  global.IntersectionObserver = window.IntersectionObserver;
  global.requestAnimationFrame = window.requestAnimationFrame;

  delete require.cache[require.resolve('../js/daily-fortune.js')];
  require('../js/daily-fortune.js');
  delete require.cache[require.resolve('../js/social-proof.js')];
  require('../js/social-proof.js');

  return { window, store, elements };
}

describe('SocialProof', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadContext({ dob: '1990-06-15', name: 'Test' });
  });

  describe('TESTIMONIALS', () => {
    it('should have at least 10 testimonials', () => {
      const SP = window.SocialProof;
      assert.ok(SP.TESTIMONIALS.length >= 10);
    });

    it('each testimonial should have text, author, loc, stars', () => {
      const SP = window.SocialProof;
      SP.TESTIMONIALS.forEach(t => {
        assert.ok(t.text, 'Missing text');
        assert.ok(t.author, 'Missing author');
        assert.ok(t.loc, 'Missing loc');
        assert.ok(t.stars >= 1 && t.stars <= 5, 'Invalid stars');
      });
    });
  });

  describe('animateCounter', () => {
    it('should be a function', () => {
      const SP = window.SocialProof;
      assert.equal(typeof SP.animateCounter, 'function');
    });
  });

  describe('Public API', () => {
    it('should expose TESTIMONIALS array', () => {
      const SP = window.SocialProof;
      assert.ok(Array.isArray(SP.TESTIMONIALS));
    });
  });
});
