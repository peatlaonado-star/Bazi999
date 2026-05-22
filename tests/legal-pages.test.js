import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function read(relativePath) {
  return fs.readFileSync(path.resolve(relativePath), 'utf8');
}

describe('Legal and trust pages', () => {
  it('links privacy and terms pages from the index footer', () => {
    const index = read('index.html');

    expect(index).toContain('href="privacy.html"');
    expect(index).toContain('href="terms.html"');
    expect(index).toContain('นโยบายความเป็นส่วนตัว');
    expect(index).toContain('ข้อตกลงการใช้งาน');
  });



  it('keeps the landing page Thai-only until the language button is ready', () => {
    const index = read('index.html');

    expect(index).not.toContain('id="lbtn"');
    [
      'Self-discovery through the stars',
      'EXCLUSIVE EARLY ACCESS',
      '1-on-1 Personalized',
      'Beta Tester',
      'Know your stars. Know yourself.'
    ].forEach((phrase) => expect(index).not.toContain(phrase));
  });

  it('privacy page explains client-side birth data processing and premium token storage', () => {
    const privacy = read('privacy.html');

    expect(privacy).toContain('<title>นโยบายความเป็นส่วนตัว · STARVIA</title>');
    expect(privacy).toContain('ข้อมูลวันเกิดประมวลผลบนอุปกรณ์ของผู้ใช้');
    expect(privacy).toContain('localStorage.starviaPremiumToken');
    expect(privacy).toContain('STARVIA ไม่ขายข้อมูลส่วนตัว');
  });

  it('terms page explains astrology guidance, premium access, and no emergency advice', () => {
    const terms = read('terms.html');

    expect(terms).toContain('<title>ข้อตกลงการใช้งาน · STARVIA</title>');
    expect(terms).toContain('เพื่อการสะท้อนตนเองและความบันเทิงเชิงสร้างสรรค์');
    expect(terms).toContain('Premium PIN');
    expect(terms).toContain('ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย การเงิน หรือเหตุฉุกเฉิน');
  });
});
