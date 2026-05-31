// ===== Personalized Daily Fortune Tests =====
const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

// Mock browser globals
function loadContext() {
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
  };
  const document = window.document;
  global.window = window;
  global.localStorage = window.localStorage;
  global.document = document;

  // Load the module
  delete require.cache[require.resolve('../js/daily-fortune.js')];
  require('../js/daily-fortune.js');
  return { window, store };
}

describe('PersonalizedFortune', () => {
  let ctx;

  beforeEach(() => {
    ctx = loadContext();
  });

  // ===== Birth Data =====
  describe('getBirthData', () => {
    it('should return null when no onboarding data', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthData(), null);
    });

    it('should read birth data from starvia_onboarding', () => {
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        step: 2,
        startedAt: '2026-05-31T10:00:00Z',
        birthData: { name: 'test', dob: '1990-06-15', time: '14:30', gender: 'female' }
      }));
      const PF = window.PersonalizedFortune;
      const bd = PF.getBirthData();
      assert.ok(bd);
      assert.equal(bd.dob, '1990-06-15');
    });
  });

  // ===== Birth Element =====
  describe('getBirthElement', () => {
    const expected = {
      '1990-06-15': 'ลม',    // Friday=5 → น้ำ? Let me check. 1990-06-15 is Friday. DAY_ELEMENT[5] = 'น้ำ'
      '1990-06-17': 'ดิน',   // Sunday? No, 1990-06-17 is Sunday=0 → ไฟ
    };

    it('should return fire for Sunday births', () => {
      const PF = window.PersonalizedFortune;
      // 2026-06-01 is a Monday → element should be 'น้ำ'
      // Let's use a known date: 2000-01-02 is Sunday
      assert.equal(PF.getBirthElement('2000-01-02'), 'ไฟ');
    });

    it('should return water for Monday births', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthElement('2000-01-03'), 'น้ำ');
    });

    it('should return fire for Tuesday births', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthElement('2000-01-04'), 'ไฟ');
    });

    it('should return wind for Wednesday births', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthElement('2000-01-05'), 'ลม');
    });

    it('should return earth for Thursday births', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthElement('2000-01-06'), 'ดิน');
    });

    it('should return water for Friday births', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthElement('2000-01-07'), 'น้ำ');
    });

    it('should return earth for Saturday births', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthElement('2000-01-01'), 'ดิน');
    });

    it('should default to fire for null/invalid', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.getBirthElement(null), 'ไฟ');
      assert.equal(PF.getBirthElement('invalid'), 'ไฟ');
    });
  });

  // ===== Seeded Random =====
  describe('seededRandom', () => {
    it('should return same value for same input', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.seededRandom('test:2026-06-01');
      const b = PF.seededRandom('test:2026-06-01');
      assert.equal(a, b);
    });

    it('should return different values for different inputs', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.seededRandom('test:2026-06-01');
      const b = PF.seededRandom('test:2026-06-02');
      assert.notEqual(a, b);
    });
  });

  // ===== Lucky Numbers =====
  describe('generateLuckyNumbers', () => {
    it('should return 3 numbers', () => {
      const PF = window.PersonalizedFortune;
      const nums = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      assert.equal(nums.length, 3);
    });

    it('should return numbers between 10-99', () => {
      const PF = window.PersonalizedFortune;
      const nums = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      nums.forEach(n => {
        const num = parseInt(n);
        assert.ok(num >= 10 && num <= 99, `Number ${n} should be 10-99`);
      });
    });

    it('should be deterministic for same user + date', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      const b = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      assert.deepEqual(a, b);
    });

    it('should differ for different dates', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      const b = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-02');
      // Extremely unlikely to be identical
      assert.notDeepEqual(a, b);
    });

    it('should differ for different users on same date', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      const b = PF.generateLuckyNumbers({ dob: '1985-03-20' }, '2026-06-01');
      assert.notDeepEqual(a, b);
    });
  });

  // ===== Pick Seeded =====
  describe('pickSeeded', () => {
    it('should return deterministic result', () => {
      const PF = window.PersonalizedFortune;
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const a = PF.pickSeeded(arr, 'seed1', 0);
      const b = PF.pickSeeded(arr, 'seed1', 0);
      assert.equal(a, b);
    });

    it('should return item from the array', () => {
      const PF = window.PersonalizedFortune;
      const arr = ['a', 'b', 'c'];
      const result = PF.pickSeeded(arr, 'seed2', 0);
      assert.ok(arr.includes(result));
    });
  });

  // ===== Build Personalized Fortune =====
  describe('buildPersonalizedFortune', () => {
    it('should return fortune object with all fields', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune({ dob: '1990-06-15', name: 'Test' });
      assert.ok(f.quote);
      assert.ok(f.todayElement);
      assert.ok(f.todayDeity);
      assert.ok(f.todayPlanet);
      assert.ok(f.birthElement);
      assert.ok(f.luckyColor);
      assert.ok(f.luckyColor.name);
      assert.ok(f.luckyColor.hex);
      assert.ok(f.luckyTime);
      assert.ok(f.luckyTime.time);
      assert.ok(f.luckyNumbers);
      assert.equal(f.luckyNumbers.length, 3);
      assert.ok(f.fortuneCard);
      assert.ok(f.fortuneCard.name);
      assert.ok(f.fortuneCard.icon);
      assert.ok(f.focus);
      assert.ok(f.warning);
      assert.equal(f.hasBirthData, true);
    });

    it('should work without birth data', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune(null);
      assert.ok(f.quote);
      assert.equal(f.hasBirthData, false);
      assert.ok(f.luckyNumbers);
      assert.ok(f.fortuneCard);
    });

    it('should include birth deity in quote when birth data exists', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune({ dob: '1990-06-15' });
      // Quote should start with "คนเกิดวัน..."
      assert.ok(f.quote.includes('คนเกิดวัน'), `Quote: ${f.quote}`);
    });

    it('should not include birth deity when no birth data', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune(null);
      assert.ok(!f.quote.includes('คนเกิดวัน'));
    });
  });

  // ===== Fortune Cards =====
  describe('FORTUNE_CARDS', () => {
    it('should have 22 cards', () => {
      const PF = window.PersonalizedFortune;
      assert.equal(PF.FORTUNE_CARDS.length, 22);
    });

    it('each card should have id, icon, name, meaning', () => {
      const PF = window.PersonalizedFortune;
      PF.FORTUNE_CARDS.forEach(card => {
        assert.ok(card.id, `Card missing id`);
        assert.ok(card.icon, `Card ${card.id} missing icon`);
        assert.ok(card.name, `Card ${card.id} missing name`);
        assert.ok(card.meaning, `Card ${card.id} missing meaning`);
      });
    });
  });

  // ===== Lucky Colors =====
  describe('LUCKY_COLORS', () => {
    it('should have at least 10 colors', () => {
      const PF = window.PersonalizedFortune;
      assert.ok(PF.LUCKY_COLORS.length >= 10);
    });

    it('each color should have name, hex, meaning', () => {
      const PF = window.PersonalizedFortune;
      PF.LUCKY_COLORS.forEach(c => {
        assert.ok(c.name);
        assert.ok(c.hex);
        assert.ok(c.meaning);
      });
    });
  });

  // ===== Quote Pools =====
  describe('QUOTES', () => {
    it('should have pools for all 4 elements', () => {
      const PF = window.PersonalizedFortune;
      ['ไฟ', 'น้ำ', 'ลม', 'ดิน'].forEach(el => {
        assert.ok(PF.QUOTES[el], `Missing element ${el}`);
      });
    });

    it('each element should have cross-element pools', () => {
      const PF = window.PersonalizedFortune;
      ['ไฟ', 'น้ำ', 'ลม', 'ดิน'].forEach(el => {
        ['ไฟ', 'น้ำ', 'ลม', 'ดิน'].forEach(todayEl => {
          assert.ok(PF.QUOTES[el][todayEl], `Missing ${el}-${todayEl}`);
          assert.ok(PF.QUOTES[el][todayEl].length >= 2, `${el}-${todayEl} needs 2+ quotes`);
        });
      });
    });
  });
});
