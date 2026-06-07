# STARVIA Staging Deploy Checklist — 2026-05-22

## เป้าหมาย

เตรียม backend/frontend ให้พร้อม deploy แบบ staging ก่อนเปิดขาย Premium จริง โดยยังคงแนวทางประหยัดและ manual payment MVP

## Backend Premium API

แนะนำเริ่มด้วย Render/Railway/Fly.io หรือ VPS ขนาดเล็กที่รัน Node ได้

### Environment variables

ตั้งค่าตาม `.env.example` โดยค่าที่ควรมีบน staging:

```bash
STARVIA_JWT_SECRET=<long-random-secret>
STARVIA_PIN_STORE_FILE=./data/premium-pins.json
STARVIA_PREMIUM_PLAN=premium_199
STARVIA_TOKEN_TTL_SECONDS=86400
STARVIA_ALLOWED_ORIGINS=https://staging.starvia.app
PORT=<provider-provided-port>
```

ถ้า deploy frontend production พร้อมกัน ให้ใส่ origin เพิ่มแบบ comma-separated:

```bash
STARVIA_ALLOWED_ORIGINS=https://starvia.app,https://staging.starvia.app
```

### Start command

```bash
npm install
npm run api:start
```

### Health check

ตั้ง health check path ของ hosting provider เป็น:

```text
/v1/health
```

Expected response:

```json
{ "ok": true, "service": "starvia-premium-api" }
```

Header ควรมี `Cache-Control: no-store`

### Smoke check หลัง deploy backend

```bash
curl -i https://staging-api.starvia.app/v1/health

npm run pin:issue -- \
  --store ./data/premium-pins.json \
  --days 7 \
  --note "staging smoke"

curl -i https://staging-api.starvia.app/v1/premium/verify \
  -H 'Content-Type: application/json' \
  -H 'Origin: https://staging.starvia.app' \
  --data '{"pin":"<PIN_FROM_CLI>"}'
```

จากนั้นนำ token ที่ได้ไปเช็ก:

```bash
curl -i https://staging-api.starvia.app/v1/premium/status \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Origin: https://staging.starvia.app'
```

## Frontend static app

แนะนำ Vercel/Netlify/Cloudflare Pages free tier

### Production/staging config

ก่อนโหลด `ui-actions.js` ให้ตั้ง:

```html
<script>
window.STARVIA_CONFIG = {
  demoMode: false,
  apiBaseUrl: 'https://staging-api.starvia.app/v1'
};
</script>
```

สำหรับ production เปลี่ยนเป็น:

```html
<script>
window.STARVIA_CONFIG = {
  demoMode: false,
  apiBaseUrl: 'https://api.starvia.app/v1'
};
</script>
```

### Build command

```bash
npm run build
```

Publish directory:

```text
dist
```

## CORS notes

- ถ้าไม่ตั้ง `STARVIA_ALLOWED_ORIGINS` backend จะตอบ `Access-Control-Allow-Origin: *` เพื่อความสะดวกใน local/dev
- ถ้าตั้ง allowlist แล้ว backend จะ echo เฉพาะ origin ที่อยู่ในรายการ และจะไม่ส่ง `Access-Control-Allow-Origin` ให้ origin แปลกปลอม
- ควรตั้ง allowlist เสมอบน staging/production

## Verification ก่อนถือว่า staging ผ่าน

```bash
npm test
npm run check:js
npm run build
```

Manual browser smoke:

1. เปิดเว็บ staging
2. สร้าง reading อย่างน้อย 1 ครั้ง
3. เปิด modal Premium
4. กรอก PIN จาก staging store
5. ตรวจว่ากล่อง locked หาย
6. reload หน้าเว็บแล้ว Premium ยัง restore ผ่าน `/premium/status`

## งานที่ยังควรทำหลัง staging

- เลือก domain/subdomain จริง
- ตัดสินใจว่าจะใช้ file store ต่อ หรือย้ายเป็น SQLite/Postgres/Supabase ก่อนมี traffic จริง
- เพิ่ม audit log สำหรับออก PIN/ใช้ PIN
- ทดสอบมือถือจริงก่อนเปิดขาย
