# STARVIA Content Update — Master Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** อัพเดทเว็บ starvia.website ด้วยเนื้อหาใหม่ 11 ไฟล์จาก Obsidian vault ที่เขียนเสร็จแล้ว แต่ยังไม่ได้ integrate เข้าเว็บ

**Architecture:** Static HTML/CSS/JS site deployed to Cloudflare Pages via GitHub. Content lives in `data/thai-astrology-content.js` (global `THAI_ASTRO_CONTENT` var) + individual JS renderer files. Build = Vite + copy-static-assets script → `dist/`. Deploy = `git push origin main`.

**Tech Stack:** Vanilla JS (no framework), Vite bundler, Cloudflare Pages, Umami analytics

---

## 📊 Current State Audit

### ✅ Content ที่มีในเว็บแล้ว (website code)
| Feature | Source | Status |
|---|---|---|
| กระจกกรรม (karmaMirror) | `data/thai-astrology-content.js` + `reading-helpers.js` | ✅ Live |
| ดวงคู่ (coupleDharma) | `data/thai-astrology-content.js` + `reading-helpers.js` | ✅ Live |
| หมอทักประจำเดือน (monthlyLifeMap) | `data/thai-astrology-content.js` + `reading-helpers.js` | ✅ Live |
| กำลังวัน (dailyBrief) | `data/thai-astrology-content.js` + `renderer-individual.js` | ✅ Live |
| ทักษาปกรณ์ (THAKSA) | Hardcoded in `renderer-individual.js` | ✅ Live |
| พลังธาตุ (POWER_ELEMENTS) | Hardcoded in `renderer-individual.js` | ✅ Live |
| กราฟชีวิต (Life Graph) | `js/life-graph.js` | ✅ Live |
| ดวงวันนี้ (Daily Fortune) | `js/daily-fortune.js` | ✅ Live |
| Cosmic Events Banner | `js/cosmic-events.js` + generated data | ✅ Live |
| ราศี trait/apply (สั้น) | Hardcoded in `app.js` PL/RA arrays | ✅ Live (brief) |

### 🆕 Content ที่เขียนเสร็จใน Obsidian แล้วแต่ยังไม่ได้ลงเว็บ
| # | ไฟล์ Obsidian | เนื้อหา | ขนาด | ผลกระทบ |
|---|---|---|---|---|
| 1 | `content-วิธีปรับชีวิตตาม12ราศี.md` | 12 ราศี × อัตลักษณ์ (จุดแข็ง+จุดปรับ+วิธีปรับ+ข้อคิด) | 29KB | 🔴 สูง — replaces brief rasi trait |
| 2 | `content-วิธีปรับชีวิตตามธาตุทั้ง4.md` | 4 ธาตุ × แบบฝึก 7 วัน + ตารางแทนที่ | 12KB | 🟡 สูง — new content section |
| 3 | `content-ช่วงชีวิตตามทักษามหาอุติ.md` | 7 วันเกิด × 7 ช่วงชีวิต (0-84 ปี) | 15KB | 🟡 สูง — enriches life graph |
| 4 | `content-จรประจำปีตามวันเกิด.md` | 7 วันเกิด × แนวโน้มปีนี้ 5 ด้าน | 13KB | 🔴 สูง — retention driver |
| 5 | `content-ดูดวงคู่-ความเข้ากันได้.md` | 4 ธาตุ × ความเข้ากันได้ + ตาราง | 6KB | 🟡 สูง — couple feature |
| 6 | `content-ราหูเกตุ-จุดพลิกชีวิต.md` | ราหูย้าย × 7 วันเกิด + วิธีรับมือ | 7KB | 🟡 สูง — engagement hook |
| 7 | `content-วิธีเสริมดวงประจำปีตามจร.md` | 7 วันเกิด × วิธีเสริม + ของเสริม | 11KB | 🟡 premium content |
| 8 | `content-ฤกษ์ยามตามวันเกิด.md` | ฤกษ์ 9 + ยาม 8 + ตารางวันดี/ระวัง | 11KB | 🟡 premium feature |
| 9 | `content-กำลังพระเคราะห์ตามเดือนเกิด.md` | กำลังวัน × เดือนเกิด (12 เดือน) | 9KB | 🟢 premium enrichment |
| 10 | `data-กราฟชีวิต-7ช่วง5ด้าน.md` | 7 ตาราง × 5 ด้าน data shape | 10KB | 🟢 enriches existing |
| 11 | `data-แบบทดสอบธาตุ-คำถามผลลัพธ์.md` | 10 ข้อ + ผลลัพธ์ 4 ธาตุ + data shape | 15KB | 🟡 onboarding quiz |

