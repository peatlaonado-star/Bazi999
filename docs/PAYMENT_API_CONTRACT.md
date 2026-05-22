# STARVIA Payment API Contract

**วันที่:** 2026-05-17
**สถานะ:** Draft — ใช้เป็นสัญญาสำหรับการพัฒนา backend

---

## Overview

API สำหรับระบบชำระเงินและยืนยัน Premium ของ STARVIA
Frontend ปัจจุบันรองรับ 2 mode:
- Local/demo: ไม่ตั้งค่า `window.STARVIA_CONFIG` หรือ `demoMode !== false` จะใช้ PIN demo สำหรับทดสอบ
- Production adapter: ตั้ง `demoMode: false` เพื่อให้ frontend เรียก backend จริงที่ `/premium/verify`

Backend slice แรกมีแล้วใน repo:
- `api/premium-service.mjs` — logic ตรวจ PIN และออก token
- `api/server.mjs` — Node HTTP server สำหรับ `POST /v1/premium/verify`, `GET /v1/premium/status`, และ `GET /v1/health`
- ใช้ environment variables: `STARVIA_JWT_SECRET`, `STARVIA_PREMIUM_PINS` หรือ `STARVIA_PIN_STORE_FILE`, optional `STARVIA_PREMIUM_PLAN`, `STARVIA_TOKEN_TTL_SECONDS`, `STARVIA_ALLOWED_ORIGINS`, `PORT`

ตัวอย่าง production config:
```html
<script>
window.STARVIA_CONFIG = {
  demoMode: false,
  apiBaseUrl: 'https://api.starvia.app/v1'
};
</script>
```

เมื่อ backend พร้อม ให้ตั้ง config นี้ก่อนโหลด `ui-actions.js` หรือฝังใน shell สำหรับ production build

---

## Base URL

```
Production: https://api.starvia.app/v1
Staging:    https://staging-api.starvia.app/v1
```

---

## Endpoints

### POST /premium/verify

ยืนยัน PIN ที่ได้รับหลังชำระเงิน

**Request:**
```json
{
  "pin": "STAR199"
}
```

**Response (success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 86400,
  "plan": "premium_199"
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "INVALID_PIN",
  "message": "รหัสผ่านไม่ถูกต้อง"
}
```

**Error codes:**
- `INVALID_PIN` — PIN ไม่ถูกต้อง
- `PIN_EXPIRED` — PIN หมดอายุ
- `PIN_USED` — PIN ถูกใช้ไปแล้ว (1-time use)
- `RATE_LIMITED` — กรอกผิดเกิน 5 ครั้งใน 15 นาที

**Persistent PIN store:** ตั้ง `STARVIA_PIN_STORE_FILE=/path/to/pins.json` เพื่อใช้ store แบบ file-backed โดยไม่ต้องใส่ PIN จริงใน environment และระบบจะ mark `usedAt` หลัง verify สำเร็จ ทำให้ PIN ใช้ได้ครั้งเดียว

```json
{
  "pins": [
    {
      "pinHash": "<sha256-of-normalized-pin>",
      "plan": "premium_199",
      "createdAt": "2026-05-19T12:00:00.000Z",
      "expiresAt": "2026-06-01T00:00:00.000Z",
      "usedAt": null,
      "note": "manual transfer/order reference"
    }
  ]
}
```

สร้าง hash ด้วย Node:

```bash
node -e "const crypto=require('node:crypto'); const pin=process.argv[1].trim().toUpperCase(); console.log(crypto.createHash('sha256').update(pin).digest('hex'))" STAR199
```

หรือออก PIN สำหรับ manual payment ด้วย CLI:

```bash
npm run pin:issue -- \
  --store ./data/premium-pins.json \
  --days 7 \
  --note "manual transfer ORD-001"
