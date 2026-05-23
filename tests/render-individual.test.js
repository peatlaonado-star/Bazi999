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

  it('contains only Thai kicker text while the language switch is not visible', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('เบล', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('พิมพ์เขียวชีวิตไทย');
    expect(output).not.toContain('Thai Life Blueprint');
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
  it('renders .weekday-power-card class in output', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('weekday-power-card');
  });

  it('contains the Thai weekday power title', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('กำลังวันประจำตัว');
    expect(output).not.toContain('Daily Cosmic Brief');
    expect(output).not.toContain('สรุปพลังงานวันนี้');
  });

  it('shows weekday power card with 3 action columns', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const actions = dom.window.document.querySelectorAll('.wpc-action');
    expect(actions.length).toBe(3);
    // Badges show day, deity, and element
    expect(dom.window.document.querySelector('.wpc-badge-day')).toBeTruthy();
    expect(dom.window.document.querySelector('.wpc-badge-deity')).toBeTruthy();
    expect(dom.window.document.querySelector('.wpc-badge-element')).toBeTruthy();
  });

  it('shows personal color name', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('สีมงคล');
  });

  it('weekday power card appears before locked premium sections', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const briefIndex = output.indexOf('weekday-power-card');
    const windfallIndex = output.indexOf('windfall-luck');
    const karmaIndex = output.indexOf('karma-card');
    expect(briefIndex).toBeGreaterThan(-1);
    expect(briefIndex).toBeLessThan(windfallIndex);
    expect(briefIndex).toBeLessThan(karmaIndex);
  });

  it('shows weekday power card with Thursday deity and element for free readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    // 2000-06-15 is Thursday (dayOfWeek=4)
    expect(output).toContain('กำลังวันประจำตัว');
    expect(output).toContain('แรงครู');  // Thursday energy
    expect(output).toContain('พระราหู');  // Thursday deity
    expect(output).toContain('ดิน');  // Thursday element
    expect(output).toContain('สีมงคล');
  });

  it('shows same weekday power card for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });
    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('กำลังวันประจำตัว');
    expect(output).toContain('พระราหู');
    expect(output).toContain('ดิน');
  });
});

describe('Life Domain Forecast Matrix', () => {
  it('shows domain labels but locks detailed life-domain guidance for free readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '1990-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('แผนที่สถานการณ์ชีวิต');
    expect(output).not.toContain('Life Domain Forecast Matrix');
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

describe('Windfall Luck gimmick section', () => {
  it('builds a deterministic Thai lottery and windfall guide', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    const guide = context.buildWindfallLuckGuide(samplePlanet('ไฟ'), '2000-06-15', 1);

    expect(guide.title).toContain('ลาภลอย');
    expect(guide.luckyNumbers).toHaveLength(3);
    guide.luckyNumbers.forEach((number) => expect(number).toMatch(/^\d{2}$/));
    expect(guide.lotteryFocus).toMatch(/หวย|ลอตเตอรี่|ตัวเลข/);
    expect(guide.ritualSteps).toHaveLength(3);
    expect(guide.ritualSteps.join(' ')).toContain('สาธุ');
  });

  it('renders the windfall luck section as a locked premium teaser with masked lucky numbers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const windfall = dom.window.document.querySelector('.windfall-luck');
    const maskedNumbers = Array.from(windfall.querySelectorAll('.wfl-mask-number')).map((node) => node.textContent);
    const fullNumbers = Array.from(windfall.querySelectorAll('.wfl-full-number')).map((node) => node.textContent);

    expect(output).toContain('สูตรเปิดดวงลาภลอย');
    expect(output).toContain('เลขที่ควรลอง');
    expect(output).toContain('หวย / ลอตเตอรี่');
    expect(output).toContain('พิธีเปิดทางโชค');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(maskedNumbers).toHaveLength(3);
    maskedNumbers.forEach((number) => expect(number).toMatch(/^\d●$|^●\d$/));
    expect(fullNumbers).toHaveLength(3);
    fullNumbers.forEach((number) => expect(number).toMatch(/^\d{2}$/));
    const maskedDetail = windfall.querySelector('.wfl-mask-detail').textContent;
    fullNumbers.forEach((number) => expect(maskedDetail).not.toContain(number));
    maskedNumbers.forEach((number) => expect(maskedDetail).toContain(number));
    expect(dom.window.document.querySelector('.windfall-luck.is-locked')).toBeTruthy();
  });

  it('keeps masked lucky numbers ready to reveal when the premium lock is removed', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const windfall = dom.window.document.querySelector('.windfall-luck');

    expect(windfall.querySelectorAll('.wfl-mask-number').length).toBe(3);
    expect(windfall.querySelectorAll('.wfl-full-number').length).toBe(3);
    expect(windfall.querySelector('.wfl-mask-detail')).toBeTruthy();
    expect(windfall.querySelector('.wfl-full-detail')).toBeTruthy();

    windfall.classList.remove('is-locked');
    windfall.querySelector('.lock-overlay').remove();

    expect(windfall.querySelector('.lock-overlay')).toBeNull();
    expect(windfall.querySelectorAll('.wfl-full-number').length).toBe(3);
  });

  it('reveals the windfall luck guide for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('สูตรเปิดดวงลาภลอย');
    expect(output).toContain('คาถาเรียกโชค');
    expect(output).toContain('ตั้งงบก่อนเสี่ยง');
    expect(dom.window.document.querySelectorAll('.wfl-mask-number').length).toBe(0);
    expect(dom.window.document.querySelectorAll('.wfl-full-number').length).toBe(3);
    expect(dom.window.document.querySelector('.windfall-luck.is-locked')).toBeNull();
  });
});