---

## 🗺️ Phase Overview

| Phase | Name | Scope | Effort | Impact |
|---|---|---|---|---|
| **P0** | Audit & Data Migration | ย้ายเนื้อหา Obsidian → JS data files | 1-2 ชม. | เตรียมข้อมูล |
| **P1** | Core Content Integration | เพิ่ม 12 ราศี + ธาตุ 4 + ทักษามหาอุติ + จรปี | 2-3 ชม. | 🔴 สูงสุด |
| **P2** | Feature Content | ดูดวงคู่ + ราหูเกตุ + ฤกษ์ยาม + เสริมดวง | 2-3 ชม. | 🟡 สูง |
| **P3** | Engagement Features | แบบทดสอบธาตุ + กำลังพระเคราะห์ + กราฟชีวิต enriched | 1-2 ชม. | 🟢 medium |
| **P4** | Polish & Deploy | UI/UX, test, build, deploy | 1 ชม. | 🔴 go-live |

---

## Phase 0: Audit & Data Migration (เตรียมข้อมูล)

> อ่านเนื้อหาทั้งหมดจาก Obsidian แล้วแปลงเป็น JS data structure ที่เว็บใช้ได้

### Task 0.1: สร้าง data shape สำหรับ 12 ราศีอัตลักษณ์
**Objective:** แปลงเนื้อหา 12 ราศีจาก Obsidian เป็น JS object ที่ renderer ใช้ได้

**Files:**
- Read: Obsidian `content-วิธีปรับชีวิตตาม12ราศี.md` (29KB)
- Create: `data/zodiac-identities.js` (new file)

**Data Shape:**
```js
var ZODIAC_IDENTITIES = {
  'เมษ': {
    element: 'ไฟ',
    symbol: '♈',
    ruler: 'อาทิตย์ อังคาร',
    identity: 'ผู้ริเริ่ม',
    description: 'คุณเกิดมาเป็นผู้ริเริ่ม...',
    strengths: 'กล้าตัดสินใจ มีแรงขับสูง ไม่อายที่จะผิด',
    growthEdge: 'เริ่มแล้วต้องมีวินัยถึงเส้นชัย',
    replaceTable: [ {old: '...', new: '...'} ],
    wisdom: 'ความกล้าของคุณคือของขวัญ...',
    dailyAction: '...'
  },
  // ... 12 ราศี
};
```

**Steps:**
1. Read full content from Obsidian vault
2. Parse each zodiac section into structured JS object
3. Create `data/zodiac-identities.js` with global `ZODIAC_IDENTITIES` var
4. Verify all 12 signs have complete data (identity, strengths, growthEdge, replaceTable, wisdom, dailyAction)

---

### Task 0.2: สร้าง data shape สำหรับธาตุ 4 แบบฝึก 7 วัน
**Objective:** แปลงเนื้อหาธาตุ 4 เป็น JS object

**Files:**
- Read: Obsidian `content-วิธีปรับชีวิตตามธาตุทั้ง4.md`
- Create: `data/element-practices.js` (new file)

**Data Shape:**
```js
var ELEMENT_PRACTICES = {
  'ไฟ': {
    adjustmentPoints: ['...'],
    replacementTable: [ {old: '...', new: '...'} ],
    dailyPractices: [
      { day: 'วันที่ 1', practice: '...', focus: '...' },
      // ... 7 days
    ]
  },
  // ... 4 elements
};
```

---

### Task 0.3: สร้าง data shape สำหรับทักษามหาอุติ
**Objective:** แปลงข้อมูล 7 ช่วงชีวิต × 7 วันเกิด เป็น JS object

**Files:**
- Read: Obsidian `content-ช่วงชีวิตตามทักษามหาอุติ.md`
- Create: `data/life-periods.js` (new file)

**Data Shape:**
```js
var LIFE_PERIODS = {
  'อาทิตย์': [
    { period: '0-12 ปี', age: '0-12', strength: '...', weakness: '...', advice: '...' },
    // ... 7 periods
  ],
  // ... 7 birth days
};
```

---

