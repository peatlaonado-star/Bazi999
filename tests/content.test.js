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

  it('is loaded before astro-renderers.js in index.html', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
    expect(html.indexOf('data/thai-astrology-content.js')).toBeGreaterThan(-1);
    expect(html.indexOf('data/thai-astrology-content.js')).toBeLessThan(html.indexOf('astro-renderers.js'));
  });
});
