# 2026-05-31 — Onboarding Journey Day 0-5

## Goal
สร้างระบบ Onboarding Journey สำหรับ STARVIA — ออกแบบ Day 0-5 experience ให้ผู้ใช้ "ติด" ตั้งแต่ครั้งแรกที่เข้าเว็บ

## Background
จากบทความ Gemini Research (psychology-subscription-design-techniques):
- วิกฤต Day 3-5 = จุดที่ผู้ใช้จะเลิกใช้มากที่สุด
- Day 0 ต้องสร้าง Sunk Cost (ลงทุนกรอกข้อมูล)
- Day 1 ต้องให้ value ทันที (full fortune ฟรี)
- Day 2 ต้องมี teaser สร้าง anticipation
- Day 3-5 ต้อง WOW ที่สุด (personalization สูง)
- Day 7 = weekly summary
- Day 11 = premium trial offer

## Architecture
Static app + localStorage ไม่ต้องมี backend เพิ่ม

### localStorage keys
```js
starvia_onboarding = {
  startedAt: '2026-05-31T10:00:00',  // ISO timestamp
  step: 0,                            // 0=welcome, 1=first-reading, 2+=daily
  birthData: { name, dob, time, gender }
}
```

### Day mapping
```
Day 0 = วันแรกที่เริ่ม (step 0 → 1)
Day 1 = วันที่ 2 (step 2)
Day 2 = วันที่ 3 (step 3) — teaser
Day 3 = วันที่ 4 (step 4) — WOW day
Day 4 = วันที่ 5 (step 5)
Day 5 = วันที่ 6 (step 6)
Day 7 = วันที่ 8 (step 8) — weekly summary
Day 11 = วันที่ 12 (step 12) — premium offer
```

## User-facing behavior

### Step 0: Welcome Screen
- แสดงเป็น overlay/modal ที่บังหน้าเว็บหลัก
- ข้อความ: "ยินดีต้อนรับสู่ STARVIA ✨ ระบบอ่านแผนที่ชีวิตด้วยโหราศาสตร์ไทย"
- ปุ่ม: "เริ่มเดินทาง →"
- เมื่อกด → ไป step 1

### Step 1: Birth Data Form (Sunk Cost)
- ฟอร์มกรอก: ชื่อ, วันเกิด, เวลาเกิด (optional), เพศ
- ออกแบบให้รู้สึกเหมือน "พิธีกรรม" ไม่ใช่แค่ฟอร์ม
- มี progress bar 顯示 3/5 steps
- เมื่อกด "เปิดดวงของคุณ ✦" → บันทึกลง localStorage → แสดงผลทำนายวันแรก

### Step 2: First Reading (Day 1)
- แสดงผลทำนายแบบ full ฟรี 100%
- แสดงว่า "นี่คือดวงของคุณ — วันแรกที่ STARVIA ได้พบคุณ"
- มี teaser: "พรุ่งนี้จะมีบางสิ่งพิเศษรอคุณอยู่..."
- ปุ่ม: "บันทึกผลทำนายของฉัน"

### Step 3: Anticipation (Day 2)
- Banner/teaser: "🔮 วันนี้ดาวมีการเคลื่อนไหว — ดวงของคุณกำลังจะเปลี่ยน!"
- แสดง daily fortune สั้นๆ พร้อม Information Gap: "รายละเอียดจะปลดล็อกในวันพรุ่งนี้"

### Step 4: WOW Day (Day 3 — จุดวิกฤต)
- แสดง daily fortune ที่ personalization สูงสุด
- แสดงสีมงคล + ตัวเลขนำโชค + เวลาที่เหมาะสม
- แสดง fortune hook ที่น่าสนใจมาก
- ข้อความ: "วันนี้คือวันพิเศษของคุณ — ดาวกำลังส่งสัญญาณสำคัญ"

### Step 5-6: Continuity (Day 4-5)
- แสดง daily fortune ต่อเนื่อง
- แสดง streak counter: "คุณดูดวงมา X วันแล้ว 🔥"
- teaser premium: "ปลดล็อกผลทำนายเชิงลึกใน 199 บาท/เดือน"

### Step 8: Weekly Summary (Day 7)
- แสดงสรุปสัปดาห์: "สัปดาห์นี้ดาวของคุณเดินทางผ่าน X ตำแหน่ง"
- เปรียบเทียบ: "สัปดาห์ที่แล้ว vs สัปดาห์นี้"
- CTA: "ดูรายงานรายสัปดาห์เต็ม → Premium"

### Step 12: Premium Offer (Day 11)
- แสดง offer: "ทดลอง Premium ฟรี 3 วัน!"
- นับถอยหลัง: "เหลืออีก X วันที่จะได้รับส่วนลดพิเศษ"
- CTA: "ปลดล็อกทุกอย่าง → 199 บาท/เดือน"

## Files to create/modify
- **Create:** `js/onboarding.js` — Onboarding engine (state machine + localStorage)
- **Modify:** `styles.css` — Onboarding CSS (dark cosmic overlay, form, progress)
- **Modify:** `index.html` — Load onboarding.js + trigger
- **Modify:** `js/daily-fortune.js` — Check onboarding state before showing fortune
- **Modify:** `scripts/copy-static-assets.mjs` — Add onboarding.js
- **Create:** `tests/onboarding.test.js` — TDD tests

## Test cases
1. ไม่มี localStorage → แสดง welcome screen
2. มี localStorage step 0 → แสดง birth data form
3. กรอกข้อมูลครบ → บันทึก + ไป step 1
4. Day 1 → แสดง first reading
5. Day 2 → แสดง anticipation teaser
6. Day 3 → แสดง WOW fortune
7. Day 7 → แสดง weekly summary
8. Day 11 → แสดง premium offer
9. localStorage corruption → fallback to step 0
10. XSS ในชื่อ → escape ทุกครั้ง

## Verification
```bash
npx vitest run tests/onboarding.test.js
npm test
npm run check:js
npm run build
```
