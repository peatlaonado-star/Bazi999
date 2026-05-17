# STARVIA Backend Architecture

**วันที่:** 2026-05-17
**สถานะ:** Placeholder — แผนผังสำหรับการสร้าง backend

---

## Overview

STARVIA ปัจจุบันเป็น static site ทั้งหมด Backend จำเป็นสำหรับ:
- ยืนยันการชำระเงินและ PIN
- เก็บสถานะ Premium ของ user
- จัดการ rate limiting
- ป้องกัน fraud

---

## Tech Stack (Recommended)

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ หรือ Python 3.11+ |
| Framework | Express.js / Fastify หรือ FastAPI |
| Database | PostgreSQL (Supabase / Neon) |
| Cache | Redis (Upstash) |
| Auth | JWT (jsonwebtoken) |
| Payment | PromptPay API / Omise / 2C2P |
| Hosting | Railway / Fly.io / Vercel (serverless) |

---

## Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend   │────▶│  Backend API │────▶│  Database   │
│  (Static)   │     │  (REST)      │     │  (Postgres) │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Payment     │
                    │  Gateway     │
                    └──────────────┘
```

---

## Database Schema

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### premium_orders
```sql
CREATE TABLE premium_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan TEXT NOT NULL DEFAULT 'premium_199',
  amount INTEGER NOT NULL DEFAULT 19900, -- สตางค์
  status TEXT NOT NULL DEFAULT 'pending', -- pending/paid/failed/refunded
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);
```

### premium_pins
```sql
CREATE TABLE premium_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES premium_orders(id),
  pin_hash TEXT NOT NULL, -- bcrypt hash of the PIN
  used BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### premium_tokens
```sql
CREATE TABLE premium_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  token_hash TEXT NOT NULL, -- JWT token hash for revocation
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## API Endpoints

ดูรายละเอียดใน `docs/PAYMENT_API_CONTRACT.md`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /premium/verify | ยืนยัน PIN |
| GET | /premium/status | ตรวจสอบสถานะ |
| POST | /payment/create | สร้างคำสั่งซื้อ |
| POST | /payment/webhook | รับแจ้งผลชำระเงิน |

---

## PIN Flow

```
1. User ชำระเงิน 199 THB (PromptPay QR)
2. Payment gateway แจ้ง webhook → Backend
3. Backend สร้าง PIN ใหม่ (6 หลัก, random)
4. Backend เก็บ PIN hash ใน database
5. Backend ส่ง PIN ให้ user ทาง LINE bot
6. User กรอก PIN ใน STARVIA frontend
7. Frontend ส่ง PIN ไป POST /premium/verify
8. Backend ตรวจสอบ hash, สร้าง JWT token
9. Frontend เก็บ token, ปลดล็อก Premium content
```

---

## Security Checklist

- [ ] JWT secret key เก็บใน environment variable
- [ ] PIN hash ด้วย bcrypt (cost 12)
- [ ] Rate limiting: 5 attempts / 15 min ต่อ IP
- [ ] PIN ใช้ได้ 1 ครั้ง (single-use)
- [ ] PIN หมดอายุใน 7 วัน
- [ ] HTTPS ทุก endpoint
- [ ] CORS อนุญาตเฉพาะ starvia.app
- [ ] Input validation ทุก endpoint
- [ ] Logging ทุกการเข้าถึง Premium

---

## Deployment Steps

### Phase A: Minimal Backend (1-2 วัน)
1. ตั้ง PostgreSQL database (Supabase)
2. สร้าง API endpoint 2 ตัว: `/premium/verify` + `/premium/status`
3. Deploy บน Railway/Fly.io
4. ตั้ง environment variables
5. ทดสอบกับ frontend

### Phase B: Payment Integration (3-5 วัน)
1. สมัคร PromptPay API / Omise
2. สร้าง `/payment/create` endpoint
3. ตั้ง webhook handler
4. สร้าง LINE bot สำหรับส่ง PIN
5. ทดสอบ end-to-end

### Phase C: Production Hardening (2-3 วัน)
1. เพิ่ม rate limiting (Redis)
2. เพิ่ม monitoring (Sentry / LogTail)
3. ตั้ง CI/CD pipeline
4. โหลด test
5. Security audit

---

## Cost Estimate

| Service | Monthly Cost |
|---|---|
| PostgreSQL (Supabase free tier) | $0 |
| Redis (Upstash free tier) | $0 |
| Backend hosting (Railway) | ~$5 |
| Domain + SSL | ~$1 |
| LINE bot (Messaging API) | Free (for LINE Friends) |
| **Total** | **~$6/month** |

---

## หมายเหตุ

- โครงสร้างนี้เป็น **placeholder** สำหรับการวางแผนเท่านั้น
- ยังไม่ได้สร้าง backend จริง — ปัจจุบันใช้ demo mode
- เมื่อพร้อมพัฒนา ให้เริ่มจาก Phase A (Minimal Backend) ก่อน
