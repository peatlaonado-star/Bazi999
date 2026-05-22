import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadContext(dom, overrides = {}) {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const helperSource = fs.readFileSync(path.resolve('js/reading-helpers.js'), 'utf8');
  const rendererSources = [
    'js/renderer-shared.js',
    'js/renderer-individual.js',
    'js/renderer-couple.js',
    'js/renderer-auspicious.js',
  ].map((file) => [file, fs.readFileSync(path.resolve(file), 'utf8')]);
  const context = {
    window: dom.window,
    document: dom.window.document,
    CL: 'th',
    fmtDate: () => '17/05/2026',
    buildElementRadar: () => '',
    buildTabs: () => {
      const ts0 = dom.window.document.getElementById('ts0');
      if (ts0) ts0.innerHTML = '';
    },
    setTimeout: () => {},
    scrollTo: () => {},
    isPremiumUnlocked: () => false,
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

function samplePlanet(element = 'ไฟ') {
  return {
    c: '#fff', s: '☉', n: 'อาทิตย์', d: 'desc', el: element, ei: 0,
    p: 'personality', str: 'strength', wkfix: 'fix', lv: 'love', ca: 'career', mn: 'money', man: 'mantra'
  };
}

function sampleSign() {
  return { c: '#fff', s: '♈', n: 'เมษ', rl: 'rule', trait: 'trait', apply: 'apply', add: 'add', el: 0 };
}

function sampleUi() {
  return {
    ti: 'เวลา', tu: 'น.', pl: 'ดาว', rl: 'ราศี', rl2: 'เจ้าเรือน', la: 'ลัคนา', ll: 'เจ้าเรือน',
    dob: 'วันเกิด', el: 'ธาตุ', es: 'element', ge: 'เพศ', rf: 'อ้างอิง:', mn: 'มนต์', r0: 'เริ่มใหม่',
    t0: ['ตัวตน', 'รัก', 'งาน', 'อดีต', 'ปัจจุบัน', 'อนาคต'],
    s0: ['พื้นฐาน', 'จุดแข็ง', 'จุดอ่อน', 'รัก', 'งาน', 'เงิน', 'อดีต', 'ปัจจุบัน', 'อนาคต']
  };
}

describe('Individual reading Karma Mirror render', () => {
  it('locks the Thai Karma Mirror card for free readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('คาร่า', 'หญิง', '2000-01-01', '06:00', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('กระจกกรรม');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(output).toContain('รูปแบบที่มักวนซ้ำ');
    expect(output).toContain('พิธีเล็ก ๆ 7 วัน');
    expect(dom.window.document.querySelector('.karma-card')).toBeTruthy();
    expect(dom.window.document.querySelector('.karma-card.is-locked')).toBeTruthy();
  });

  it('reveals full Karma Mirror content when PIN unlock removes the lock overlay', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('คาร่า', 'หญิง', '2000-01-01', '06:00', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const karma = dom.window.document.querySelector('.karma-card');
    expect(karma.classList.contains('is-locked')).toBe(true);

    karma.classList.remove('is-locked');
    karma.querySelector('.lock-overlay').remove();

    expect(karma.textContent).toContain('รูปแบบที่มักวนซ้ำ');
    expect(karma.textContent).toContain('พิธีเล็ก ๆ 7 วัน');
    expect(karma.querySelector('.lock-overlay')).toBeNull();
  });

  it('renders full Thai Karma Mirror content for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('คาร่า', 'หญิง', '2000-01-01', '06:00', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('รูปแบบที่มักวนซ้ำ');
    expect(output).toContain('พิธีเล็ก ๆ 7 วัน');
    expect(dom.window.document.querySelector('.karma-card.is-locked')).toBeNull();
  });
});

