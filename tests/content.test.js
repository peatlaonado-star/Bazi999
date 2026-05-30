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

  it('presents a premium Thai-first landing value ladder before the report form', () => {
    const html = fs.readFileSync(path.resolve('index.html'), 'utf8');

    expect(html).toContain('รู้จักตัวเองจากวันเกิด ไม่ใช่แค่ดูดวง');
    expect(html).toContain('Premium 199 บาท/เดือน');
    expect(html).toContain('สิ่งที่คุณจะได้จาก STARVIA');
    expect(html).toContain('เริ่มจากข้อมูลพื้นฐาน');
    expect(html).toContain('ใช้เวลาไม่ถึง 30 วินาที');
    expect(html).toContain('ตัวอย่างสิ่งที่จะได้อ่าน');
    expect(html).toContain('รับจังหวะวันนี้ฟรีทุกเช้า');
  });

  it('defines Monthly Life Map content for subscription retention', () => {
    const content = loadThaiAstroContent();
    expect(content.monthlyLifeMap).toBeTruthy();
    expect(content.monthlyLifeMap.domains.map((domain) => domain.key)).toEqual([
      'career', 'money', 'windfall', 'relationship', 'health'
    ]);
    const windfall = content.monthlyLifeMap.domains.find((domain) => domain.key === 'windfall');
    expect(windfall.label).toContain('ลาภลอย');
    expect(windfall.teaser).toMatch(/โชคลอย|ลาภลอย/);
    expect(content.monthlyLifeMap.weeklyThemes).toHaveLength(4);
    expect(content.monthlyLifeMap.rituals).toHaveLength(7);
    for (const element of ['ไฟ', 'ดิน', 'ลม', 'น้ำ']) {
      expect(content.monthlyLifeMap.elementGuidance[element]).toMatchObject({
        focus: expect.any(String),
        warning: expect.any(String),
        action: expect.any(String),
      });
    }
  });

  it('defines Life Domain Forecast content for six required domains', () => {
    const content = loadThaiAstroContent();
    expect(content.lifeDomainForecast).toBeTruthy();
    expect(content.lifeDomainForecast.domains.map((domain) => domain.key)).toEqual([
      'luck', 'money', 'health', 'relationship', 'career', 'supporters'
    ]);
    content.lifeDomainForecast.domains.forEach((domain) => {
      expect(domain.label).toEqual(expect.any(String));
      expect(domain.subtitle).toEqual(expect.any(String));
    });
    expect(content.lifeDomainForecast.domainThemes.luck.current).toMatch(/โชคลอย|ลาภลอย/);
    expect(content.lifeDomainForecast.domainThemes.luck.remedy).toContain('เลข');
    for (const element of ['ไฟ', 'ดิน', 'ลม', 'น้ำ']) {
      expect(content.lifeDomainForecast.elementGuidance[element]).toBeTruthy();
    }
  });
});
