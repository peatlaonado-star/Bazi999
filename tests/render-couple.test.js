import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

function loadContext(dom, overrides = {}) {
  const contentSource = fs.readFileSync(path.resolve('data/thai-astrology-content.js'), 'utf8');
  const helperSource = fs.readFileSync(path.resolve('js/reading-helpers.js'), 'utf8');
  const rendererSource = fs.readFileSync(path.resolve('astro-renderers.js'), 'utf8');
  const context = {
    window: dom.window,
    document: dom.window.document,
    CL: 'th',
    setTimeout: () => {},
    scrollTo: () => {},
    getPL: () => [],
    ...overrides,
  };
  vm.createContext(context);
  vm.runInContext(contentSource, context, { filename: 'data/thai-astrology-content.js' });
  vm.runInContext(helperSource, context, { filename: 'js/reading-helpers.js' });
  vm.runInContext(rendererSource, context, { filename: 'astro-renderers.js' });
  return context;
}

function planet(name, element, ei, symbol = '☉') {
  return { n: name, el: element, ei, s: symbol };
}

function sign(name = 'เมษ', symbol = '♈', el = 0) {
  return { n: name, s: symbol, add: 'พลังเสริมความสัมพันธ์', el };
}

function coupleUi() {
  return {
    ec: 'เคมีธาตุ', pc: 'ดาวคู่', rc: 'ราศีคู่', lc: 'ลัคนาคู่',
    ct: ['ภาพรวม', 'ธาตุ', 'ราศี', 'ลัคนา'],
    cs: ['ภาพรวม', 'ธาตุ', 'ราศี', 'ลัคนา'],
    rf: 'อ้างอิง:', cm: 'คำแนะนำคู่', cv2: 'รักที่ดีคือการเติบโตไปด้วยกัน', r1: 'เริ่มใหม่',
  };
}

describe('Couple mode rendering', () => {
  it('renders matrix card with compatibility score and names', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0, '☉');
    const pb = planet('เสาร์', 'ไฟ', 0, '♄');
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ แรงและดึงดูด']],
      rasiAngle: () => [78, 'มุมสัมพันธ์ที่สะท้อนกัน'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('สมชาย', pa, ra, ra, 0, 0, 'สมหญิง', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('Compatibility Matrix');
    expect(output).toContain('%');
    expect(output).toContain('สมชาย');
    expect(output).toContain('สมหญิง');
    expect(output).toContain('เคมีธาตุ');
  });

  it('escapes XSS in couple names', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('<script>alert(1)</script>', pa, ra, ra, 0, 0, 'แม่', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const output = dom.window.document.getElementById('r1').innerHTML;
    expect(output).toContain('&lt;script&gt;');
    expect(dom.window.document.querySelector('script')).toBeNull();
  });

  it('renders couple tabs for detailed sections', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    const tabs = dom.window.document.getElementById('tt1');
    expect(tabs).toBeTruthy();
    expect(tabs.children.length).toBe(4);
    expect(tabs.children[0].textContent).toBe('ภาพรวม');
  });

  it('renders reset button at the end', () => {
    const dom = new JSDOM('<!doctype html><div id="r1"></div><div id="tt1"></div><div id="ts1"></div>');
    const pa = planet('อาทิตย์', 'ไฟ', 0);
    const pb = planet('เสาร์', 'ไฟ', 0);
    const context = loadContext(dom, {
      getPL: () => [pa, pb],
      ELC: [[78]],
      PLC: [[78, 78], [78, 78]],
      getELD: () => [['ไฟเจอไฟ']],
      rasiAngle: () => [78, 'มุม'],
    });
    const ra = sign('เมษ');
    const rb = sign('สิงห์');
    const RA2 = [ra, rb];

    context.renderCouple('A', pa, ra, ra, 0, 0, 'B', pb, rb, rb, 1, 1, coupleUi(), RA2);

    // Reset button is appended to ts1 via insertAdjacentHTML
    const ts1 = dom.window.document.getElementById('ts1');
    expect(ts1.innerHTML).toContain('data-action="reset-mode"');
    expect(ts1.innerHTML).toContain('data-mode="1"');
  });
});