### Task 0.4: สร้าง data shape สำหรับจรประจำปี
**Objective:** แปลงเนื้อหาจรปี 7 วันเกิด × 5 ด้าน เป็น JS object

**Files:**
- Read: Obsidian `content-จรประจำปีตามวันเกิด.md`
- Create: `data/yearly-transit.js` (new file)

**Data Shape:**
```js
var YEARLY_TRANSIT = {
  'อาทิตย์': {
    career: { trend: '...', detail: '...', action: '...' },
    money: { trend: '...', detail: '...', action: '...' },
    love: { trend: '...', detail: '...', action: '...' },
    health: { trend: '...', detail: '...', action: '...' },
    luck: { trend: '...', detail: '...', action: '...' }
  },
  // ... 7 birth days
};
```

---

### Task 0.5: สร้าง data shapes สำหรับเนื้อหาที่เหลือ (5 ไฟล์)
**Objective:** แปลง content-คู่, ราหูเกตุ, เสริมดวง, ฤกษ์ยาม, กำลังพระเคราะห์ เป็น JS data

**Files:**
- Create: `data/couple-compatibility.js`
- Create: `data/rahu-ketu.js`
- Create: `data/yearly-enhancement.js`
- Create: `data/auspicious-timing.js`
- Create: `data/planetary-strength.js`

**Steps:**
1. Read each Obsidian file
2. Parse into structured JS data
3. Create individual data files
4. Verify completeness

---

### Task 0.6: สร้าง data shape สำหรับแบบทดสอบธาตุ + กราฟชีวิต data
**Objective:** แปลง quiz data + life graph data เป็น JS-ready format

**Files:**
- Create: `data/element-quiz.js` (10 questions + results)
- Create: `data/life-graph-data.js` (7×5 tables)

---

### Task 0.7: Update copy-static-assets.mjs
**Objective:** เพิ่ม data files ใหม่ทั้งหมดเข้า build pipeline

**Files:**
- Modify: `scripts/copy-static-assets.mjs`

**Steps:**
1. Add all new `data/*.js` files to the `jsFiles` or `otherFiles` array
2. Verify build copies them to `dist/data/`
3. Run `npm run build` to verify

**Verification:**
```bash
npm run build && ls dist/data/
# Should show all new data files with content hashes
```

---

## Phase 1: Core Content Integration (เนื้อหาหลัก)

> เชื่อม data จาก Phase 0 เข้ากับ renderer ที่มีอยู่ + เพิ่ม UI sections ใหม่

### Task 1.1: อัพเดท 12 ราศี — แทนที่ rasi trait สั้น ๆ ด้วยอัตลักษณ์เต็ม
**Objective:** แทนที่ rasi trait/apply สั้น ๆ ใน app.js ด้วย ZODIAC_IDENTITIES ที่ละเอียดกว่า

**Files:**
- Modify: `index.html` — เพิ่ม `<script defer src="data/zodiac-identities.js?v=2.0.3">`
- Modify: `js/renderer-individual.js` — อัพเดท "พลังแห่งราศี" section ให้แสดง identity, strengths, growthEdge, replaceTable, wisdom

**Current code (renderer-individual.js:820-822):**
```js
var rasiHtml = '<div class="rasi-header">' + rasiIconHtml(ri, r.n, 36) + ' <strong class="hl-gold">✦ พลังแห่งราศี' + r.n + ' :</strong></div>'
  + 'จักรราศีมอบ <span class="hl-purple">"' + (r.trait || 'พลังประจำตัว') + '"</span>...'
```

**New code approach:**
```js
var zi = ZODIAC_IDENTITIES && ZODIAC_IDENTITIES[r.n] ? ZODIAC_IDENTITIES[r.n] : null;
if (zi) {
  var rasiHtml = '<div class="rasi-header">' + rasiIconHtml(ri, r.n, 36) + ' <strong class="hl-gold">✦ ' + zi.identity + ' — ' + r.n + '</strong></div>'
    + '<p>' + zi.description + '</p>'
    + '<div class="zi-strengths"><strong>จุดแข็ง:</strong> ' + zi.strengths + '</div>'
    + '<div class="zi-growth"><strong>จุดที่ควรปรับ:</strong> ' + zi.growthEdge + '</div>'
    + buildReplaceTable(zi.replaceTable)
    + '<blockquote class="zi-wisdom">' + zi.wisdom + '</blockquote>'
    + '<div class="zi-action"><strong>สิ่งที่ควรทำวันนี้:</strong> ' + zi.dailyAction + '</div>';
}
```

