import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

function loadContext() {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const helperSource = fs.readFileSync(path.resolve('js/reading-helpers.js'), 'utf8');
  const lifeGraphSource = fs.readFileSync(path.resolve('js/life-graph.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(contentSource, context, { filename: 'data/thai-astrology-content.js' });
  vm.runInContext(helperSource, context, { filename: 'js/reading-helpers.js' });
  vm.runInContext(lifeGraphSource, context, { filename: 'js/life-graph.js' });
  return context;
}

describe('Life Domain Forecast helper', () => {
  it('builds six domain forecasts with current situation, warning, remedy, and opportunities', () => {
    const context = loadContext();
    const currentBand = { key: 'build', from: 29, to: 35, title: 'สร้างฐานมั่นคง' };
    const nextBands = [
      { key: 'lead', from: 36, to: 42, title: 'รับบทผู้นำ' },
      { key: 'expand', from: 43, to: 50, title: 'ขยายอิทธิพล' }
    ];

    const matrix = context.buildLifeDomainMatrix({ el: 'ไฟ', n: 'อาทิตย์' }, { n: 'เมษ' }, { n: 'ตุลย์' }, currentBand, nextBands);

    expect(matrix.title).toContain('แผนที่สถานการณ์ชีวิต');
    expect(matrix.title).not.toContain('Life Domain Forecast Matrix');
    expect(matrix.domains).toHaveLength(6);
    matrix.domains.forEach((domain) => {
      expect(domain.current).toEqual(expect.any(String));
      expect(domain.warning).toEqual(expect.any(String));
      expect(domain.remedy).toEqual(expect.any(String));
      expect(domain.opportunities.length).toBeGreaterThanOrEqual(2);
      expect(domain.opportunities[0].ageRange).toMatch(/\d+–\d+ ปี/);
    });
  });

  it('adapts current guidance by element', () => {
    const context = loadContext();
    const band = { key: 'build', from: 29, to: 35, title: 'สร้างฐานมั่นคง' };
    const nextBands = [{ key: 'lead', from: 36, to: 42, title: 'รับบทผู้นำ' }];

    const fire = context.buildLifeDomainMatrix({ el: 'ไฟ', n: 'อาทิตย์' }, {}, {}, band, nextBands);
    const water = context.buildLifeDomainMatrix({ el: 'น้ำ', n: 'จันทร์' }, {}, {}, band, nextBands);

    expect(fire.domains[0].current).not.toEqual(water.domains[0].current);
  });

  it('keeps V2 age opportunities near the current age instead of jumping to old age', () => {
    const context = loadContext();
    const currentAge = 35;
    const planet = { el: 'ไฟ', n: 'อาทิตย์', s: '☉', c: '#FFD166' };
    const graph = context.buildPersonalLifeGraphV2(15, 6, 2533, currentAge, planet);
    const matrix = context.buildLifeDomainForecastV2(15, 6, 2533, currentAge, planet, graph);

    matrix.domains.forEach((domain) => {
      expect(domain.currentPhase).toBeTruthy();
      expect(domain.opportunities.length).toBeGreaterThanOrEqual(2);

      const ranges = domain.opportunities.map((opp) => opp.ageRange);
      expect(ranges.join(' ')).not.toMatch(/80|∞|99/);

      ranges.forEach((range) => {
        const ages = range.match(/\d+/g).map(Number);
        expect(ages[0]).toBeGreaterThanOrEqual(currentAge);
        expect(ages[1]).toBeLessThanOrEqual(currentAge + 15);
      });
    });
  });
});
