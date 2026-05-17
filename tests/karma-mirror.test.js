import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadContext(overrides = {}) {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const helperSource = fs.readFileSync(path.resolve('js/reading-helpers.js'), 'utf8');
  const rendererSources = [
    'js/renderer-shared.js',
    'js/renderer-individual.js',
    'js/renderer-couple.js',
    'js/renderer-auspicious.js',
  ].map((file) => [file, fs.readFileSync(path.resolve(file), 'utf8')]);
  const context = {
    window: {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
    },
    setTimeout: () => {},
    scrollTo: () => {},
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(contentSource, context, { filename: 'data/thai-astrology-content.js' });
  vm.runInContext(helperSource, context, { filename: 'js/reading-helpers.js' });
  for (const [filename, source] of rendererSources) {
    vm.runInContext(source, context, { filename });
  }
  return context;
}

describe('Karma Mirror helper', () => {
  it('builds a reading model from element and weekday content', () => {
    const context = loadContext();

    const result = context.buildKarmaMirror({ el: 'ไฟ' }, 2);

    expect(result.title).toContain('กระจกกรรม');
    expect(result.pattern).toContain('ใจร้อน');
    expect(result.lesson).toBeTruthy();
    expect(result.weekdayShadow).toContain('วันอังคาร');
    expect(result.action).toBeTruthy();
    expect(result.ritual).toBeTruthy();
    expect(result.intro).toContain('ไม่ใช่คำตัดสิน');
  });

  it('falls back safely when element or weekday is unknown', () => {
    const context = loadContext();

    const result = context.buildKarmaMirror({ el: 'unknown' }, 99);

    expect(result.title).toContain('กระจกกรรม');
    expect(result.pattern).toBeTruthy();
    expect(result.weekdayShadow).toBeTruthy();
    expect(result.action).toBeTruthy();
  });
});