**Steps:**
1. Load `ZODIAC_IDENTITIES` from data file in `renderer-individual.js`
2. Update the rasi section (line ~820) to use full identity data
3. Add CSS classes for new elements in `styles.css`
4. Build + verify rendering

**Verification:**
```bash
npm run build && grep -c "ZODIAC_IDENTITIES" dist/js/renderer-*.js
```

---

### Task 1.2: เพิ่มเนื้อหาธาตุ 4 — แบบฝึก 7 วัน
**Objective:** เพิ่มส่วน "วิธีปรับชีวิตตามธาตุ" ใน individual reading

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/element-practices.js`
- Modify: `js/renderer-individual.js` — เพิ่ม function `buildElementPractices(element)`
- Modify: `styles.css` — เพิ่ม CSS สำหรับ element practices section

**Approach:**
- เพิ่ม collapsible section ใน individual reading: "🔮 แบบฝึกหัดธาตุของคุณ"
- แสดง daily practice 7 วัน ตามธาตุเจ้าชะตา
- Free tier: แสดง 3 วันแรก / Premium: ครบทั้ง 7 วัน

**Verification:**
```bash
npm test && npm run build
```

---

### Task 1.3: เพิ่มทักษามหาอุติ — 7 ช่วงชีวิต
**Objective:** ปรับปรุง Life Graph section ให้แสดงข้อมูลทักษามหาอุติ

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/life-periods.js`
- Modify: `js/life-graph.js` — เพิ่ม function `buildLifePeriods(birthDay)`
- Modify: `styles.css` — เพิ่ม CSS สำหรับ life period cards

**Approach:**
- เพิ่ม tab หรือ section ใน Life Graph: "ช่วงชีวิตตามทักษามหาอุติ"
- แสดง 7 ช่วง (0-12, 12-24, 24-36, 36-48, 48-60, 60-72, 72-84)
- แต่ละช่วงมี: ช่วงอายุ, จุดเด่น, จุดอ่อน, คำแนะนำ

---

### Task 1.4: เพิ่มจรประจำปี — แนวโน้ม 5 ด้าน
**Objective:** เพิ่มส่วน "แนวโน้มปีนี้" ใน individual reading

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/yearly-transit.js`
- Modify: `js/renderer-individual.js` — เพิ่ม function `buildYearlyTransit(birthDay)`
- Modify: `styles.css` — เพิ่ม CSS สำหรับ transit cards

**Approach:**
- เพิ่ม collapsible section: "🔮 แนวโน้มชีวิตปีนี้"
- แสดง 5 ด้าน: งาน/เงิน/รัก/สุขภาพ/โชค
- แต่ละด้านมี: trend (ขึ้น/ลง/คงที่), detail, action
- Free: แสดง 2 ด้าน / Premium: ครบทั้ง 5 ด้าน

---

## Phase 2: Feature Content (เนื้อหาฟีเจอร์)

### Task 2.1: อัพเดทดูดวงคู่ — ความเข้ากันได้
**Objective:** อัพเดท coupleDharma section ด้วยข้อมูลใหม่จาก Obsidian

**Files:**
- Modify: `data/thai-astrology-content.js` — อัพเดท coupleDharma section
- Modify: `js/reading-helpers.js` — อัพเดท buildCoupleDharma()

**Approach:**
- อัพเดท pairTypes (supportive, mirror, fire, lesson) ด้วยเนื้อหาจาก Obsidian
- เพิ่ม compatibility table 4×4 ธาตุ
- เพิ่ม advice สำหรับแต่ละคู่

---

### Task 2.2: เพิ่มราหูเกตุ — จุดพลิกชีวิต
**Objective:** เพิ่มส่วน "ราหูเกตุ" ใน individual reading

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/rahu-ketu.js`
- Modify: `js/renderer-individual.js` — เพิ่ม function `buildRahuKetu(birthDay)`
- Modify: `styles.css` — เพิ่ม CSS

**Approach:**
- เพิ่ม collapsible section: "🌑 ราหูเกตุ — จุดพลิกชีวิต"
- แสดงผลจากราศีปัจจุบันของราหู + วันเกิด
- Free: แสดง impact สั้น / Premium: แสดง detail + วิธีรับมือ

---