```

CLI จะพิมพ์ PIN จริงเพื่อส่งให้ลูกค้า แต่ใน store จะเก็บเฉพาะ `pinHash` เท่านั้น

---

### GET /premium/status

ตรวจสอบสถานะ Premium ของ user (ใช้ JWT token)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (active):**
```json
{
  "active": true,
  "plan": "premium_199",
  "expiresAt": "2026-05-24T12:00:00Z"
}
```

**Response (expired):**
```json
{
  "active": false,
  "error": "TOKEN_EXPIRED"
}
```

---

### GET /v1/health

Health check สำหรับ hosting provider / uptime probe ไม่ต้องใช้ token

**Response:**
```json
{
  "ok": true,
  "service": "starvia-premium-api"
}
```

**Headers:**
```text
Cache-Control: no-store
```

---

### POST /payment/create (Future)

สร้างการชำระเงินใหม่

**Request:**
```json
{
  "plan": "premium_199",
  "method": "promptpay",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "orderId": "ORD-20260517-001",
  "paymentUrl": "https://...",
  "qrCode": "data:image/png;base64,...",
  "expiresAt": "2026-05-17T12:30:00Z"
}
```

---

### POST /payment/webhook (Future)

Webhook สำหรับ payment gateway แจ้งผลการชำระเงิน

**Request (from gateway):**
```json
{
  "orderId": "ORD-20260517-001",
  "status": "paid",
  "amount": 19900,
  "transactionId": "TXN-xxx",
  "paidAt": "2026-05-17T12:05:00Z"
}
```

**Action:** Backend สร้าง PIN ใหม่ 1 ครั้ง ส่งให้ user ทาง LINE/Email

---

## Token Structure (JWT)

```json
{
  "sub": "user_123",
  "plan": "premium_199",
  "iat": 1716000000,
  "exp": 1716086400
}
```

- `sub` — user ID
- `plan` — premium plan name
- `iat` — issued at (Unix timestamp)
- `exp` — expiration (Unix timestamp, +24 ชั่วโมง)

---

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| POST /premium/verify | 5 requests | 15 minutes |
| GET /premium/status | 60 requests | 1 minute |
| POST /payment/create | 3 requests | 1 hour |

---

## Frontend Integration
### ui-actions.js — สถานะปัจจุบัน

Frontend เลือก mode จาก `window.STARVIA_CONFIG` และใน production จะเก็บ token ไว้ที่ `localStorage.starviaPremiumToken` หลัง verify สำเร็จ จากนั้นโหลดหน้าใหม่จะเรียก `GET {apiBaseUrl}/premium/status` เพื่อคืนสถานะ Premium โดยอัตโนมัติ:

```js
window.STARVIA_CONFIG = {
  demoMode: false,
  apiBaseUrl: 'https://api.starvia.app/v1'
};
```

ถ้า `demoMode: false` จะเรียก `POST {apiBaseUrl}/premium/verify` พร้อม body `{ "pin": "..." }`

### Backend local start

```bash
STARVIA_PIN_STORE_FILE="./data/premium-pins.json" \
STARVIA_JWT_SECRET="replace-with-long-random-secret" \
PORT=8787 \
npm run api:start
```

หรือใช้ env PIN แบบทดลอง:

```bash
STARVIA_PREMIUM_PINS="STAR199,LUCKY777" \
STARVIA_JWT_SECRET="replace-with-long-random-secret" \
PORT=8787 \
npm run api:start
```

Local endpoint:

```text
POST http://localhost:8787/v1/premium/verify
```

### ขั้นตอนการย้ายขึ้น production

1. สร้าง secret จริงและตั้งใน hosting environment เป็น `STARVIA_JWT_SECRET`
2. ตั้ง `STARVIA_PIN_STORE_FILE` ชี้ไปยังไฟล์ store ที่เก็บ `pinHash` เพื่อให้ PIN ใช้ครั้งเดียวและไม่เก็บรหัสจริงใน environment
3. Deploy `api/server.mjs` เป็น Node service หลัง HTTPS/reverse proxy
4. ตั้ง frontend `window.STARVIA_CONFIG.demoMode = false` และ `apiBaseUrl` เป็น production API
5. ทดสอบ end-to-end: กรอก PIN → ได้ token → ปลดล็อก Premium → reload หน้า → `GET /premium/status` คืนสถานะ Premium

