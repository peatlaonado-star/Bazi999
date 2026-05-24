# STARVIA Deploy Checklist (Simplified — Single Server)

> **Frontend + Backend อยู่บน Railway server เดียวกัน!** ไม่ต้อง deploy Netlify แยก

## 1. Railway Setup (5 นาที)

### 1.1 สร้าง project
- ไปที่ https://railway.app
- New Project → Deploy from GitHub repo
- เลือก repo `peatlaonado-star/Starvia`
- Railway auto-detect Node.js → รัน `npm start`

### 1.2 ตั้งค่า Environment Variables
ใน Railway dashboard → Variables:

```
STARVIA_JWT_SECRET          = <create: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
STARVIA_ADMIN_JWT_SECRET    = <create: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
STARVIA_ADMIN_PASSWORD      = <your-admin-password>
STARVIA_PIN_STORE_FILE      = ./data/premium-pins.json
STARVIA_PREMIUM_PIN_STORE   = ./data/premium-pins.json
STARVIA_ALLOWED_ORIGINS     = *
PORT                        = 8787
```

### 1.3 ทดสอบ
```bash
# API
curl https://your-app.up.railway.app/v1/health

# Frontend
curl https://your-app.up.railway.app/

# Admin
curl https://your-app.up.railway.app/admin.html
```

### 1.4 ใช้งาน
- **Frontend:** `https://your-app.up.railway.app/`
- **Admin:** `https://your-app.up.railway.app/admin.html` → login → ออก PIN
- **API:** `https://your-app.up.railway.app/v1/*`
