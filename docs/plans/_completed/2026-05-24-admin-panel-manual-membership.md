# STARVIA Admin Panel + Manual Membership System Plan

**วันที่:** 2026-05-24
**สถานะ:** Draft — Implementation Plan
**เป้าหมาย:** "Manual+ ติดปีก" — ใช้ระบบ PIN ที่มีอยู่แล้ว เพิ่ม Admin Panel + LINE bot รับสลิป

---

## ภาพรวม

ของเดิมมีแล้ว:
- `scripts/issue-premium-pin.mjs` — CLI ออก PIN ทีละรหัส (`STAR-XXXXXXXX`)
- `api/premium-service.mjs` — backend verify PIN + JWT token
- `api/server.mjs` — HTTP server (`/v1/premium/verify`, `/v1/premium/status`, `/v1/health`)
- PIN store เป็น JSON file (`data/premium-pins.json`) — เก็บ `pinHash`, `plan`, `createdAt`, `expiresAt`, `usedAt`, `note`
- LINE bot พร้อมแล้ว (มี chat_id ใน memory)

สิ่งที่ต้องเพิ่ม:

```
[Admin Panel]  ←→  [Backend Admin API]  ←→  [PIN Store JSON]
      ↓
[LINE Bot] — แจ้งเตือนเมื่อมีสลิปใหม่ / ส่ง PIN ให้ลูกค้า
```

---

## 1. Backend Admin API (เพิ่มใน `api/server.mjs`)

แยก admin auth ออกจาก premium auth โดยใช้ `STARVIA_ADMIN_PASSWORD` env var

### Endpoints ใหม่

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/admin/login` | เข้าสู่ระบบ admin → ได้ admin JWT |
| GET | `/v1/admin/stats` | สถิติ dashboard (total, unused, used, expired) |
| GET | `/v1/admin/pins` | รายการ PIN ทั้งหมด (filter ได้: ?status=unused\|used\|expired) |
| POST | `/v1/admin/pins/issue` | ออก PIN ใหม่ (single หรือ batch) |
| POST | `/v1/admin/pins/expire` | หมดอายุ PIN ด้วยตนเอง |
| POST | `/v1/admin/pins/delete` | ลบ PIN ที่ยังไม่ใช้ |

### Admin JWT
- แยก secret จาก premium: `STARVIA_ADMIN_JWT_SECRET`
- TTL: 12 ชั่วโมง (admin session)
- Payload: `{ role: 'admin', iat, exp }`

---

## 2. Admin Panel (`admin.html`)

Static HTML หน้าเดียว เรียก Admin API

### หน้า Login
- กรอก `STARVIA_ADMIN_PASSWORD`
- ได้ admin JWT → เก็บใน sessionStorage

### หน้า Dashboard
- **สถิติ:** จำนวน PIN ทั้งหมด / ยังไม่ใช้ / ใช้แล้ว / หมดอายุ
- **Issue PIN:** 
  - Single: กรอก PIN เอง หรือ random → เลือกจำนวนวัน (default 7) → ระบุ note (เลขที่อ้างอิง, ชื่อลูกค้า)
  - Batch: ระบุจำนวน (1-20) → random ทั้งหมด → note pattern (`ORD-{N}`)
- **ตาราง PIN:** 
  - แสดง PIN (masked) / plan / สร้างเมื่อ / หมดอายุ / ใช้เมื่อ / note / สถานะ
  - ปุ่ม "คัดลอก PIN" → เอาไปส่งให้ลูกค้าทาง LINE
  - ปุ่ม "หมดอายุ" → expire ทันที
  - ปุ่ม "ลบ" → ลบ PIN ที่ยังไม่ใช้
  - Filter: ยังไม่ใช้ / ใช้แล้ว / หมดอายุ / ทั้งหมด
- **ค้นหา:** กรองตาม note หรือ PIN

### Security
- Admin page ต้อง login ทุกครั้งที่เปิด (sessionStorage)
- Auto-logout หลัง 12 ชั่วโมง
- PIN แสดงแบบ masked ในตาราง กดปุ่มถึงจะ reveal

---

## 3. PIN Batch CLI (`scripts/issue-premium-pins-batch.mjs`)

สร้างใหม่ (หรือเพิ่ม option `--count` ในของเดิม):

```bash
npm run pin:batch -- --store ./data/premium-pins.json --count 10 --days 7 --note "MAY-BATCH"
```

Output:
```
PINs issued (10):
  STAR-AB3D9K2M → expires 2026-05-31
  STAR-X7Y2P4QN → expires 2026-05-31
  ...
