// ===== Personalized Daily Fortune Tests =====
import { describe, it, beforeEach, expect } from 'vitest';

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
      expect(PF.getBirthData()).toBe(null);
    });

    it('should read birth data from starvia_onboarding', () => {
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        step: 2,
        startedAt: '2026-05-31T10:00:00Z',
        birthData: { name: 'test', dob: '1990-06-15', time: '14:30', gender: 'female' }
      }));
      const PF = window.PersonalizedFortune;
      const bd = PF.getBirthData();
      expect(bd).toBeTruthy();
      expect(bd.dob).toBe('1990-06-15');
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
      expect(PF.getBirthElement('2000-01-02')).toBe('ไฟ');
    });

    it('should return water for Monday births', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.getBirthElement('2000-01-03')).toBe('น้ำ');
    });

    it('should return fire for Tuesday births', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.getBirthElement('2000-01-04')).toBe('ไฟ');
    });

    it('should return wind for Wednesday births', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.getBirthElement('2000-01-05')).toBe('ลม');
    });

    it('should return earth for Thursday births', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.getBirthElement('2000-01-06')).toBe('ดิน');
    });

    it('should return water for Friday births', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.getBirthElement('2000-01-07')).toBe('น้ำ');
    });

    it('should return earth for Saturday births', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.getBirthElement('2000-01-01')).toBe('ดิน');
    });

    it('should default to fire for null/invalid', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.getBirthElement(null)).toBe('ไฟ');
      expect(PF.getBirthElement('invalid')).toBe('ไฟ');
    });
  });

  // ===== Seeded Random =====
  describe('seededRandom', () => {
    it('should return same value for same input', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.seededRandom('test:2026-06-01');
      const b = PF.seededRandom('test:2026-06-01');
      expect(a).toBe(b);
    });

    it('should return different values for different inputs', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.seededRandom('test:2026-06-01');
      const b = PF.seededRandom('test:2026-06-02');
      expect(a).not.toBe(b);
    });
  });

  // ===== Lucky Numbers =====
  describe('generateLuckyNumbers', () => {
    it('should return 3 numbers', () => {
      const PF = window.PersonalizedFortune;
      const nums = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      expect(nums.length).toBe(3);
    });

    it('should return numbers between 10-99', () => {
      const PF = window.PersonalizedFortune;
      const nums = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      nums.forEach(n => {
        const num = parseInt(n);
        expect(num >= 10 && num <= 99).toBeTruthy();
      });
    });

    it('should be deterministic for same user + date', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      const b = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      expect(a).toEqual(b);
    });

    it('should differ for different dates', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      const b = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-02');
      // Extremely unlikely to be identical
      expect(a).not.toEqual(b);
    });

    it('should differ for different users on same date', () => {
      const PF = window.PersonalizedFortune;
      const a = PF.generateLuckyNumbers({ dob: '1990-06-15' }, '2026-06-01');
      const b = PF.generateLuckyNumbers({ dob: '1985-03-20' }, '2026-06-01');
      expect(a).not.toEqual(b);
    });
  });

  // ===== Pick Seeded =====
  describe('pickSeeded', () => {
    it('should return deterministic result', () => {
      const PF = window.PersonalizedFortune;
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const a = PF.pickSeeded(arr, 'seed1', 0);
      const b = PF.pickSeeded(arr, 'seed1', 0);
      expect(a).toBe(b);
    });

    it('should return item from the array', () => {
      const PF = window.PersonalizedFortune;
      const arr = ['a', 'b', 'c'];
      const result = PF.pickSeeded(arr, 'seed2', 0);
      expect(arr.includes(result)).toBeTruthy();
    });
  });

  // ===== Build Personalized Fortune =====
  describe('buildPersonalizedFortune', () => {
    it('should return fortune object with all fields', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune({ dob: '1990-06-15', name: 'Test' });
      expect(f.quote).toBeTruthy();
      expect(f.todayElement).toBeTruthy();
      expect(f.todayDeity).toBeTruthy();
      expect(f.todayPlanet).toBeTruthy();
      expect(f.birthElement).toBeTruthy();
      expect(f.luckyColor).toBeTruthy();
      expect(f.luckyColor.name).toBeTruthy();
      expect(f.luckyColor.hex).toBeTruthy();
      expect(f.luckyTime).toBeTruthy();
      expect(f.luckyTime.time).toBeTruthy();
      expect(f.luckyNumbers).toBeTruthy();
      expect(f.luckyNumbers.length).toBe(3);
      expect(f.fortuneCard).toBeTruthy();
      expect(f.fortuneCard.name).toBeTruthy();
      expect(f.fortuneCard.icon).toBeTruthy();
      expect(f.focus).toBeTruthy();
      expect(f.warning).toBeTruthy();
      expect(f.hasBirthData).toBe(true);
    });

    it('should work without birth data', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune(null);
      expect(f.quote).toBeTruthy();
      expect(f.hasBirthData).toBe(false);
      expect(f.luckyNumbers).toBeTruthy();
      expect(f.fortuneCard).toBeTruthy();
    });

    it('should include birth deity in quote when birth data exists', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune({ dob: '1990-06-15' });
      // Quote should start with "คนเกิดวัน..."
      expect(f.quote.includes('คนเกิดวัน')).toBeTruthy();
    });

    it('should not include birth deity when no birth data', () => {
      const PF = window.PersonalizedFortune;
      const f = PF.buildPersonalizedFortune(null);
      expect(!f.quote.includes('คนเกิดวัน')).toBeTruthy();
    });
  });

  // ===== Fortune Cards =====
  describe('FORTUNE_CARDS', () => {
    it('should have 22 cards', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.FORTUNE_CARDS.length).toBe(22);
    });

    it('each card should have id, icon, name, meaning', () => {
      const PF = window.PersonalizedFortune;
      PF.FORTUNE_CARDS.forEach(card => {
        expect(card.id).toBeTruthy();
        expect(card.icon).toBeTruthy();
        expect(card.name).toBeTruthy();
        expect(card.meaning).toBeTruthy();
      });
    });
  });

  // ===== Lucky Colors =====
  describe('LUCKY_COLORS', () => {
    it('should have at least 10 colors', () => {
      const PF = window.PersonalizedFortune;
      expect(PF.LUCKY_COLORS.length >= 10).toBeTruthy();
    });

    it('each color should have name, hex, meaning', () => {
      const PF = window.PersonalizedFortune;
      PF.LUCKY_COLORS.forEach(c => {
        expect(c.name).toBeTruthy();
        expect(c.hex).toBeTruthy();
        expect(c.meaning).toBeTruthy();
      });
    });
  });

  // ===== Quote Pools =====
  describe('QUOTES', () => {
    it('should have pools for all 4 elements', () => {
      const PF = window.PersonalizedFortune;
      ['ไฟ', 'น้ำ', 'ลม', 'ดิน'].forEach(el => {
        expect(PF.QUOTES[el]).toBeTruthy();
      });
    });

    it('each element should have cross-element pools', () => {
      const PF = window.PersonalizedFortune;
      ['ไฟ', 'น้ำ', 'ลม', 'ดิน'].forEach(el => {
        ['ไฟ', 'น้ำ', 'ลม', 'ดิน'].forEach(todayEl => {
          expect(PF.QUOTES[el][todayEl]).toBeTruthy();
          expect(PF.QUOTES[el][todayEl].length >= 2).toBeTruthy();
        });
      });
    });
  });
});