### Task 2.3: เพิ่มฤกษ์ยาม
**Objective:** อัพเดท renderer-auspicious.js ด้วยข้อมูลฤกษ์ยามจาก Obsidian

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/auspicious-timing.js`
- Modify: `js/renderer-auspicious.js` — อัพเดทด้วยฤกษ์ 9 + ยาม 8 + ตารางวันดี/ระวัง
- Modify: `styles.css`

**Approach:**
- อัพเดท existing auspicious section ด้วยข้อมูลที่ละเอียดกว่า
- เพิ่ม "วันดี/วันระวัง" 7×7 table
- เพิ่มฤกษ์แต่งงาน/เปิดร้าน (premium)

---

### Task 2.4: เพิ่มวิธีเสริมดวงประจำปี
**Objective:** เพิ่มส่วน "เสริมดวงปีนี้" ใน individual reading

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/yearly-enhancement.js`
- Modify: `js/renderer-individual.js` — เพิ่ม function `buildYearlyEnhancement(birthDay)`
- Modify: `styles.css`

**Approach:**
- แสดงวิธีเสริมดวงตามจรปีนี้ × วันเกิด
- ของเสริมมงคล, สี, ทิศ
- Premium content

---

## Phase 3: Engagement Features (ฟีเจอร์ดึง engagement)

### Task 3.1: แบบทดสอบธาตุ (Element Quiz)
**Objective:** เพิ่ม quiz สำหรับ onboarding + engagement

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/element-quiz.js`
- Modify: `js/onboarding.js` — เพิ่ม quiz flow
- Create: `css/quiz.css` (new) หรือเพิ่มใน `styles.css`
- Create: `js/quiz.js` (new) หรือรวมใน `onboarding.js`

**Data Shape:**
```js
var ELEMENT_QUIZ = {
  questions: [
    { q: 'วันหยุดยาวคุณชอบทำอะไร?', options: ['A: ผจญภัย', 'B: พักผ่อน', 'C: หาความรู้', 'D: อยู่กับคนรัก'] },
    // ... 10 questions
  ],
  results: {
    'ไฟ': { title: '...', description: '...', element: 'ไฟ' },
    'ดิน': { ... },
    'ลม': { ... },
    'น้ำ': { ... }
  },
  mixResults: {
    'ไฟดิน': { ... },
    // ... combinations
  }
};
```

**Approach:**
- Quiz 10 ข้อ → ผลลัพธ์ 4 ธาตุ (+ ผสม)
- ใช้เป็น onboarding alternative (test ก่อนใส่ข้อมูลเกิด)
- แชร์ผลลัพธ์ได้ (viral hook)

---

### Task 3.2: กำลังพระเคราะห์ตามเดือนเกิด
**Objective:** เพิ่มข้อมูลกำลังพระเคราะห์ 12 เดือน

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/planetary-strength.js`
- Modify: `js/renderer-individual.js` — เพิ่ม function `buildPlanetaryStrength(birthMonth)`
- Modify: `styles.css`

**Approach:**
- เพิ่ม section "กำลังวันประจำเดือนเกิด"
- แสดงดาวที่มีกำลัง + คำแนะนำ
- Premium enrichment

---

### Task 3.3: อัพเดทกราฟชีวิต — data enrichment
**Objective:** ปรับปรุง Life Graph ด้วย data จาก Obsidian

**Files:**
- Modify: `index.html` — เพิ่ม script tag สำหรับ `data/life-graph-data.js`
- Modify: `js/life-graph.js` — ปรับปรุง data source

**Approach:**
- อัพเดท 7×5 table data ด้วยเนื้อหาจาก Obsidian
- เพิ่ม detail level สำหรับ premium

---

## Phase 4: Polish & Deploy (ตกแต่ง + deploy)

### Task 4.1: CSS Updates
**Objective:** เพิ่ม CSS classes สำหรับเนื้อหาใหม่ทั้งหมด

**Files:**
- Modify: `styles.css` — เพิ่ม styles สำหรับ:
  - `.zi-*` (zodiac identity)
  - `.ep-*` (element practices)
  - `.lp-*` (life periods)
  - `.yt-*` (yearly transit)
  - `.rk-*` (rahu ketu)
  - `.eq-*` (element quiz)

---

### Task 4.2: Script Load Order
**Objective:** จัดลำดับ script loading ใน index.html ให้ถูกต้อง

