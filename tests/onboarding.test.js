// ===== ONBOARDING JOURNEY TESTS =====
// TDD: Write tests first, then implement

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const onboardingSource = fs.readFileSync(path.resolve('js/onboarding.js'), 'utf8');

function loadContext(overrides = {}) {
  const store = {};
  const context = {
    window: {
      Onboarding: null,
      localStorage: {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v; },
        removeItem: (k) => { delete store[k]; },
      },
      document: {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: (tag) => ({
          tagName: tag.toUpperCase(),
          className: '',
          innerHTML: '',
          textContent: '',
          style: {},
          classList: { add(){}, remove(){}, contains(){ return false; } },
          appendChild: () => {},
          addEventListener: () => {},
          setAttribute: () => {},
          getAttribute: () => null,
        }),
        body: { appendChild: () => {}, removeChild: () => {} },
      },
      Date: Date,
      ...overrides,
    },
    console,
    parseInt,
    Math,
    Date,
    String,
    JSON,
    isNaN,
  };
  vm.createContext(context);
  vm.runInContext(onboardingSource, context, { filename: 'js/onboarding.js' });
  return context;
}

describe('Onboarding Engine', () => {
  describe('getState', () => {
    it('should return step 0 when no localStorage', () => {
      const ctx = loadContext();
      const state = ctx.window.Onboarding.getState();
      expect(state.step).toBe(0);
      expect(state.startedAt).toBeNull();
    });

    it('should return saved state from localStorage', () => {
      const ctx = loadContext();
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        startedAt: '2026-05-31T10:00:00Z',
        step: 2,
        birthData: { name: 'ptest', dob: '1990-05-15', time: '14:30', gender: 'female' },
      }));
      const state = ctx.window.Onboarding.getState();
      expect(state.step).toBe(2);
      expect(state.birthData.name).toBe('ptest');
    });

    it('should handle corrupted localStorage gracefully', () => {
      const ctx = loadContext();
      ctx.window.localStorage.setItem('starvia_onboarding', 'NOT JSON');
      const state = ctx.window.Onboarding.getState();
      expect(state.step).toBe(0);
    });
  });

  describe('startOnboarding', () => {
    it('should set step to 0 and save timestamp', () => {
      const ctx = loadContext();
      ctx.window.Onboarding.startOnboarding();
      const state = ctx.window.Onboarding.getState();
      expect(state.step).toBe(0);
      expect(state.startedAt).toBeTruthy();
    });
  });

  describe('saveBirthData', () => {
    it('should save birth data and advance to step 1', () => {
      const ctx = loadContext();
      ctx.window.Onboarding.saveBirthData({
        name: 'คาร่า', dob: '1990-05-15', time: '14:30', gender: 'female',
      });
      const state = ctx.window.Onboarding.getState();
      expect(state.step).toBe(1);
      expect(state.birthData.name).toBe('คาร่า');
      expect(state.birthData.dob).toBe('1990-05-15');
    });

    it('should escape XSS in name', () => {
      const ctx = loadContext();
      ctx.window.Onboarding.saveBirthData({
        name: '<script>alert(1)</script>', dob: '1990-01-01', time: '', gender: 'male',
      });
      const state = ctx.window.Onboarding.getState();
      expect(state.birthData.name).not.toContain('<script>');
      expect(state.birthData.name).toContain('&lt;');
    });
  });

  describe('advanceStep', () => {
    it('should increment step by 1', () => {
      const ctx = loadContext();
      ctx.window.Onboarding.startOnboarding();
      ctx.window.Onboarding.advanceStep();
      expect(ctx.window.Onboarding.getState().step).toBe(1);
      ctx.window.Onboarding.advanceStep();
      expect(ctx.window.Onboarding.getState().step).toBe(2);
    });
  });

  describe('getJourneyDay', () => {
    it('should return 0 when no start date', () => {
      const ctx = loadContext();
      expect(ctx.window.Onboarding.getJourneyDay()).toBe(0);
    });

    it('should calculate day correctly from start date', () => {
      const ctx = loadContext();
      const yesterday = new Date(Date.now() - 86400000 * 3).toISOString();
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        startedAt: yesterday,
        step: 1,
        birthData: { name: 'test', dob: '1990-01-01', time: '', gender: 'male' },
      }));
      const day = ctx.window.Onboarding.getJourneyDay();
      expect(day).toBeGreaterThanOrEqual(3);
      expect(day).toBeLessThanOrEqual(4);
    });
  });

  describe('getPhase', () => {
    it('should return "welcome" for day 0', () => {
      const ctx = loadContext();
      expect(ctx.window.Onboarding.getPhase()).toBe('welcome');
    });

    it('should return "first-reading" for day 1', () => {
      const ctx = loadContext();
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        startedAt: yesterday, step: 1,
        birthData: { name: 'test', dob: '1990-01-01', time: '', gender: 'male' },
      }));
      expect(ctx.window.Onboarding.getPhase()).toBe('anticipation');
    });

    it('should return "wow-day" for day 3', () => {
      const ctx = loadContext();
      const d = new Date(Date.now() - 86400000 * 3).toISOString();
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        startedAt: d, step: 1,
        birthData: { name: 'test', dob: '1990-01-01', time: '', gender: 'male' },
      }));
      expect(ctx.window.Onboarding.getPhase()).toBe('continuity');
    });

    it('should return "weekly-summary" for day 7', () => {
      const ctx = loadContext();
      const d = new Date(Date.now() - 86400000 * 7).toISOString();
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        startedAt: d, step: 1,
        birthData: { name: 'test', dob: '1990-01-01', time: '', gender: 'male' },
      }));
      expect(ctx.window.Onboarding.getPhase()).toBe('weekly-summary');
    });

    it('should return "premium-offer" for day 11+', () => {
      const ctx = loadContext();
      const d = new Date(Date.now() - 86400000 * 12).toISOString();
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        startedAt: d, step: 1,
        birthData: { name: 'test', dob: '1990-01-01', time: '', gender: 'male' },
      }));
      expect(ctx.window.Onboarding.getPhase()).toBe('premium-offer');
    });
  });

  describe('getStreak', () => {
    it('should return 0 when no start', () => {
      const ctx = loadContext();
      expect(ctx.window.Onboarding.getStreak()).toBe(0);
    });

    it('should return days since start (capped at 30)', () => {
      const ctx = loadContext();
      const d = new Date(Date.now() - 86400000 * 5).toISOString();
      ctx.window.localStorage.setItem('starvia_onboarding', JSON.stringify({
        startedAt: d, step: 1,
        birthData: { name: 'test', dob: '1990-01-01', time: '', gender: 'male' },
      }));
      expect(ctx.window.Onboarding.getStreak()).toBe(5);
    });
  });

  describe('reset', () => {
    it('should clear all onboarding data', () => {
      const ctx = loadContext();
      ctx.window.Onboarding.startOnboarding();
      ctx.window.Onboarding.reset();
      expect(ctx.window.Onboarding.getState().step).toBe(0);
    });
  });

  describe('isOnboarded', () => {
    it('should return false when not started', () => {
      const ctx = loadContext();
      expect(ctx.window.Onboarding.isOnboarded()).toBe(false);
    });

    it('should return true when birth data saved', () => {
      const ctx = loadContext();
      ctx.window.Onboarding.saveBirthData({
        name: 'test', dob: '1990-01-01', time: '', gender: 'male',
      });
      expect(ctx.window.Onboarding.isOnboarded()).toBe(true);
    });
  });
});
