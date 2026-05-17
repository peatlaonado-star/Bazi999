import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadThaiAstroContent() {
  const source = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'data/thai-astrology-content.js' });
  return context.THAI_ASTRO_CONTENT;
}

describe('Thai astrology content data', () => {
  it('defines Karma Mirror content for the four Thai elements and seven weekdays', () => {
    const content = loadThaiAstroContent();

    expect(content).toBeTruthy();
    expect(content.karmaMirror).toBeTruthy();

    for (const element of ['ไฟ', 'ดิน', 'ลม', 'น้ำ']) {
      expect(content.karmaMirror.elements[element]).toMatchObject({
        pattern: expect.any(String),
        lesson: expect.any(String),
        action: expect.any(String),
        ritual: expect.any(String),
      });
    }

    expect(content.karmaMirror.weekdayShadows).toHaveLength(7);
    content.karmaMirror.weekdayShadows.forEach((shadow) => {
      expect(shadow).toEqual(expect.any(String));
      expect(shadow.length).toBeGreaterThan(10);
    });
  });

  it('loads content, reading helpers, and renderers in dependency order in index.html', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    const contentIndex = html.indexOf('data/thai-astrology-content.js');
    const helpersIndex = html.indexOf('js/reading-helpers.js');
    const sharedIndex = html.indexOf('js/renderer-shared.js');
    const individualIndex = html.indexOf('js/renderer-individual.js');

    expect(contentIndex).toBeGreaterThan(-1);
    expect(helpersIndex).toBeGreaterThan(-1);
    expect(sharedIndex).toBeGreaterThan(-1);
    expect(individualIndex).toBeGreaterThan(-1);
    expect(contentIndex).toBeLessThan(helpersIndex);
    expect(helpersIndex).toBeLessThan(sharedIndex);
    expect(sharedIndex).toBeLessThan(individualIndex);
  });
});
