# STARVIA Backend Deploy Checklist

## 1. Railway Setup (10 นาที)

### 1.1 สร้าง project
- ไปที่ https://railway.app
- New Project → Deploy from GitHub repo
- เลือก repo `peatlaonado-star/Starvia`

### 1.2 ตั้งค่า Environment Variables
ใน Railway dashboard → Variables:

```
STARVIA_JWT_SECRET=<สร้างด้วย: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
STARVIA_PREMIUM_PIN_STORE=./data/premium-pins.json
STARVIA_PIN_STORE_FILE=./data/premium-pins.json
STARVIA_ADMIN_PASSWORD=<รหัสผ่านที่พ่อจะใช้เข้า Admin Panel>
STARVIA_ADMIN_JWT_SECRET=<สร้างด้วย: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
STARVIA_ALLOWED_ORIGINS=https://starvia.netlify.app
PORT=8787
```

### 1.3 Deploy
- Railway จะ auto-detect Node.js และรัน `npm start`
- ดู domain ใน Settings (เช่น `starvia-api.up.railway.app`)

### 1.4 ทดสอบ
```bash
curl https://starvia-api.up.railway.app/v1/health
# → {"ok":true,"service":"starvia-premium-api"}
```

---

## 2. Netlify Setup (5 นาที)

### 2.1 Deploy frontend
- ไปที่ https://app.netlify.com
- Add new site → Deploy manually → ลากโฟลเดอร์ `dist/` วาง
- หรือเชื่อมกับ GitHub repo

### 2.2 ตั้งค่า API URL
แก้ไฟล์ `index.html` (ใน `dist/` หรือ source):

```html
<script>
  window.STARVIA_CONFIG = {
    demoMode: false,
    apiBaseUrl: 'https://starvia-api.up.railway.app/v1'
  };
</script>
```

### 2.3 ตั้งค่า Admin Panel
เปิด `admin.html` เพิ่ม config (หรือใช้ URL parameter):

```html
<script>
  window.STARVIA_ADMIN_CONFIG = {
    apiBaseUrl: 'https://starvia-api.up.railway.app/v1/admin'
  };
</script>
```

---

## 3. สร้าง PIN Store ไฟล์แรก

บน Railway (ผ่าน CLI หรือ terminal):

```bash
echo '{"pins":[]}' > data/premium-pins.json
```

หรือใช้ Admin Panel ออก PIN แรก (ไฟล์จะถูกสร้างอัตโนมัติ)

---

## 4. ทดสอบ End-to-End

1. เปิด `https://starvia.netlify.app`
2. กรอกชื่อ/วันเกิด → เห็นผลดวงฟรี
3. กด "ปลดล็อก 199 THB"
4. (พ่อ) เปิด `https://starvia.netlify.app/admin.html` → login → ออก PIN
5. ส่ง PIN ให้ลูกค้า
6. ลูกค้ากรอก PIN → Premium ปลดล็อก ✅

---

## 5. Railway Pricing

- Free tier: $5 credit/เดือน → เพียงพอสำหรับ MVP
- ถ้าใช้เกิน $5 → $5/เดือน สำหรับ hobby plan

---

## 6. หมายเหตุความปลอดภัย

- ห้าม commit `.env` ไฟล์จริง
- PINs ถูกเก็บเป็น hash (SHA-256) — แม้ไฟล์หลุดก็ไม่เห็น PIN จริง
- Admin password ควรเปลี่ยนทุก 30-90 วัน
- CORS ควรตั้งเฉพาะ domain ที่ใช้จริง
