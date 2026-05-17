import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadContext(dom) {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const rendererSource = fs.readFileSync(path.resolve('astro-renderers.js'), 'utf8');
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
  };
  vm.createContext(context);
  vm.runInContext(contentSource, context, { filename: 'data/thai-astrology-content.js' });
  vm.runInContext(rendererSource, context, { filename: 'astro-renderers.js' });
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
  it('renders a premium Thai Karma Mirror card in the individual report', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadContext(dom);

    context.renderInd('คาร่า', 'หญิง', '2000-01-01', '06:00', samplePlanet('ไฟ'), sampleSign(), sampleSign(), 0, 0, sampleUi());

    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('กระจกกรรม');
    expect(output).toContain('สิ่งที่ชีวิตมักพากลับมาเรียนรู้');
    expect(output).toContain('รูปแบบที่มักวนซ้ำ');
    expect(output).toContain('พิธีเล็ก ๆ 7 วัน');
    expect(dom.window.document.querySelector('.karma-card')).toBeTruthy();
  });
});
