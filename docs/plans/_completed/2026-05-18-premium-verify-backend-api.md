# Premium Verify Backend API Implementation Plan

> **For Hermes:** Use test-driven-development skill to implement this plan task-by-task.

**Goal:** สร้าง backend slice แรกของ STARVIA สำหรับ `POST /v1/premium/verify` เพื่อให้ frontend production adapter มี API จริงสำหรับยืนยัน PIN และรับ premium token

**Architecture:** แยก business logic ออกจาก HTTP server เพื่อทดสอบได้ง่าย: `api/premium-service.mjs` รับ config จาก environment/argument และ `api/server.mjs` เป็น Node HTTP adapter แบบ dependency-light ไม่เพิ่ม package production ใหม่

**Tech Stack:** Node.js built-in `http` + `crypto`, Vitest สำหรับ tests, Vite static build เดิม

---

### Task 1: Add failing backend service tests

**Objective:** ระบุ behavior หลักของ premium verification ก่อนเขียน production code

**Files:**
- Create: `tests/premium-backend.test.js`
- Create later: `api/premium-service.mjs`

**Step 1: Write failing test**

Test cases:
- valid PIN จาก config คืน `success: true`, `plan: premium_199`, `expiresIn: 86400`, และ token รูปแบบ JWT 3 ช่วง
- valid PIN ต้อง normalize เป็น uppercase/trim ได้
- invalid PIN คืน `success: false`, `error: INVALID_PIN`, status 401
- missing/empty PIN คืน `success: false`, `error: INVALID_PIN`, status 400
- missing production config ต้อง throw error เพื่อกัน deploy แบบไม่มี secret/PIN

**Step 2: Run test to verify failure**

Run: `npm test -- tests/premium-backend.test.js`
Expected: FAIL because `api/premium-service.mjs` does not exist

### Task 2: Implement minimal premium service

**Objective:** ทำให้ tests ของ service ผ่านโดยไม่เพิ่ม dependency

**Files:**
- Create: `api/premium-service.mjs`

**Implementation requirements:**
- export `verifyPremiumPin(input, config)`
- export `loadPremiumConfig(env)`
- use HMAC SHA-256 JWT-like token with config secret
- never hardcode production PIN or secret

**Verification:**
Run: `npm test -- tests/premium-backend.test.js`
Expected: PASS

### Task 3: Add HTTP API adapter tests

**Objective:** ทดสอบว่า HTTP server handler รองรับ endpoint ที่ frontend ใช้จริง

**Files:**
- Extend: `tests/premium-backend.test.js`
- Create later: `api/server.mjs`

**Test cases:**
- `POST /v1/premium/verify` JSON body returns 200 and JSON success
- `OPTIONS /v1/premium/verify` returns CORS preflight headers
- unknown path returns 404 JSON

**Verification:**
Run specific test and watch fail before implementation

### Task 4: Implement HTTP adapter and docs

**Objective:** เพิ่ม Node HTTP server ที่ deploy ได้ง่ายและคง static frontend เดิม

**Files:**
- Create: `api/server.mjs`
- Modify: `package.json` scripts: add `api:start`, include API files in `check:js`
- Modify: `docs/PAYMENT_API_CONTRACT.md`
- Modify: `README.md`

**Verification:**
- `npm test`
- `npm run check:js`
- `npm run build`

### Task 5: Commit

**Command:**
```bash
git add api tests docs README.md package.json
git commit -m "feat: add premium verify backend api"
```
