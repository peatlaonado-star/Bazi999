# STARVIA dhamma remedy integration

วันที่: 2026-05-30

## เป้าหมาย

เชื่อมเนื้อหา “เหตุผลสู่ชีวิตดี” จากพระไตรปิฎกเข้ากับ STARVIA เพื่อให้รีพอร์ตไม่ได้บอกแค่ว่าดวงด้านไหนดี/ติดขัด แต่บอกด้วยว่า:

- รากเหตุที่ควรปรับคืออะไร
- วิธีแก้ปัญหาตามหลักเหตุและผลคืออะไร
- วิธีเสริมดวงให้ปังแบบทำได้จริงคืออะไร
- ภารกิจ 7 วันควรทำอะไร

## หลักผลิตภัณฑ์

STARVIA จะสื่อสารเป็น “สายมูที่มีเหตุผล” ไม่ใช่ไสยศาสตร์ลอย ๆ:

> ดวงบอกจังหวะ แต่เหตุใหม่ที่ทำวันนี้คือสิ่งที่เปลี่ยนชีวิต

## User-facing behavior

ใน Life Domain Forecast 6 ด้าน เพิ่มการ์ดย่อยชื่อ “แก้เหตุ เสริมดวง” ในแต่ละ domain:

1. โชค / จังหวะโอกาส
2. การเงิน / ทรัพย์สิน
3. สุขภาพ / พลังชีวิต
4. ความสัมพันธ์ / คู่ครอง
5. การงาน / ความก้าวหน้า
6. บริวาร / ผู้สนับสนุน

แต่ละด้านจะมี 4 บรรทัดสั้น ๆ:

- รากเหตุ: อธิบายพฤติกรรมหรือใจที่ควรปรับ
- วิธีแก้: การสร้างเหตุใหม่
- เสริมให้ปัง: กิจกรรมเชิงมงคล/จิตวิทยาที่ทำได้จริง
- ภารกิจ 7 วัน: action step ระยะสั้น

## Free/Premium impact

- Free: เห็นหัวข้อและ teaser ว่ามี “แก้เหตุ เสริมดวง”
- Premium: เห็นรายละเอียดครบในแต่ละด้าน
- ใช้ full-DOM + `.is-locked` pattern เดิมของ `.domain-premium`

## Files to touch

- `js/life-graph.js`
  - เพิ่ม content pool `DHAMMA_REMEDY_CONTENT`
  - เพิ่ม helper เลือก remedy ตาม domain + score + element
  - ใส่ `dhammaRemedy` ใน domain object

- `js/renderer-individual.js`
  - render section “แก้เหตุ เสริมดวง” ใต้ domain card

- `styles.css`
  - เพิ่ม style `.domain-dhamma-remedy` ให้ดูเป็น premium card

- `tests/life-domain-forecast.test.js`
  - assert ทุก domain มี dhammaRemedy fields

- `tests/render-individual.test.js`
  - assert UI render ข้อความ “แก้เหตุ เสริมดวง”, “รากเหตุ”, “ภารกิจ 7 วัน”

## Test cases

1. `buildLifeDomainForecastV2()` ต้องคืน domain 6 ด้านพร้อม `dhammaRemedy`
2. `dhammaRemedy` ต้องมี `cause`, `fix`, `boost`, `practice`
3. Renderer ต้องแสดง section “แก้เหตุ เสริมดวง” สำหรับ premium reader
4. Full test suite ต้องผ่าน

## Safety / tone rules

- หลีกเลี่ยงคำขู่หรือโทษกรรมแบบทำให้กลัว
- ใช้ภาษาว่า “รากเหตุที่ควรปรับ” ไม่ใช่ “กรรมชั่วของคุณ”
- สุขภาพต้องไม่แทนคำแนะนำแพทย์
- การเงินต้องไม่ชวนพนันหรือลงทุนเสี่ยง
- เสริมดวงต้องผูกกับพฤติกรรมจริง เช่น ทาน ศีล เมตตา บัญชีเงิน การพักผ่อน

## Verification

```bash
npm test
npm run check:js
npm run build
git diff --check
```

## Rollback

Revert commit ที่เพิ่ม `dhammaRemedy` และ CSS/renderer related changes ได้โดยไม่กระทบ premium unlock API