describe('Thai Life Blueprint header card', () => {
  it('renders .blueprint-card class in the output', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('เบล', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('blueprint-card');
  });

  it('contains the kicker text "Thai Life Blueprint"', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('เบล', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('Thai Life Blueprint');
    expect(output).toContain('พิมพ์เขียวชีวิตไทย');
  });

  it('shows the user escaped name', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('คาร่า', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('คาร่า');
  });

  it('shows planet symbol and name', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('☉');
    expect(output).toContain('อาทิตย์');
  });

  it('shows element, rasi, and lagna names', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('ธาตุไฟ');
    expect(output).toContain('เมษ');
  });

  it('blueprint card appears before the info card in DOM order', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const bpIndex = output.indexOf('blueprint-card');
    const cardIndex = output.indexOf('class="card"');
    expect(bpIndex).toBeLessThan(cardIndex);
  });

  it('XSS: script tag in name is escaped inside blueprint card', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('<script>alert(1)</script>', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('&lt;script&gt;');
    expect(dom.window.document.querySelector('.blueprint-card script')).toBeNull();
  });
});

describe('Daily Thai Cosmic Brief', () => {
  it('renders .cosmic-brief class in output', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('cosmic-brief');
  });

  it('contains the Daily Cosmic Brief title text', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('Daily Cosmic Brief');
    expect(output).toContain('สรุปพลังงานวันนี้');
  });

  it('shows only 2 free cb-line elements before premium unlock', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const lines = dom.window.document.querySelectorAll('.cb-line');
    expect(lines.length).toBe(2);
  });

  it('shows personal color name', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('สีมงคลวันนี้');
  });

  it('cosmic brief appears after karma card in DOM order', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const karmaIndex = output.indexOf('karma-card');
    const briefIndex = output.indexOf('cosmic-brief');
    expect(karmaIndex).toBeLessThan(briefIndex);
  });

  it('locks focus, warning, and action text before premium unlock', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('พลังงานวัน');
    expect(output).not.toContain('โฟกัส:');
    expect(output).not.toContain('ระวัง:');
    expect(output).not.toContain('สิ่งที่ควรทำวันนี้:');
    expect(output).toContain('Daily Brief ฉบับเต็ม');
  });

  it('contains full energy, focus, warning, and action text for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('พลังงานวัน');
    expect(output).toContain('โฟกัส:');
    expect(output).toContain('ระวัง:');
    expect(output).toContain('สิ่งที่ควรทำวันนี้:');
  });
});

describe('Life Domain Forecast Matrix', () => {
  it('shows domain labels but locks detailed life-domain guidance for free readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('Life Domain Forecast Matrix');
    expect(output).toContain('แผนที่สถานการณ์ชีวิต');
    for (const label of ['โชค', 'การเงิน', 'สุขภาพ', 'ความสัมพันธ์', 'การงาน', 'บริวาร']) {
      expect(output).toContain(label);
    }
    for (const part of ['สถานการณ์ปัจจุบัน', 'สัญญาณเตือน', 'วิธีเสริม', 'โอกาสตามช่วงอายุ']) {
      expect(output).toContain(part);
    }
    expect(output).toContain('วิเคราะห์ 6 ด้าน');
    expect(dom.window.document.querySelectorAll('.domain-card').length).toBe(6);
    expect(dom.window.document.querySelector('.domain-matrix.is-locked')).toBeTruthy();
  });

  it('unlocks domain matrix when is-locked class is removed (simulates PIN unlock)', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const matrix = dom.window.document.querySelector('.domain-matrix');
    expect(matrix.classList.contains('is-locked')).toBe(true);

    // Simulate onPremiumVerified behavior
    dom.window.document.querySelectorAll('.is-locked').forEach((el) => {
      el.classList.remove('is-locked');
      const overlay = el.querySelector('.lock-overlay');
      if (overlay) overlay.remove();
    });

    expect(matrix.classList.contains('is-locked')).toBe(false);
    expect(matrix.querySelector('.lock-overlay')).toBeNull();
    expect(matrix.textContent).toContain('สถานการณ์ปัจจุบัน');
    expect(matrix.textContent).toContain('สัญญาณเตือน');
    expect(matrix.textContent).toContain('วิธีเสริม');
    expect(matrix.textContent).toContain('โอกาสตามช่วงอายุ');
  });

  it('renders all required life-domain guidance parts for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    for (const part of ['สถานการณ์ปัจจุบัน', 'สัญญาณเตือน', 'วิธีเสริม', 'โอกาสตามช่วงอายุ']) {
      expect(output).toContain(part);
    }
  });

  it('shows explicit age-band opportunities for future life stages', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const chips = Array.from(dom.window.document.querySelectorAll('.domain-age-chip')).map((node) => node.textContent);
    expect(chips.length).toBeGreaterThanOrEqual(2);
    expect(chips.some((text) => /\d+–\d+ ปี/.test(text))).toBe(true);
  });
});