**Files:**
- Modify: `index.html` — เพิ่ม data scripts ก่อน renderer scripts

**Load Order:**
```
1. data/zodiac-identities.js
2. data/element-practices.js
3. data/life-periods.js
4. data/yearly-transit.js
5. data/couple-compatibility.js
6. data/rahu-ketu.js
7. data/yearly-enhancement.js
8. data/auspicious-timing.js
9. data/planetary-strength.js
10. data/element-quiz.js
11. data/life-graph-data.js
12. (existing renderer scripts...)
```

---

### Task 4.3: Build & Test
**Objective:** Build, run tests, verify no regressions

**Commands:**
```bash
npm run check:js          # Syntax check all JS
npm test                  # Run all tests
npm run build             # Build to dist/
```

**Verification:**
```bash
# Verify all data files in dist
ls dist/data/ | wc -l    # Should be 11+ (original 2 + 11 new)
# Verify dist size
du -sh dist/
# Verify index.html has all script refs
grep -c "data/" dist/index.html
```

---

### Task 4.4: Commit & Deploy
**Objective:** Push to GitHub → auto-deploy to CF Pages

**Commands:**
```bash
git add -A
git commit -m "feat(content): integrate 11 Obsidian content files into website

- Add 12 zodiac identities (archetypes, strengths, growth edges)
- Add 4 element 7-day practices
- Add 7 life periods (ทักษามหาอุติ) per birth day
- Add yearly transit predictions (5 domains)
- Add couple compatibility data
- Add Rahu/Ketu transit effects
- Add yearly enhancement guide
- Add auspicious timing (ฤกษ์ 9 + ยาม 8)
- Add planetary strength by birth month
- Add element quiz (10 questions)
- Add enriched life graph data
- Update all renderers with new data sources
- Add CSS for new content sections"

git push origin main
```

---

## 📋 Files to Create (11 new data files)

| # | File | Size Est. | Source Obsidian |
|---|---|---|---|
| 1 | `data/zodiac-identities.js` | ~15KB | content-วิธีปรับชีวิตตาม12ราศี.md |
| 2 | `data/element-practices.js` | ~6KB | content-วิธีปรับชีวิตตามธาตุทั้ง4.md |
| 3 | `data/life-periods.js` | ~8KB | content-ช่วงชีวิตตามทักษามหาอุติ.md |
| 4 | `data/yearly-transit.js` | ~7KB | content-จรประจำปีตามวันเกิด.md |
| 5 | `data/couple-compatibility.js` | ~4KB | content-ดูดวงคู่-ความเข้ากันได้.md |
| 6 | `data/rahu-ketu.js` | ~4KB | content-ราหูเกตุ-จุดพลิกชีวิต.md |
| 7 | `data/yearly-enhancement.js` | ~6KB | content-วิธีเสริมดวงประจำปีตามจร.md |
| 8 | `data/auspicious-timing.js` | ~6KB | content-ฤกษ์ยามตามวันเกิด.md |
| 9 | `data/planetary-strength.js` | ~5KB | content-กำลังพระเคราะห์ตามเดือนเกิด.md |
| 10 | `data/element-quiz.js` | ~8KB | data-แบบทดสอบธาตุ-คำถามผลลัพธ์.md |
| 11 | `data/life-graph-data.js` | ~5KB | data-กราฟชีวิต-7ช่วง5ด้าน.md |

## 📋 Files to Modify

| # | File | Changes |
|---|---|---|
| 1 | `index.html` | เพิ่ม 11 script tags สำหรับ data files ใหม่ |
| 2 | `js/renderer-individual.js` | อัพเดท rasi section, เพิ่ม yearly transit, rahu ketu, enhancement, planetary strength |
| 3 | `js/life-graph.js` | เพิ่ม life periods, enrich data |
| 4 | `js/reading-helpers.js` | อัพเดท coupleDharma rendering |
| 5 | `js/renderer-auspicious.js` | อัพเดทด้วยฤกษ์ยามข้อมูลใหม่ |
| 6 | `scripts/copy-static-assets.mjs` | เพิ่ม data files ใหม่ |
| 7 | `styles.css` | เพิ่ม CSS classes สำหรับเนื้อหาใหม่ |

## ⚠️ Pitfalls

