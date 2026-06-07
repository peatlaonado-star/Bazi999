# STARVIA Next Steps and Cost Notes

> สรุปสำหรับกลับมาทำต่อหลังจากจบงานวันที่ 2026-05-18

## ตอนนี้ทำถึงไหนแล้ว

STARVIA ตอนนี้มีตัวเว็บที่ใช้งานในเครื่อง/นำขึ้นเว็บแบบ static ได้แล้ว และมี backend ตัวแรกสำหรับระบบ Premium แล้ว

### เสร็จแล้ว

1. หน้าเว็บหลักและระบบคำนวณดวงพื้นฐาน
2. ระบบอ่านผล 3 โหมดหลัก
   - ดวงรายบุคคล / Thai Life Blueprint
   - คู่สัมพันธ์ / Couple Dharma Map
   - วันมงคล / Personal Auspicious Calendar
3. คำทำนายรายบุคคลเพิ่มส่วน Life Domain Forecast Matrix ครบ 6 ด้าน
   - โชค
   - การเงิน
   - สุขภาพ
   - ความสัมพันธ์
   - การงาน
   - บริวาร / ทีม / คนรอบตัว
4. ระบบ Premium ฝั่งหน้าเว็บ
   - Demo mode ยังใช้ทดสอบได้
   - Production mode เรียก backend จริงได้ผ่าน config
5. Backend API slice แรก
   - `POST /v1/premium/verify`
   - `GET /v1/premium/status`
   - ตรวจ PIN จาก env demo หรือ file-backed persistent store (`STARVIA_PIN_STORE_FILE`)
   - ออก token ให้ผู้ใช้ Premium
   - `pin:issue` CLI สำหรับแอดมินออก PIN หลังรับโอน manual payment
6. ระบบทดสอบและ build ผ่านล่าสุด
   - `npm test`: 73 tests ผ่าน
   - `npm run check:js`: ผ่าน
   - `npm run build`: ผ่าน
7. Commit ล่าสุด
   - `feat: add manual premium pin issuer`

## ขั้นตอนที่เหลือ แบ่งแบบภาษาคนทั่วไป

### A. ทำให้ระบบ Premium จำสถานะได้จริง — เสร็จแล้ว

เพิ่ม `GET /v1/premium/status` และ frontend เก็บ token/ตรวจสถานะตอน reload แล้ว

### B. ทำระบบ PIN แบบใช้งานจริง ไม่ใช่ใส่รายการใน environment — MVP เสร็จแล้ว

เพิ่ม file-backed persistent store ผ่าน `STARVIA_PIN_STORE_FILE` แล้ว โดยเก็บ `pinHash` แทน PIN จริง ตรวจวันหมดอายุ และบันทึก `usedAt` หลังใช้สำเร็จ ทำให้ PIN หนึ่งรหัสใช้ได้ครั้งเดียว

งานถัดไป:
- ยกระดับจาก file store ไป SQLite/Postgres/Supabase เมื่อมีผู้ใช้จริงหรือ deploy หลาย instance
- เพิ่ม audit log แยกสำหรับออก PIN / ใช้ PIN / หมดอายุ

### C. เชื่อมการชำระเงินจริง

ตอนนี้ยังไม่มีระบบรับเงินอัตโนมัติ มีแค่ API ยืนยันรหัสหลังจ่ายแล้ว

งานถัดไป:
- เลือกช่องทางรับเงิน เช่น PromptPay/QR, payment gateway, หรือเริ่มแบบ manual ก่อน
- ถ้า manual: ลูกค้าโอนเงิน → แอดมินใช้ `npm run pin:issue -- --store ./data/premium-pins.json --note "ORDER-..."` เพื่อออก PIN ให้ลูกค้า
- ถ้า automatic: gateway แจ้ง webhook → ระบบสร้าง PIN/สิทธิ์ให้อัตโนมัติ

### D. นำเว็บและ backend ขึ้นออนไลน์

ต้องมีที่อยู่เว็บจริงและที่อยู่ API จริง

งานถัดไป:
- Deploy frontend static app เช่น Vercel/Netlify/Cloudflare Pages
- Deploy backend Node API เช่น Render/Railway/Fly.io/VPS/Cloudflare Workers adaptation
- ตั้ง HTTPS และ domain/subdomain เช่น
  - `starvia.app`
  - `api.starvia.app`