describe('Monthly Life Map UX clarity', () => {
  it('removes highlighted free days for locked readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).not.toContain('3 วันเด่นประจำเดือน');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(output).not.toContain('ปฏิทินวันดีรายเดือน');
    expect(dom.window.document.querySelectorAll('.mlm-day').length).toBe(0);
    expect(dom.window.document.querySelectorAll('.mlm-cal-day').length).toBe(0);
  });

  it('renders full monthly calendar and removes 3-day preview for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).not.toContain('3 วันเด่นประจำเดือน');
    expect(output).toContain('ปฏิทินวันดีรายเดือน');
    expect(output).toContain('Weekly Brief 4 สัปดาห์');
    expect(dom.window.document.querySelectorAll('.mlm-day').length).toBe(0);
    expect(dom.window.document.querySelectorAll('.mlm-cal-day').length).toBeGreaterThanOrEqual(28);
  });
});
describe('Monthly Life Map subscription feature', () => {
  it('builds a deterministic monthly model with calendar, weekly briefs, and ritual', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);
    const model = context.buildMonthlyLifeMap(samplePlanet('ไฟ'), sampleSign(), sampleSign(), '2000-01-01', new Date('2026-06-15T00:00:00Z'));

    expect(model.title).toContain('มิถุนายน 2569');
    expect(model.freeDays).toHaveLength(3);
    model.freeDays.forEach((day) => {
      expect(day.simpleText).toContain('เหมาะกับ');
      expect(day.advice).toEqual(expect.any(String));
      expect(day.advice.length).toBeGreaterThan(12);
    });
    expect(model.calendarDays.length).toBeGreaterThanOrEqual(28);
    expect(model.weeklyBriefs).toHaveLength(4);
    expect(model.rituals).toHaveLength(7);
    expect(model.domains.map((domain) => domain.key)).toEqual(['career', 'money', 'relationship', 'health']);
    model.domains.forEach((domain) => {
      expect(domain.icon).toMatch(/[◈💰♡🫀]/u);
      expect(domain.score).toBeGreaterThanOrEqual(55);
      expect(domain.score).toBeLessThanOrEqual(99);
      expect(domain.action).toContain('ควร');
    });
  });

  it('shows free monthly preview but locks detailed monthly planning', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('STARVIA Monthly Life Map');
    expect(output).not.toContain('3 วันเด่นประจำเดือน');
    expect(dom.window.document.querySelectorAll('.mlm-day').length).toBe(0);
    expect(output).toContain('คะแนน');
    expect(output).toContain('ควร');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(output).not.toContain('Weekly Brief 4 สัปดาห์');
    expect(output).not.toContain('ภารกิจเสริมดวง 7 วัน');
    expect(dom.window.document.querySelector('.monthly-life-map.is-locked')).toBeTruthy();
  });

  it('renders full monthly planner for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('Weekly Brief 4 สัปดาห์');
    expect(output).toContain('ภารกิจเสริมดวง 7 วัน');
    expect(output).toContain('ปฏิทินวันดีรายเดือน');
    expect(output).toContain('วันที่ควรระวัง');
    expect(dom.window.document.querySelector('.monthly-life-map.is-locked')).toBeNull();
  });
});