```

---

## 4. LINE Bot Integration (ต่อยอดของเดิม)

สิ่งที่ LINE bot ควรทำเพิ่ม:

### รับรูปสลิป
- User ส่งรูปภาพในแชท → bot รับรูป → ส่งแจ้งเตือน admin ว่า "มีสลิปใหม่จาก [ชื่อผู้ใช้]"
- Admin ตรวจสอบ → ออก PIN ผ่าน Admin Panel → ส่ง PIN กลับทาง LINE bot

### Quick Reply / Rich Menu
- ปุ่ม "💳 วิธีชำระเงิน" → แสดง QR PromptPay + เลขบัญชี
- ปุ่ม "📸 ส่งสลิป" → prompt ให้ถ่ายรูปส่ง
- ปุ่ม "🔑 กรอกรหัส Premium" → ลิงก์ไปเว็บ

### Auto-reply
- หลังจาก admin ออก PIN → bot ส่ง PIN ให้ลูกค้าอัตโนมัติ
- หรือ: admin copy PIN จาก Admin Panel → วางใน LINE ส่งเอง (manual)

---

## 5. Implementation Steps

### Step 1: Backend Admin API
- [ ] สร้าง `api/admin-service.mjs` — admin auth + PIN management logic
- [ ] เพิ่ม routes ใน `api/server.mjs`
- [ ] เขียน tests ใน `tests/admin-api.test.js`
- [ ] รัน test → red → implement → green

### Step 2: PIN Batch CLI
- [ ] เพิ่ม `--count` option ใน `scripts/issue-premium-pin.mjs` หรือสร้างใหม่
- [ ] เขียน tests

### Step 3: Admin Panel
- [ ] สร้าง `admin.html` (static, dark theme เข้ากับ STARVIA)
- [ ] Login → Dashboard → PIN management
- [ ] Smoke test ใน browser

### Step 4: LINE Bot Enhancement
- [ ] เพิ่ม handler รับรูปภาพ → แจ้ง admin
- [ ] Rich Menu ปุ่ม "วิธีชำระเงิน" / "ส่งสลิป"

### Step 5: Verify
- [ ] `npm test` ทั้งหมดผ่าน
- [ ] `npm run check:js` ผ่าน
- [ ] `npm run build` ผ่าน
- [ ] `git diff --check` ผ่าน
- [ ] Commit

---

## 6. ไฟล์ที่ต้องแก้/สร้าง

| ไฟล์ | Action | Purpose |
|------|--------|---------|
| `api/admin-service.mjs` | **สร้างใหม่** | Admin auth + PIN management logic |
| `api/server.mjs` | แก้ไข | เพิ่ม admin routes |
| `scripts/issue-premium-pin.mjs` | แก้ไข | เพิ่ม `--count` batch mode |
| `admin.html` | **สร้างใหม่** | Admin Panel static page |
| `tests/admin-api.test.js` | **สร้างใหม่** | Tests for admin API |
| `tests/pin-admin.test.js` | แก้ไข | เพิ่ม test batch mode |
| `package.json` | แก้ไข | เพิ่ม `pin:batch` script, update check:js |
| `.env.example` | แก้ไข | เพิ่ม `STARVIA_ADMIN_PASSWORD`, `STARVIA_ADMIN_JWT_SECRET` |

---

## 7. สิ่งที่ยังไม่ทำ (ไว้เฟสถัดไป)

- ❌ LINE bot อ่านสลิปอัตโนมัติด้วย OCR
- ❌ ระบบสมาชิก / user account
- ❌ Payment gateway จริง
- ❌ Email ส่ง PIN
