# STARVIA Payment & Security Limitations

**วันที่:** 2026-05-17
**สถานะ:** ข้อจำกัดที่ต้องแก้ไขก่อนเปิดใช้จริง (Pre-launch)

---

## 1. รหัส PIN hardcode ในฝั่ง Client

**ปัญหา:**
```javascript
// ui-actions.js บรรทัดที่ 152
var correctPin = 'ADMIN-GENERATED-CODE';
if(pin === correctPin) { ... }
```

รหัส PIN ถูกเก็บไว้ใน JavaScript ที่ส่งไปยังเบราว์เซอร์ของผู้ใช้ ใครก็ตามที่เปิด DevTools หรือดู source code ก็จะเห็นรหัสและ bypass ระบบจ่ายเงินได้ทันที

**ความเสี่ยง:**
- ระดับวิกฤต — ทุกคนที่รู้ PIN ก็ปลดล็อก Premium ได้ฟรี
- ไม่มีการจำกัดจำนวนครั้งในการกรอก
- ไม่มี rate limiting

**วิธีแก้ที่แนะนำ:**
1. ย้ายระบบ PIN verification ไป backend (Node.js/Python/Firebase Functions)
2. Backend ตรวจสอบ PIN กับฐานข้อมูล แล้วส่ง JWT token กลับมา
3. Frontend เก็บ token และตรวจสอบ expiration
4. กำหนดให้ PIN ใช้ได้ 1 ครั้งต่อ 1 user

---

## 2. Premium State ใช้ Global Variable

**ปัญหา:**
```javascript
// ui-actions.js
window.isPremiumUnlocked = false;

// astro-renderers.js
if (isPremiumTab && !window.isPremiumUnlocked) { ... }
```

สถานะ Premium ถูกเก็บใน `window.isPremiumUnlocked` ซึ่ง:
- รีเซ็ตทุกครั้งที่ refresh หน้า
- ไม่มี persistent storage (localStorage/sessionStorage)
- 任何人ก็ set ค่าได้: `window.isPremiumUnlocked = true`

**วิธีแก้ที่แนะนำ:**
1. ใช้ JWT token จาก backend แทน global flag
2. เก็บ token ใน httpOnly cookie หรือ memory
3. ตรวจสอบ token ก่อนแสดง Premium content

---

## 3. ไม่มี Backend / Server-side Rendering

**ปัญหา:**
- แอปเป็น static HTML/CSS/JS ทั้งหมด
- ไม่มี API server
- ไม่มี database เก็บข้อมูลผู้ใช้
- ไม่มีระบบจ่ายเงินจริง (QR code ปัจจุบันส่งสลิปทาง Messenger)

**สิ่งที่ต้องมีก่อนเปิดใช้จริง:**
- Payment gateway (PromptPay API, Omise, 2C2P, ฯลฯ)
- Backend server สำหรับ:
  - ยืนยันการชำระเงิน
  - สร้างและตรวจสอบ PIN
  - เก็บประวัติการอ่าน (optional)
- Database สำหรับเก็บข้อมูลผู้ใช้ (optional)

---

## 4. ไม่มี Content Security Policy (CSP)

**ปัญหา:**
- ไม่มี CSP header ป้องกัน XSS
- ไม่มี Subresource Integrity (SRI) สำหรับ external scripts
- html2canvas.min.js โหลดจาก local แต่ไม่มี integrity check

**วิธีแก้ที่แนะนำ:**
เพิ่ม CSP header เมื่อ deploy:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none';
```

---

## 5. ไม่มี Rate Limiting

**ปัญหา:**
- ไม่มีการจำกัดจำนวนครั้งที่เปิดดูดวง
- ไม่มีการจำกัดจำนวนครั้งที่กรอก PIN
- ไม่มี bot protection

**วิธีแก้ที่แนะนำ:**
- ใช้ Cloudflare rate limiting
- หรือ backend rate limiting สำหรับ PIN verification

---

## สรุป Priority ก่อนเปิดใช้จริง

| Priority | รายการ | ความยาก |
|---|---|---|
| 🔴 P0 | ย้าย PIN verification ไป backend | กลาง |
| 🔴 P0 | ลบ hardcoded PIN จาก client | ง่าย |
| 🟡 P1 | เพิ่ม CSP header | ง่าย |
| 🟡 P1 | เพิ่ม rate limiting | กลาง |
| 🟢 P2 | เก็บ Premium state ด้วย JWT | กลาง |
| 🟢 P2 | เพิ่ม payment gateway | ยาก |

---

## หมายเหตุ

ระบบ PIN ปัจจุบัน (`ADMIN-GENERATED-CODE`) มีวัตถุประสงค์เพื่อ:
- **ทดสอบและ demo เท่านั้น** — ไม่ใช่ระบบจ่ายเงินจริง
- ใช้ในช่วง Early Access ให้ beta tester ลองใช้ฟีเจอร์ Premium
- ก่อนเปิด public ต้องเปลี่ยนเป็นระบบ backend verification ทั้งหมด
