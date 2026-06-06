// ===== GAMIFICATION TESTS =====
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const gamSource = fs.readFileSync(path.resolve('js/gamification.js'), 'utf8');

function loadContext() {
  const store = {};
  const ctx = {
    window: {
      Gamification: null,
      localStorage: {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
      },
    },
    Date, Math, parseInt, String, JSON, isNaN,
  };
  vm.createContext(ctx);
  vm.runInContext(gamSource, ctx, { filename: 'js/gamification.js' });
  return ctx;
}

describe('Gamification Engine', () => {
  describe('recordVisit', () => {
    it('should record first visit and return true', () => {
      const ctx = loadContext();
      expect(ctx.window.Gamification.recordVisit()).toBe(true);
    });
    it('should return false on same-day revisit', () => {
      const ctx = loadContext();
      ctx.window.Gamification.recordVisit();
      expect(ctx.window.Gamification.recordVisit()).toBe(false);
    });
  });

  describe('getStreak', () => {
    it('should return 0 with no visits', () => {
      const ctx = loadContext();
      expect(ctx.window.Gamification.getStreak()).toBe(0);
    });
    it('should mirror StreakReward.getStreak().count when available', () => {
      const ctx = loadContext();
      // Simulate a user who has 6 onboarding journey days.
      ctx.window.StreakReward = {
        getStreak: () => ({ count: 6, lastDate: '2026-06-06', startDate: '2026-06-01' })
      };
      expect(ctx.window.Gamification.getStreak()).toBe(6);
    });
    it('should fall back to totalVisits when StreakReward is missing', () => {
      const ctx = loadContext();
      ctx.window.localStorage.setItem(
        'starvia_gamification',
        JSON.stringify({ lastVisit: new Date().toISOString().slice(0,10), totalVisits: 5 })
      );
      expect(ctx.window.Gamification.getStreak()).toBe(5);
    });
  });

  describe('checkBadges', () => {
    it('should award first-light badge on first visit', () => {
      const ctx = loadContext();
      ctx.window.Gamification.recordVisit();
      const newBadges = ctx.window.Gamification.checkBadges(1);
      expect(newBadges.length).toBeGreaterThanOrEqual(1);
      expect(newBadges[0].id).toBe('first-light');
    });
    it('should not award same badge twice', () => {
      const ctx = loadContext();
      ctx.window.Gamification.recordVisit();
      ctx.window.Gamification.checkBadges(1);
      const second = ctx.window.Gamification.checkBadges(1);
      expect(second.length).toBe(0);
    });
  });

  describe('addPoints', () => {
    it('should add points and return total', () => {
      const ctx = loadContext();
      expect(ctx.window.Gamification.addPoints(10)).toBe(10);
      expect(ctx.window.Gamification.addPoints(20)).toBe(30);
    });
  });

  describe('completeChallenge', () => {
    it('should complete challenge and add points', () => {
      const ctx = loadContext();
      expect(ctx.window.Gamification.completeChallenge('daily-visit')).toBe(true);
      expect(ctx.window.Gamification.getState().points).toBe(10);
    });
    it('should not complete same challenge twice', () => {
      const ctx = loadContext();
      ctx.window.Gamification.completeChallenge('daily-visit');
      expect(ctx.window.Gamification.completeChallenge('daily-visit')).toBe(false);
    });
    it('should return false for unknown challenge', () => {
      const ctx = loadContext();
      expect(ctx.window.Gamification.completeChallenge('nonexistent')).toBe(false);
    });
  });

  describe('renderStreakBadge', () => {
    it('should return empty for streak < 1', () => {
      const ctx = loadContext();
      expect(ctx.window.Gamification.renderStreakBadge(0)).toBe('');
    });
    it('should render streak with number', () => {
      const ctx = loadContext();
      const html = ctx.window.Gamification.renderStreakBadge(7);
      expect(html).toContain('7');
      expect(html).toContain('gk-streak');
    });
  });

  describe('renderBadges', () => {
    it('should return empty when no badges earned', () => {
      const ctx = loadContext();
      expect(ctx.window.Gamification.renderBadges([])).toBe('');
    });
    it('should render earned badge', () => {
      const ctx = loadContext();
      const html = ctx.window.Gamification.renderBadges(['first-light']);
      expect(html).toContain('gk-badge-earned');
      expect(html).toContain('gk-badge-earned');
    });
  });

  describe('renderChallenges', () => {
    it('should render all challenges', () => {
      const ctx = loadContext();
      const html = ctx.window.Gamification.renderChallenges();
      expect(html).toContain('เข้าชมวันนี้');
      expect(html).toContain('อ่านครบจบ');
      expect(html).toContain('gk-challenges');
    });
  });

  describe('reset', () => {
    it('should clear all gamification data', () => {
      const ctx = loadContext();
      ctx.window.Gamification.recordVisit();
      ctx.window.Gamification.addPoints(100);
      ctx.window.Gamification.reset();
      expect(ctx.window.Gamification.getState().points).toBe(0);
    });
  });
});