1. **Build pipeline** — ทุกไฟล์ใหม่ต้องเพิ่มใน `copy-static-assets.mjs` มิฉะนั้น build ไม่ copy ไป dist
2. **Script load order** — data files ต้อง load ก่อน renderer scripts ที่ใช้ data นั้น
3. **Global vars** — ทุก data file ต้องประกาศเป็น global var (ไม่ใช้ ES modules)
4. **Content hash** — build script จะเพิ่ม hash ให้ไฟล์อัตโนมัติ ไม่ต้องแก้ index.html ด้วยมือ
5. **Free vs Premium** — เนื้อหาบางส่วนต้อง lock ไว้สำหรับ premium (ใช้ CSS class `freemium-blur` + `premium-gate`)
6. **Cosmic language** — ห้ามใช้ศัพท์ศาสนาพุทธ ใช้ cosmic tone เท่านั้น
7. **SPA fallback** — CF Pages serve index.html สำหรับทุก route ไม่ต้องแก้ vercel.json

## 🔓 Decisions (confirmed by user 16 มิ.ย. 69)

1. **Free/Premium split:** 🔒 ธาตุ+ราศี = ฟรี, จรปี+ฤกษ์+เสริมดวง+กำลังพระเคราะห์ = premium (ล็อค)
2. **UI layout:** ถ้าเนื้อหาใหม่ซ้ำกับเดิม → วิเคราะห์เทียบแล้ว merge เข้า section เดิม / ถ้าเป็นเนื้อหาใหม่ทั้งหมด → เปิดแท็ปใหม่
3. **Quiz:** Standalone page (ไม่ใช่ onboarding flow) — สร้าง `quiz.html` แยก

### 📐 UI Mapping (Merge vs New Tab)

| # | เนื้อหา Obsidian | Existing in Website | Decision | Action |
|---|---|---|---|---|
| 1 | 12 ราศีอัตลักษณ์ | `r.trait`/`r.apply` สั้น (line 820) | 🔀 **MERGE** | แทนที่ rasiHtml ด้วย full identity (strengths, growthEdge, replaceTable, wisdom) |
| 2 | ธาตุ 4 × แบบฝึก 7 วัน | `elementInsight`/`elementAction` สั้น (line 800) | 🔀 **MERGE** | เติม 7-day practice ลงใน "พิมพ์เขียวปรับฐานชีวิต" section ที่มีอยู่ |
| 3 | ทักษามหาอุติ (7 ช่วงชีวิต) | Life Graph (life-graph.js) — คำนวณจาก numerology | 🔀 **MERGE** | เพิ่ม tab "ช่วงชีวิต" ใน Life Graph section |
| 4 | จรประจำปี (แนวโน้ม 5 ด้าน) | monthlyLifeMap (หมอทักเดือน) — รายเดือน | 🆕 **NEW TAB** | เปิดแท็ปใหม่: "🔮 แนวโน้มชีวิตปีนี้" (premium) |
| 5 | ดูดวงคู่ compatibility table | coupleDharma (5 pair types) | 🔀 **MERGE** | เพิ่ม compatibility matrix ในคู่ section ที่มีอยู่ |
| 6 | ราหูเกตุ จุดพลิกชีวิต | `เกตุ` array สั้น (line 500) — เฉพาะเลข | 🆕 **NEW TAB** | เปิดแท็ปใหม่: "🌑 ราหูเกตุ — จุดพลิกชีวิต" |
| 7 | เสริมดวงประจำปี | ไม่มี | 🆕 **NEW TAB** | เปิดแท็ปใหม่: "✨ วิธีเสริมดวงปีนี้" (premium) |
| 8 | ฤกษ์ยาม | renderer-auspicious.js (มีอยู่แล้ว) | 🔀 **MERGE** | อัพเดทด้วยฤกษ์ 9 + ยาม 8 + ตารางวันดี/ระวัง |
| 9 | กำลังพระเคราะห์เดือนเกิด | ไม่มี | 🆕 **NEW TAB** | เปิดแท็ปใหม่: "🪐 กำลังวันประจำเดือนเกิด" (premium) |
| 10 | กราฟชีวิต enriched | life-graph.js (มีอยู่) | 🔀 **MERGE** | อัพเดท data tables ใน Life Graph |
| 11 | แบบทดสอบธาตุ | ไม่มี | 🔀 **STANDALONE** | สร้าง `quiz.html` แยก |

---

> **Plan saved:** 2026-06-16 @ `/home/kara/Starvia/.hermes/plans/2026-06-16_starvia-content-update.md`