### E. ทำประสบการณ์ผู้ใช้ให้พร้อมขาย

ก่อนขายจริงควรเก็บรายละเอียดเล็ก ๆ ให้ครบ

งานถัดไป:
- หน้าอธิบาย Premium ว่าได้อะไร
- ปุ่ม/ขั้นตอนชำระเงินที่เข้าใจง่าย
- ข้อความ error ที่เป็นมิตร
- ทดสอบมือถือจริง
- เพิ่ม privacy policy / terms แบบสั้น ๆ

### F. งานต่อยอดหลังขายได้

งานที่ทำให้สินค้าดูพรีเมียมขึ้น:
- Export PDF รายงานดวง
- Share card สำหรับ IG/TikTok/LINE
- บัญชีผู้ใช้และประวัติรายงาน
- คำนวณโหราศาสตร์แม่นขึ้นด้วย ephemeris/location
- AI ช่วยเรียบเรียงคำทำนายเฉพาะบุคคลแบบอยู่ในกรอบโหราศาสตร์ไทย

## ค่าใช้จ่ายที่อาจมีต่อไป

### ช่วงทดลอง / MVP

ทำแบบประหยัดที่สุดได้ใกล้เคียง 0 บาทต่อเดือน ถ้าใช้:
- GitHub/Vercel/Netlify free tier สำหรับหน้าเว็บ
- backend free tier ที่ยังพอใช้ได้
- manual payment โอนเงินแล้วออก PIN เอง

ค่าใช้จ่ายที่อาจเกิด:
- Domain: ประมาณ 400-1,500 บาท/ปี แล้วแต่นามสกุล
- Hosting frontend: 0 บาทช่วงเริ่มต้น
- Hosting backend: 0-300 บาท/เดือนช่วงเริ่มต้น
- Database: 0-300 บาท/เดือนช่วงเริ่มต้น

### ช่วงเริ่มขายจริง

ควรเผื่องบประมาณ:
- Domain: 400-1,500 บาท/ปี
- Backend hosting: 200-800 บาท/เดือน
- Database: 0-500 บาท/เดือน
- Payment gateway fee: มักคิดเป็น % ต่อรายการ หรือค่าธรรมเนียมต่อธุรกรรม แล้วแต่ผู้ให้บริการ
- Email/LINE notification ถ้ามี: อาจฟรีช่วงแรก หรือมีค่าใช้จ่ายตามปริมาณ

### ถ้าใช้ AI API สร้างคำทำนายเฉพาะบุคคล

ตอนนี้ STARVIA ยังไม่จำเป็นต้องใช้ AI API เพื่อเปิดขาย เพราะคำทำนายหลักเป็น data-driven ในเว็บแล้ว

ถ้าเพิ่ม AI ภายหลัง ค่าใช้จ่ายจะขึ้นกับจำนวนผู้ใช้และความยาวคำทำนาย เช่น:
- ใช้ AI เฉพาะ Premium report: คุมต้นทุนได้ง่ายกว่า
- ใช้ AI ทุกครั้งที่กดดู: ต้นทุนจะเพิ่มตามจำนวนการใช้งาน

## คำแนะนำรอบถัดไป

ลำดับที่เหมาะที่สุด:

1. ทดสอบ manual payment flow จริง: โอนเงิน → ออก PIN ด้วย `pin:issue` → ลูกค้ากรอก PIN → reload แล้วยังเป็น Premium
2. Deploy frontend + backend ขึ้นออนไลน์แบบ staging
3. เพิ่ม privacy policy / terms / ข้อความอธิบาย Premium ก่อนขายจริง
4. ถ้าเริ่มมีผู้ใช้หลายคน/หลาย instance ค่อยย้าย PIN store เป็น SQLite/Postgres/Supabase

## ไฟล์สำคัญสำหรับกลับมาทำต่อ

- Roadmap: `docs/STARVIA_TH_PRODUCT_ROADMAP.md`
- API contract: `docs/PAYMENT_API_CONTRACT.md`
- Backend plan ล่าสุด: `docs/plans/2026-05-18-premium-verify-backend-api.md`
- สรุปขั้นตอนเหลือและค่าใช้จ่าย: `docs/plans/2026-05-18-next-steps-and-costs.md`
- Backend service: `api/premium-service.mjs`
- Backend server: `api/server.mjs`
- Backend tests: `tests/premium-backend.test.js`
