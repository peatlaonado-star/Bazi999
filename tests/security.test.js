import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadRenderersContext(overrides = {}) {
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
    isPremiumUnlocked: () => false,
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(helperSource, context, { filename: 'js/reading-helpers.js' });
  for (const [filename, source] of rendererSources) {
    vm.runInContext(source, context, { filename });
  }
  return context;
}

describe('HTML escaping security helpers', () => {
  it('escapes user-controlled text before it is composed into HTML strings', () => {
    const context = loadRenderersContext();

    expect(context.escapeHTML('<img src=x onerror="alert(1)">&Kara')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;Kara'
    );
  });

  it('does not inject individual horoscope names as executable markup', () => {
    const dom = new JSDOM('<!doctype html><div id="r0"></div>');
    const context = loadRenderersContext({
      document: dom.window.document,
      window: dom.window,
      CL: 'th',
      fmtDate: () => '17/05/2026',
      buildElementRadar: () => '',
      buildTabs: () => {
        const ts0 = dom.window.document.getElementById('ts0');
        if (ts0) ts0.innerHTML = '';
      },
    });

    const planet = {
      c: '#fff', s: '☉', n: 'อาทิตย์', d: 'desc', el: 'ไฟ', ei: 0,
      p: 'personality', str: 'strength', wkfix: 'fix', lv: 'love', ca: 'career', mn: 'money', man: 'mantra'
    };
    const sign = { c: '#fff', s: '♈', n: 'เมษ', rl: 'rule', trait: 'trait', apply: 'apply', add: 'add', el: 0 };
    const ui = {
      ti: 'เวลา', tu: 'น.', pl: 'ดาว', rl: 'ราศี', rl2: 'เจ้าเรือน', la: 'ลัคนา', ll: 'เจ้าเรือน',
      dob: 'วันเกิด', el: 'ธาตุ', es: 'element', ge: 'เพศ', rf: 'อ้างอิง:', mn: 'มนต์', r0: 'เริ่มใหม่',
      t0: ['ตัวตน', 'รัก', 'งาน', 'อดีต', 'ปัจจุบัน', 'อนาคต'],
      s0: ['พื้นฐาน', 'จุดแข็ง', 'จุดอ่อน', 'รัก', 'งาน', 'เงิน', 'อดีต', 'ปัจจุบัน', 'อนาคต']
    };

    context.renderInd('<img src=x onerror="alert(1)">', 'หญิง', '2000-01-01', '06:00', planet, sign, sign, 0, 0, ui);

    const output = dom.window.document.getElementById('r0').innerHTML;
    expect(output).toContain('&lt;img src=x onerror="alert(1)"&gt;');
    expect(dom.window.document.querySelector('img')).toBeNull();
  });
});