describe('Free reader conversion reading order', () => {
  it('orders the free result page from quick value to lottery hook, monthly plan, then deeper premium proof', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;
    const order = [
      'blueprint-card',
      'conversion-roadmap',
      'weekday-power-card',
      'power-card',
      'windfall-luck',
      'monthly-life-map',
      'domain-matrix',
      'karma-card',
      'detail-tabs-card'
    ].map((needle) => output.indexOf(needle));

    order.forEach((index) => expect(index).toBeGreaterThan(-1));
    for (let i = 1; i < order.length; i += 1) {
      expect(order[i - 1]).toBeLessThan(order[i]);
    }
  });

  it('adds a clear premium path card before the locked sections', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const roadmap = dom.window.document.querySelector('.conversion-roadmap');

    expect(roadmap).toBeTruthy();
    expect(roadmap.textContent).toContain('เริ่มอ่านตรงนี้');
    expect(roadmap.textContent).toContain('สูตรลาภลอย');
    expect(roadmap.textContent).toContain('ปลดล็อก');
  });

  it('wraps detailed tabs in a guided card with shorter readable tab labels', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div><div id="ts0"></div>');
    const context = loadContext(dom);

    context.renderInd('Test', 'หญิง', '2000-06-15', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const tabsCard = dom.window.document.querySelector('.detail-tabs-card');
    const labels = Array.from(dom.window.document.querySelectorAll('#tt0 .tab')).map((node) => node.textContent);

    expect(tabsCard).toBeTruthy();
    expect(tabsCard.textContent).toContain('อ่านรายละเอียดพื้นฐาน');
    expect(labels).toEqual(['ตัวตนฟรี', 'เงาใจ', 'ความรัก', 'งานเงิน', 'อดีต', 'ตอนนี้', 'อนาคต']);
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
    expect(output).toContain('สรุปรายสัปดาห์ 4 สัปดาห์');
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
    expect(model.domains.map((domain) => domain.key)).toEqual(['career', 'money', 'windfall', 'relationship', 'health']);
    const windfall = model.domains.find((domain) => domain.key === 'windfall');
    expect(windfall.forecast).toMatch(/โชคลอย|ลาภลอย/);
    expect(windfall.action).toContain('ควร');
    model.domains.forEach((domain) => {
      expect(domain.icon).toMatch(/[◈💰🎲♡🫀]/u);
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

    expect(output).toContain('แผนที่ชีวิตรายเดือน STARVIA');
    expect(output).not.toContain('3 วันเด่นประจำเดือน');
    expect(dom.window.document.querySelectorAll('.mlm-day').length).toBe(0);
    expect(output).toContain('คะแนน');
    expect(output).toContain('ควร');
    expect(output).toContain('ปลดล็อกรีพอร์ตฉบับเต็ม');
    expect(output).not.toContain('สรุปรายสัปดาห์ 4 สัปดาห์');
    expect(output).not.toContain('ภารกิจเสริมดวง 7 วัน');
    expect(dom.window.document.querySelector('.monthly-life-map.is-locked')).toBeTruthy();
  });

  it('renders full monthly planner for premium readers', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom, { isPremiumUnlocked: () => true });

    context.renderInd('Test', 'หญิง', '2000-01-01', '08:30', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());
    const output = dom.window.document.getElementById('r0').innerHTML;

    expect(output).toContain('สรุปรายสัปดาห์ 4 สัปดาห์');
    expect(output).toContain('ภารกิจเสริมดวง 7 วัน');
    expect(output).toContain('ปฏิทินวันดีรายเดือน');
    expect(output).toContain('วันที่ควรระวัง');
    expect(dom.window.document.querySelector('.monthly-life-map.is-locked')).toBeNull();
  });
});
