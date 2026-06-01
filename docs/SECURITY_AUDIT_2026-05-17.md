# STARVIA Security Audit — innerHTML / insertAdjacentHTML

**วันที่:** 2026-05-17
**ผู้ตรวจสอบ:** Kara (Hermes Agent)
**ขอบเขต:** ไฟล์ source ทั้งหมดใน `starvia-split/` (ไม่รวม `dist/`, `node_modules/`, `.git/`, `assets/html2canvas.min.js`)

---

## Executive Summary

ผลการตรวจสอบ: **ปลอดภัย** ✅

ช่องโหว่ XSS ที่พบก่อนหน้าถูกแก้ไขแล้วใน commit `3b6db52 fix: escape user input in renderers` ทั้ง 3 โหมด (Individual, Couple, Auspicious) มี `escapeHTML()` กับ user input ก่อนใส่ HTML ทุกจุด

---

## รายการ innerHTML / insertAdjacentHTML ทั้งหมด

### ✅ ปลอดภัย (21 จุด)

#### astro-renderers.js (12 จุด)

| บรรทัด | โค้ด | สถานะ |
|---|---|---|
| 184 | `nm = escapeHTML(nm)` — ใน `renderInd` | ✅ escape ก่อนใช้ |
| 185–186 | `gd`, `ts` — escape แล้ว | ✅ |
| 291–308 | `wrap.innerHTML = ...` — ใช้ `nm` ที่ escape แล้ว | ✅ |
| 353–354 | `ts0.insertAdjacentHTML(...)` — ใช้ `nm` ที่ escape แล้ว | ✅ |
| 412 | `sec.innerHTML=html` — tab content จาก data arrays | ✅ |
| 419 | `innerHTML=''` — clear เท่านั้น | ✅ |
| 447–448 | `na`, `nb` — escape ใน `renderCouple` | ✅ |
| 502 | `wrap.innerHTML = matrixHtml` — ชื่อ escape แล้ว | ✅ |
| 549 | `sec.innerHTML=html` — tab content จาก data | ✅ |
| 553 | `ts2.insertAdjacentHTML(...)` — language pack strings | ✅ |
| 573 | `nm = escapeHTML(nm)` — ใน `renderAusp` | ✅ |
| 657 | `wrap.innerHTML=...` — ชื่อ escape แล้ว | ✅ |

#### ui-actions.js (8 จุด)

| บรรทัด | โค้ด | สถานะ |
|---|---|---|
| 8–9, 36 | `btn.innerHTML` — save/restore hardcoded text | ✅ |
| 17 | `wm.innerHTML` — hardcoded watermark | ✅ |
| 45–46, 156, 183, 188 | `btn.innerHTML` — hardcoded strings | ✅ |
| 79 | `hd.insertAdjacentHTML(...)` — hardcoded mantra | ✅ |
| 100 | `overlay.innerHTML` — hardcoded payment modal | ✅ |

#### astrology-core.js (1 จุด)

| บรรทัด | โค้ด | สถานะ |
|---|---|---|
| 95 | `innerHTML=''` — clear เท่านั้น | ✅ |

---

## ข้อสังเกต

1. **PIN ระบบ Premium hardcode ใน client-side** (`ui-actions.js:152: var correctPin = 'ADMIN-GENERATED-CODE'`)
   - ไม่ใช่ XSS แต่เป็นข้อจำกัดด้านความปลอดภัยที่ต้องย้ายไป backend ก่อนเปิดใช้จริง
   - ดูรายละเอียดใน `docs/PAYMENT_SECURITY_LIMITATIONS.md`

2. **การใช้ `innerHTML` ยังมีจำนวนมาก** (~15 จุด) — ส่วนใหญ่เป็น dynamic HTML building ที่ใช้ข้อมูลจาก data arrays ไม่ใช่ user input แต่ควรพิจารณาใช้ DOM API หรือ template literals อย่างปลอดภัยในอนาคต

3. **ไม่มี Content Security Policy (CSP) header** — ควรเพิ่มเมื่อ deploy จริง

---

## ผลลัพธ์

- [x] Audit เสร็จสิ้น
- [x] ตรวจสอบ innerHTML ทั้งหมด 21 จุด
- [x] ยืนยันว่า user input ถูก escape ก่อนใช้ในทุกโหมด
- [x] ไม่พบช่องโหว่ XSS ใหม่
- [ ] ควรเพิ่ม CSP header เมื่อ deploy
