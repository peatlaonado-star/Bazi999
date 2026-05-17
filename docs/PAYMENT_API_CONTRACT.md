# STARVIA Payment API Contract

**วันที่:** 2026-05-17
**สถานะ:** Draft — ใช้เป็นสัญญาสำหรับการพัฒนา backend

---

## Overview

API สำหรับระบบชำระเงินและยืนยัน Premium ของ STARVIA
Frontend ปัจจุบันใช้ demo mode (hardcoded PIN) — เมื่อ backend พร้อม ให้แทนที่ fetch calls ที่ comment ไว้ใน `ui-actions.js`

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
- `PIN_EXPIRED` — PIN หมดอายุ (7 วันหลังสร้าง)
- `PIN_USED` — PIN ถูกใช้ไปแล้ว (1-time use)
- `RATE_LIMITED` — กรอกผิดเกิน 5 ครั้งใน 15 นาที

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

```js
// DEMO MODE (ปัจจุบัน)
var isDemoMode = true;
var DEMO_PINS = ['STAR199'];

// PRODUCTION (เมื่อ backend พร้อม)
// เปลี่ยน isDemoMode = false แล้ว uncomment fetch call
```

### ขั้นตอนการย้าย

1. Deploy backend API
2. สร้าง JWT secret key
3. ตั้ง `isDemoMode = false` ใน ui-actions.js
4. Uncomment production fetch call
5. ลบ `DEMO_PINS` array
6. ทดสอบ end-to-end
