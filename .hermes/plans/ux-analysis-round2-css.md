# STARVIA CSS Design System & UX Analysis — Round 2

> **วันที่วิเคราะห์:** 16 มิถุนายน 2569
> **ไฟล์:** `styles.css` (5,434 บรรทัด / 173 KB)
> **เว็บไซต์:** starvia.website

---

## A) DESIGN SYSTEM ANALYSIS

### A1. CSS Custom Properties (`:root` Variables)

CSS variables ที่กำหนดไว้ใน `:root` (line 5):

| Variable | Value | หมายเหตุ |
|----------|-------|---------|
| `--g` | `#D6AD45` | สีทองหลัก (Gold Primary) |
| `--g2` | `#F4D987` | สีทองสว่าง (Gold Light) |
| `--g3` | `#8B6914` | สีทองเข้ม (Gold Dark) |
| `--pu` | `#8E72D8` | สีม่วง (Purple Accent) |
| `--bg` | `#09061c` | พื้นหลังหลัก (Dark Purple) |
| `--bg2` | `#120a2d` | พื้นหลังรอง (Darker Purple) |
| `--surface` | `rgba(37,24,68,.72)` | พื้นผิวการ์ด (Card Surface) |
| `--surface2` | `rgba(52,34,89,.82)` | พื้นผิวการ์ดรอง |
| `--tx` | `#F8F1DF` | สีข้อความหลัก (Light Cream) |
| `--tx2` | `#C9BDDF` | สีข้อความรอง (Muted Lavender) |
| `--br` | `rgba(214,173,69,.22)` | สี border (Gold Border) |
| `--cd` | `rgba(37,24,68,.62)` | สี background การ์ด |
| `--radius` | `24px` | Border radius หลัก |
| `--shadow` | `0 24px 70px rgba(0,0,0,.42)` | Shadow หลัก |

**ปัญหาที่พบ:**
1. **CSS Variables ไม่ได้ถูกใช้อย่างทั่วถึง** — มีค่าสี hardcoded หลายร้อยค่าในไฟล์ เช่น `#C9A227`, `#E8A0CF`, `#7a6a9a`, `#b8a8d8` ฯลฯ ไม่ได้อ้างอิงจาก variables
2. **ไม่มี spacing scale** — ไม่มี `--space-*` variables, ใช้ค่า hardcoded ทั่วไป (8px, 12px, 14px, 16px, 18px, 20px, 24px, 28px, 32px)
3. **ไม่มี typography scale** — ไม่มี `--font-*` หรือ `--text-*` variables, ขนาดตัวอักษร hardcoded ทั้งหมด
4. **ไม่มี transition variables** — ไม่มี `--transition-*` variables

### A2. Typography System

**Font Families ที่ใช้ (หลาย stack):**

| Stack | ใช้กับ |
|-------|--------|
| `"Sarabun", "Leelawadee UI", "Segoe UI", Tahoma, sans-serif` | Body text, inputs, buttons ทั่วไป |
| `"Chakra Petch", "Kanit", "Sarabun", sans-serif` | Headings หลัก (h1, hero, section titles) |
| `"Kanit", "Sarabun", "Leelawadee UI", sans-serif` | Kicker, pills, labels |
| `"Leelawadee UI", "Segoe UI", Tahoma, sans-serif` | Tabs, form inputs, buttons |
| `"Noto Serif Thai", Georgia, serif` | Mantra, quotes, price displays |
| `Georgia, "Times New Roman", serif` | Scores, watermarks, couple titles |
| `Chonburi, Kanit, serif` | Tarot card names, lucky numbers |
| `'Courier New', monospace` | Discount codes |

**ปัญหา:** มี font stack ที่แตกต่างกันถึง **8 แบบ** — ทำให้ดูไม่ consistent และยากต่อการ maintain

**Type Scale (ไม่มี modular scale):**

| ขนาด | ใช้กับ |
|------|--------|
| 9px | Kicker labels, tiny labels |
| 10px | Section titles, badges, meta |
| 11px | Descriptions, hints |
| 12px-13px | Body text, card content |
| 14px-15px | Card titles, section headers |
| 16px-17px | Sub-headings |
| 18px-20px | Section titles |
| 24px-28px | Big numbers, scores |
| 30px-42px | Hero headings (responsive clamp) |
| 58px-64px | Main hero, big scores |

**ปัญหา:** Font sizes ใช้ `px` ทั้งหมด — ไม่มี `rem` ทำให้ accessibility แย่ (users ไม่สามารถ zoom ได้ตามต้องการ)

### A3. Color System

**สีหลักที่ใช้ (นับจาก hardcoded values):**

```
ทอง/Amber:     #C9A227, #D6AD45, #F4D987, #8B6914, #f0d96a, #E8D48B, #ffd86b, #f0e6d3, #e8c547, #ffe99b
ม่วง/Purple:   #8E72D8, #5B3FA6, #913FA6, #A98FE8, #DDCEFF, #B4A1EA, #8B6CF6, #9B8AB8, #b4a1ea
ชมพู/Pink:     #E8A0CF, #F5D0E8, #C06080, #E8534A, #e8534a
เขียว/Green:   #4CAF50, #2ECC71, #6EC89A, #8ee68d, #4ade80, #70d47e
ส้ม/Orange:    #FF9800, #F5A623, #FFC107, #f0d96a
แดง/Red:       #E53935, #EF5350, #F44336
เทา/Purple-grey: #7a6a9a, #5a4a7a, #6a5a8a, #8c7bb3
```

**ปัญหา:** มีสีทองที่คล้ายกันมากกว่า **10 shades** ที่ใช้ในที่ต่างกัน — ทำให้ maintenance ยาก

### A4. Component Patterns

**Navigation (Mode Nav):**
- `.modenav` — Flex container แบบ nav bar
- `.mnb` — Mode button (with active state `.on`)
- ใช้ border-radius: 18px-24px
- Sticky on mobile (max-width: 720px)

**Cards (หลาย types):**

| Card Type | Class | จำนวน |
|-----------|-------|--------|
| Generic card | `.card` | 1 |
| Value card | `.value-card`, `.value-card.featured` | 2 |
| Preview card | `.preview-card` | 1 |
| Domain card | `.domain-card` | 1 |
| Karma card | `.karma-card` | 1 |
| Blueprint card | `.blueprint-card` | 1 |
| Matrix card | `.matrix-card` | 1 |
| Wellness card | `.wellness-card` | 1 |
| Action plan card | `.action-plan-card` | 1 |
| Conversion roadmap | `.conversion-roadmap` | 1 |
| Power card | `.power-card` | 1 |
| Dharma card | `.dharma-card` | 1 |
| Monthly life map | `.monthly-life-map` | 1 |
| Windfall luck | `.windfall-luck` | 1 |
| Daily fortune card | `.daily-fortune-card` (2 versions!) | 2 |
| Love destiny card | `.love-destiny-card` | 1 |
| Lottery card | `.lottery-card` | 1 |
| Life graph card | `.life-graph-card` | 1 |
| Reading snapshot | `.reading-snapshot` | 1 |
| Zodiac identity section | `.zi-section` | 1 |

**ปัญหา:** มี card types มากกว่า **20 แบบ** ที่มี style ซ้ำซ้อนกันมาก (background gradient เดียวกัน, border เดียวกัน, shadow เดียวกัน) แต่ไม่ได้ consolidate

**Buttons:**

| Button Type | Class | หมายเหตุ |
|-------------|-------|---------|
| Primary CTA | `.btn` | Gold gradient, full width |
| Secondary | `.rbtn` | Transparent, border only |
| PDF Premium | `.pdf-btn` | Animated shimmer |
| Conversion CTA | `.conversion-cta .cta-btn` | Gold shimmer |
| Hero Primary | `.hero-primary` | Gold gradient, pill shape |
| Hero Secondary | `.hero-secondary` | Border only |
| Lock CTA | `.lock-cta` | Gold gradient |
| Share button | `.share-btn` | Purple-tinted |
| Daily fortune CTA | `.dfc-btn` | Gold shimmer |
| Onboarding btn | `.ob-btn-primary`, `.ob-btn-secondary` | Gold gradient |
| Streak reward CTA | `.streak-reward-cta` | Gold gradient |
| Streak unlock btn | `.streak-unlock-btn` | Gold gradient |
| Discount btn | `.streak-discount-btn` | Gold gradient |
| Couple share btn | `.csc-btn-line`, `.csc-btn-copy` | Platform colored |
| Section toggle CTA | `.section-toggle-cta` | Small inline |
| Code copy | `.streak-code-copy` | Semi-transparent gold |
| Personal consult btn | `.pcc-btn` | Gold gradient |
| Cosmic event CTA | `.ceb-cta` | Gold gradient pill |

**ปัญหา:** มี button styles ที่แตกต่างกันถึง **18+ แบบ** — ส่วนใหญ่เป็น gold gradient แต่ padding, border-radius, font-size ต่างกันหมด

**Tabs:**
- `.tabs-w` — Wrapper (overflow-x auto)
- `.tabs` — Flex container
- `.tab` — Individual tab (pill shape, 50px radius)
- `.tab.on` — Active state

**Collapsible Sections (ได้รับการออกแบบอย่างดี):**
- `.collapsible-section` — Container
- `.section-toggle` — Header/trigger
- `.section-body` — Content
- `.collapsible-section.collapsed` — Collapsed card state
- มี shimmer animation, hover effects, CTA button
- **จุดเด่น:** Collapsed state แสดงเป็น card ที่สวยงาม, expanded state เป็น toggle sections

**Forms:**
- `.f` — Form field container
- `.f input`, `.f select` — Input styles
- `.ob-input` — Onboarding input (different style!)
- `.pin-input` — PIN input (another different style!)

**Modals:**
- `.modal-overlay` — Fixed overlay
- `.modal-content` — Modal box
- `.ob-overlay` — Onboarding overlay (different z-index!)
- `.streak-unlock-overlay` — Streak unlock overlay
- **ปัญหา:** z-index values ไม่ consistent (9999, 10000, 10001)

### A5. Responsive Design

**Breakpoints ที่ใช้:**

| Breakpoint | ใช้กับ |
|------------|--------|
| `max-width: 400px` | `.cgrid` → 2 columns |
| `max-width: 420px` | `.dg` → 4 columns, `.nowrap`, hero title |
| `max-width: 460px` | `.row` → 1 column |
| `max-width: 480px` | `.mlm-calendar` → 5 cols, `.awc-grid` → 4 cols, share buttons, many daily fortune mobile styles |
| `max-width: 500px` | `.wpc-actions` → 1 column |
| `max-width: 520px` | `.karma-grid` → 1 column, `.cr-steps` → 1 column, compact daily |
| `max-width: 560px` | `.ld-grid`, `.ld-two` → 1 column |
| `max-width: 620px` | `.df-details` → 1 column, `.rs-grid` → 1 column |
| `max-width: 640px` | `.domain-head-v2`, `.bp-hero` → 1 column, `.mlm-grid` → 1 column |
| `max-width: 720px` | **Main mobile breakpoint** — navbar sticky, hero font sizes, form adjustments, value/preview grids → 1 column |
| `max-width: 780px` | `.modenav` max-width |

**ปัญหา:** มี breakpoint ที่แตกต่างกันถึง **11 แบบ** ที่ไม่ได้อยู่ใน scale ที่สมเหตุสมผล เช่น 400, 420, 460, 480, 500, 520, 560 — ควรมี 3-4  breakpoints หลักเท่านั้น

**Mobile-First vs Desktop-First:** ใช้ approach **Desktop-First** (`max-width` media queries) ซึ่งไม่ใช่ best practice ปัจจุบัน

### A6. Animation & Transition Patterns

**Keyframe Animations (12 ตัว):**

| Animation | ใช้กับ |
|-----------|--------|
| `fu` | Card fade-up (opacity 0→1, translateY 15px→0) |
| `sh` | Gold shimmer (background-position shift) |
| `spin` | Loading spinner |
| `pg` | Pulse glow (box-shadow pulsing) |
| `radarIn` | Radar chart fade-in |
| `polygonDraw` | Polygon opacity |
| `shimmer` | Skeleton loading |
| `skeletonFadeIn` | Skeleton fade |
| `skeletonPulse` | Skeleton pulse dots |
| `revealChild` | Scroll reveal children |
| `zodiac-glow` | Zodiac icon glow |
| `gemini-glow` | Gemini specific glow |
| `cardShimmer` | Collapsed card shimmer |
| `bpSymbolPulse` | Blueprint symbol pulse |
| `pulse` | Generic pulse (opacity) |
| `pulse-glow` | Lock icon pulse |
| `livePulse` | Live dot pulse |
| `testimonialIn` | Testimonial slide-in |
| `gkSlideUp` | Badge notification slide |
| `gkFadeOut` | Badge notification fade |
| `sparkleGlow` | Sparkle effect |
| `sparkleFloat` | Sparkle float |
| `obFadeIn` | Onboarding fade |
| `obCardIn` | Onboarding card slide |
| `coupleGlow` | Couple mode glow |
| `heartRise` | Floating hearts |
| `lp-pulse` | Life period dot pulse |
| `lp-glow` | Now badge glow |

**CSS Transitions:** ส่วนใหญ่ใช้ `transition: all .25s` หรือ `transition: all .3s`

**ปัญหา:** `transition: all` เป็น anti-pattern — ทำให้ transition ทุก property รวมถึง ones ที่ไม่ต้องการ, performance แย่ลง

---

## B) VISUAL HIERARCHY

### B1. Sections ที่มี Visual Hierarchy แข็งแกร่ง

1. **Premium Landing Hero** (`.premium-hero`) — มี clamp font-size, gradient text, brand promise
2. **Daily Fortune Card** (`.daily-fortune-card`) — มี header/body/footer structure ชัดเจน
3. **Collapsible Sections** — มี collapsed/expanded states ที่แตกต่างกันชัดเจน
4. **Windfall Luck Card** — มี radial gradient, strong gold accent, visual punch
5. **Onboarding Journey** — มี overlay + card + progress bar ที่ชัดเจน

### B2. Sections ที่ดู Flat/Samey

1. **Report content sections ทั้งหมด** (zi-*, ep-*, lp-*, yt-*, rk-*, ye-*, ps-*, cc-*, at-*) — ทุก sections ใช้ style เดียวกันคือ `padding: 16px`, `rgba(255,255,255,0.03)` background — ไม่มี visual differentiation
2. **Domain cards** ทุก 6 ด้าน — หน้าตาเหมือนกันหมด ไม่มีสี/icon ที่แตกต่างกัน
3. **Form elements** — inputs ทุกตัวหน้าตาเหมือนกัน ไม่มี visual feedback ที่ชัดเจน
4. **Tab content** — แทบทุก tab มีหน้าตาเดียวกัน

### B3. Color Usage Patterns

**Overuse:**
- สีทอง (`#C9A227` และ variants) ถูกใช้ในแทบทุก component — headings, buttons, borders, backgrounds, accents — ทำให้ดู monotonous
- `rgba(201,162,39,*)` ปรากฏในทุกๆ 2-3 บรรทัด

**Underuse:**
- สีเขียว (`#4CAF50`, `#2ECC71`) ใช้น้อยมาก (แทบไม่เห็น)
- สีชมพูใช้เฉพาะ love/romance sections
- สีส้ม/amber สำหรับ warnings ใช้น้อย

### B4. Typography Scale

**ไม่มี modular scale ที่ชัดเจน:**

| Level | Actual Sizes | ปัญหา |
|-------|-------------|--------|
| H1 (Hero) | clamp(34px,7vw,58px) → clamp(42px,6vw,64px) | ดี — responsive |
| H2 (Section) | clamp(22px,3vw,30px) → clamp(24px,3.2vw,32px) | ดี |
| H3 (Card) | 18-20px | OK |
| H4 (Sub-section) | 15-16px | เกือบเท่า body |
| Body | 12.5-14.5px | ค่อนข้างเล็ก |
| Small/Meta | 9-11px | เล็กมาก |

**ปัญหา:** ขนาดตัวอักษร `9-10px` ถูกใช้บ่อยมาก — น้อยกว่า WCAG recommended minimum (12px effective)

---

## C) COMPONENT ANALYSIS

### C1. Card Designs

**Card Styles ที่พบ (สรุป):**

1. **`.card`** — Generic card: `border-radius: 24px`, `backdrop-filter: blur(18px)`, gradient background, `::before` overlay
2. **`.rb`** (Report Block) — Simple card: `border-radius: 12px`, solid background
3. **`.ci`** (Compact Item) — `border-radius: 9px`, tiny card
4. **`.ci2`** — Variant of ci
5. **Specialty cards** — karma-card, blueprint-card, domain-matrix, matrix-card, etc.

**Common Pattern:**
```
background: linear-gradient(145deg, rgba(X,Y,Z,A), rgba(X2,Y2,Z2,B))
border: 1px solid rgba(201,162,39, 0.15-0.35)
border-radius: 14-24px
padding: 16-24px
box-shadow: 0 10-24px 30-40px rgba(0,0,0,0.25-0.5)
```

**ปัญหา:** ทุก card ใช้ gradient background + gold border + deep shadow — ไม่มี visual hierarchy ที่แตกต่างกัน

### C2. Button Styles

**Primary CTA Pattern:**
```
background: linear-gradient(135deg, var(--g), var(--g3))
color: #05030f
border-radius: 11-14px
font-weight: 700
animation: pg (pulse glow)
```

**Pill Button Pattern (newer):**
```
border-radius: 50px / 999px
background: linear-gradient(90deg, #C9A227, #f0d96a, #C9A227)
animation: sh (shimmer)
```

**ปัญหา:** มี button patterns ที่แตกต่างกัน 2-3 แบบ สำหรับ gold CTA — `border-radius: 11px` vs `50px` vs `999px`

### C3. Form Elements

**3 different input styles:**

1. **`.f input`** — หลัก: `border-radius: 14px`, `padding: 13px 14px`
2. **`.ob-input`** — Onboarding: `border-radius: 10px`, `padding: 12px 16px`
3. **`.pin-input`** — PIN: `border-radius: 8px`, `padding: 12px`, centered text

**ปัญหา:** 3 form styles ที่แตกต่างกัน, ไม่มี consistent focus states (บางตัวมี box-shadow, บางตัวไม่มี)

### C4. Modal/Overlay Patterns

**4 different overlay systems:**

1. **`.modal-overlay`** — z-index: 9999, backdrop-filter: blur(5px)
2. **`.ob-overlay`** — z-index: 10000, background: rgba(8,8,24,0.95)
3. **`.streak-unlock-overlay`** — z-index: 10000, background: rgba(0,0,0,0.7)
4. **`.gk-notification`** — z-index: 10001 (toast notification)

**ปัญหา:** z-index war — 9999 → 10000 → 10001 → (lbtn at 999) → (modenav at 20)

### C5. Collapsible Section Design

**จุดเด่น:** Collapsible sections (lines 1815-1983) ได้รับการออกแบบอย่างพิถีพิถัน:
- Collapsed state แสดงเป็น elegant card
- Expanded state มี header + body structure
- มี shimmer effect เมื่อ hover
- มี CTA button ที่ปรากฏตอน hover
- Smooth animation ด้วย cubic-bezier

**นี่คือ component ที่ดีที่สุดในระบบ**

---

## D) MOBILE UX

### D1. Touch Targets

**ปัญหาสำคัญ:**
- `.tab` buttons: `padding: 7px 14px` + `font-size: 12.5px` = touch target ~36px (ไม่ถึง 48px minimum)
- `.share-btn`: `padding: 8px 14px` = touch target ~38px
- `.rbtn`: `padding: 8px 22px` = touch target ~38px
- `.awc-day`: `padding: 8px 2px` = touch target ~34px (way too small)
- `.df-lucky-num`: `width: 32px, height: 32px` = touch target 32px (too small)

**Minimum recommended:** 44px (Apple HIG) หรือ 48px (Material Design)

### D2. Scroll Behavior

- `html { scroll-behavior: smooth }` — ดี
- ไม่มี `scroll-snap` สำหรับ horizontal scroll sections
- `.tabs-w { overflow-x: auto }` — ไม่มี scroll indicators

### D3. Fixed/Sticky Elements

| Element | Position | z-index |
|---------|----------|---------|
| `#lbtn` (language button) | `fixed top:14px right:14px` | 999 |
| `.modenav` (mobile) | `sticky top:8px` | 20 |
| `.ob-banner` | `sticky top:0` | 9999 |
| `.gk-notification` | `fixed bottom:20px` | 10001 |
| `.modal-overlay` | `fixed inset:0` | 9999 |

**ปัญหา:** `.modenav` sticky z-index 20 ต่ำกว่า `#lbtn` z-index 999 — ถ้า scroll ลงมา navbar จะอยู่ใต้ปุ่ม

### D4. Content Density on Mobile

**ปัญหา:**
- Font sizes เล็กมากบน mobile (9-10px) — อ่านยาก
- Grids ที่มี 3 columns ถูก responsive เป็น 1 column ได้ดี
- แต่ card padding บาง card ยังใหญ่เกินไปบน mobile (`padding: 24px`)
- `.brow` (info bar) มี `max-width: min(100%,560px)` ซึ่งดี

---

## E) ISSUES FOUND

### E1. Design Inconsistencies

1. **Duplicate selectors:**
   - `.love-blueprint` นิยาม 2 ครั้ง (line 309-339 และ line 777-783) — ครั้งที่ 2 override ครั้งแรก
   - `.daily-fortune-card` นิยาม 2 ครั้ง (line 2277 และ line 2543) — ครั้งที่ 2 override ครั้งแรก
   - `.df-header` นิยาม 2 ครั้ง (line 2278 และ line 2564) — different styles!
   - `.df-date` นิยาม 2 ครั้ง (line 2281 และ line 2582)
   - `.df-item` นิยาม 2 ครั้ง
   - `.df-item-label` นิยาม 2 ครั้ง
   - `.detail-tabs-card` นิยาม 2 ครั้ง (line 1280 และ line 2127)
   - `.detail-tabs-head` นิยาม 2 ครั้ง
   - `.tab` นิยาม 2 ครั้ง (line 48-49 และ line 2090-2124)
   - `.lock-preview-text` นิยาม 2 ครั้ง (line 2780-2834 และ line 4580-4598)
   - `.mlm-omen` นิยาม 2 ครั้ง
   - `.mlm-phase-up/stable/warn` นิยาม 2 ครั้ง
   - `.mlm-lucky-day` นิยาม 2 ครั้ง

2. **Hardcoded colors แทน CSS variables:**
   - `#C9A227` ปรากฏ ~150+ ครั้ง (แทน `var(--g)`)
   - `#b8a8d8` ปรากฏ ~40+ ครั้ง
   - `#7a6a9a` ปรากฏ ~30+ ครั้ง
   - `#E8A0CF` ปรากฏ ~20+ ครั้ง
   - `rgba(201,162,39,*)` ปรากฏ ~200+ ครั้ง

3. **Font-family inconsistencies:** 8 different stacks ดังกล่าวข้างต้น

4. **Border-radius inconsistencies:**
   - Cards: 14px, 16px, 18px, 20px, 22px, 24px
   - Buttons: 8px, 10px, 11px, 12px, 14px, 30px, 50px, 50px, 999px
   - Inputs: 8px, 10px, 14px

5. **Padding inconsistencies:** ใช้ค่าต่างกันมาก: 3px, 5px, 7px, 8px, 9px, 10px, 11px, 12px, 13px, 14px, 15px, 16px, 18px, 20px, 22px, 24px, 28px, 32px, 40px

### E2. Dead/Redundant CSS

**Duplicate Definitions (สิ้นเปลือง bandwidth):**
- estimated **~500-700 lines** เป็น duplicate definitions
- หลาย selector มี override กันเอง — browser ต้อง parse ทั้งหมด

**Potential unused selectors (จากการวิเคราะห์ patterns):**
- `.ob-banner-anticipation` — ไม่เห็น usage pattern ชัดเจน
- `.ob-reading-celebrate`, `.ob-sparkle-row` — onboarding specific, อาจไม่ได้ใช้บ่อย
- `.rk-table`, `.rk-row-current` — rahu/ketu enhanced section
- `.lottery-waiting`, `.lottery-empty` — edge states

### E3. Specificity Issues

**!important usage:**
```css
.el-bar-item:hover { background: ... !important; }  /* line 285 */
.dharma-chip { color: var(--g2) !important; }        /* line 1731 */
.domain-warning strong { color: #FF9800 !important; } /* line 1481 */
.domain-remedy strong { color: #4CAF50 !important; }  /* line 1484 */
.domain-dhamma-remedy > strong { color: #ffd36a !important; } /* line 1544 */
```

**CSS Cascade Issues:**
- `#load-txt` (line 112) ไม่มี styles (dead reference?)
- `.tab` ถูก redefine ที่ line 2090 หลังจาก line 48

### E4. Performance Concerns

1. **File size:** 173 KB (5,434 lines) — ใหญ่มากสำหรับ CSS file เดียว
2. **No minification** — ไฟล์ original ไม่ได้ minify
3. **`backdrop-filter: blur()`** — ใช้บ่อยมาก, performance impact บน mobile Safari
4. **`transition: all`** — ใช้ ~20+ ครั้ง — performance overhead
5. **Multiple `@keyframes`** — มี 28+ keyframe animations, หลายตัวไม่ได้ใช้
6. **`will-change`** — ใช้แค่ใน `.reveal` (line 124) — ควรใช้มากขึ้นสำหรับ animated elements
7. **No `content-visibility: auto`** — สำหรับ off-screen sections
8. **Gradient backgrounds ซ้ำซ้อน** — หลาย cards ใช้ gradient เดียวกันแต่เขียนใหม่ทุกครั้ง
9. **`box-shadow: var(--shadow)`** — ค่า `0 24px 70px rgba(0,0,0,.42)` หนักมาก สำหรับทุก card
10. **Filter effects** — `.blur(6px)` สำหรับ locked content ไม่ได้optimize

---

## F) TOP 5 UI RECOMMENDATIONS

### 🏆 #1: Consolidate CSS Variables & Create Design Tokens (Impact: HIGH)

**ปัญหา:** มี hardcoded values หลายร้อยค่า, ไม่มี design tokens

**แก้ไข:**

```css
/* === ขยาย :root === */
:root {
  /* Colors — consolidate gold shades */
  --g: #D6AD45;
  --g2: #F4D987;
  --g3: #8B6914;
  --g-bg: rgba(201,162,39,.08);
  --g-border: rgba(201,162,39,.22);
  --g-border-active: rgba(201,162,39,.58);
  
  /* Purple scale */
  --pu: #8E72D8;
  --pu-light: #B4A1EA;
  --pu-bg: rgba(142,114,216,.08);
  --pu-border: rgba(142,114,216,.15);
  
  /* Pink scale */
  --pk: #E8A0CF;
  --pk-light: #F5D0E8;
  --pk-bg: rgba(232,160,207,.08);
  
  /* Semantic colors */
  --success: #2ECC71;
  --warning: #FF9800;
  --danger: #EF5350;
  
  /* Text hierarchy */
  --tx: #F8F1DF;
  --tx2: #C9BDDF;
  --tx-muted: #7a6a9a;
  
  /* Spacing scale (4px base) */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 32px;
  
  /* Typography scale (rem) */
  --text-xs: 0.6875rem;   /* 11px */
  --text-sm: 0.8125rem;   /* 13px */
  --text-base: 0.9375rem; /* 15px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.5rem;      /* 24px */
  --text-2xl: 2rem;       /* 32px */
  --text-hero: clamp(2.5rem, 6vw, 4rem);
  
  /* Border radius scale */
  --r-sm: 8px;
  --r-md: 14px;
  --r-lg: 18px;
  --r-xl: 24px;
  --r-pill: 999px;
  
  /* Shadows */
  --shadow-sm: 0 4px 12px rgba(0,0,0,.2);
  --shadow-md: 0 8px 24px rgba(0,0,0,.3);
  --shadow-lg: 0 16px 40px rgba(0,0,0,.4);
  
  /* Transitions */
  --ease: cubic-bezier(.4,0,.2,1);
  --duration: .25s;
  --duration-slow: .4s;
}
```

**ผลลัพธ์:** ลด hardcoded values ได้ ~300+ ค่า, ปรับเปลี่ยน theme ได้ง่าย

---

### 🥈 #2: Standardize Button System (Impact: HIGH)

**ปัญหา:** มี button styles 18+ แบบ, ไม่ consistent

**แก้ไข:**

```css
/* === Button System === */
.btn {
  /* Shared base */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;        /* Touch target */
  padding: 12px 24px;
  border: none;
  border-radius: var(--r-pill);
  font-family: "Kanit", "Sarabun", sans-serif;
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: .04em;
  cursor: pointer;
  transition: transform var(--duration) var(--ease),
              box-shadow var(--duration) var(--ease);
}

/* Primary (Gold) */
.btn-primary {
  background: linear-gradient(135deg, var(--g), var(--g3));
  color: #080415;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

/* Secondary (Ghost) */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--g-border);
  color: var(--tx);
}
.btn-secondary:hover { background: var(--g-bg); }

/* Small variant */
.btn-sm {
  min-height: 36px;
  padding: 8px 16px;
  font-size: var(--text-xs);
}

/* Full width */
.btn-block { width: 100%; }

/* Disabled */
.btn:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }
```

**ผลลัพธ์:** ลด button classes จาก 18+ เหลือ ~5, touch target 44px ทุกปุ่ม

---

### 🥉 #3: Standardize Breakpoints (Impact: MEDIUM-HIGH)

**ปัญหา:** มี 11 breakpoints ที่ไม่สมเหตุสมผล

**แก้ไข:**

```css
/* === ใช้ 3 breakpoints หลัก === */

/* Mobile: < 480px */
/* Tablet: 481-768px */
/* Desktop: > 768px */

/* ลบ breakpoints เล็กๆ ที่ไม่จำเป็น:
   - 400px → ใช้ 480px แทน
   - 420px → ใช้ 480px แทน
   - 460px → ใช้ 480px แทน
   - 500px → ใช้ 480px หรือ 520px แทน
   - 520px → ใช้ 480px หรือ 560px แทน
   - 560px → ใช้ 480px หรือ 640px แทน
   - 620px → ใช้ 640px แทน
   - 640px → ใช้ 640px (keep)
   - 720px → ใช้ 768px แทน
   */

/* Example: รวม media queries */
@media (max-width: 480px) {
  /* All small mobile styles */
  .row { grid-template-columns: 1fr; }
  .dg { grid-template-columns: repeat(4, 1fr); }
  .cgrid { grid-template-columns: repeat(2, 1fr); }
  /* ...etc */
}

@media (min-width: 481px) and (max-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 769px) {
  /* Desktop styles */
}
```

**ผลลัพธ์:** ลด media queries จาก ~30+ แห่ง เหลือ ~15 แห่ง, maintain ง่ายขึ้น

---

### #4: Extract Reusable Card Patterns (Impact: MEDIUM)

**ปัญหา:** มี card types 20+ แบบ, ซ้ำซ้อนกันมาก

**แก้ไข:**

```css
/* === Base Card System === */
.card {
  background: linear-gradient(145deg, var(--surface), rgba(14,8,35,.78));
  border: 1px solid var(--g-border);
  border-radius: var(--r-xl);
  backdrop-filter: blur(18px);
  padding: var(--sp-6);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

/* Card variants */
.card--compact { padding: var(--sp-4); border-radius: var(--r-lg); }
.card--flat { backdrop-filter: none; box-shadow: none; }
.card--featured { border-color: var(--g-border-active); }
.card--pink { border-color: rgba(232,160,207,.3); }

/* Card inner patterns */
.card__kicker {
  /* ใช้ร่วมกันสำหรับ kicker labels ทุก card */
  display: inline-block;
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: var(--g-bg);
  color: var(--g);
  font-size: var(--text-xs);
  letter-spacing: .18em;
  text-transform: uppercase;
  margin-bottom: var(--sp-3);
}

.card__title {
  /* ใช้ร่วมกันสำหรับ card titles */
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--tx);
  margin-bottom: var(--sp-2);
}

.card__desc {
  font-size: var(--text-sm);
  color: var(--tx2);
  line-height: 1.7;
}

.card__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-2);
}
```

**ผลลัพธ์:** ลด duplicated card CSS จาก ~500 lines เหลือ ~150 lines

---

### #5: Improve Mobile Touch Targets & Accessibility (Impact: MEDIUM)

**ปัญหา:** Touch targets เล็กเกินไป, font sizes เล็กมาก

**แก้ไข:**

```css
/* === Mobile Touch Improvements === */
@media (max-width: 480px) {
  /* Minimum touch target */
  .tab, .rbtn, .share-btn, .btn,
  .section-toggle, .cr-step,
  .wpc-action, .el-bar-item {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Font size minimum */
  .ci-l, .ci-s, .ci2l, .dlv,
  .df-item-label, .df-lucky-label,
  .dm-lbl, .kricker,
  .el-label, .el-bar-name,
  .bp-label, .domain-subtitle,
  .atc-subtitle, .awc-day-name {
    font-size: 11px;  /* min readable */
  }
  
  /* Increase padding on interactive items */
  .awc-day { padding: 10px 4px; }
  .df-lucky-num { width: 40px; height: 40px; }
  .di { padding: 10px 4px; }
}
```

**ผลลัพธ์:** Touch targets 44px ทุก interactive element, font sizes ไม่ต่ำกว่า 11px

---

## SUMMARY MATRIX

| Category | Score | ปัญหาหลัก |
|----------|-------|-----------|
| Design System | ⭐⭐ (2/5) | ไม่มี tokens, hardcoded values เต็มไปหมด |
| Visual Hierarchy | ⭐⭐⭐ (3/5) | Hero/Hero sections ดี, content sections แบน |
| Component Consistency | ⭐⭐ (2/5) | 20+ card types, 18+ button types |
| Responsive Design | ⭐⭐⭐ (3/5) | Breakpoints มากเกินไป แต่ responsive logic ใช้ได้ |
| Animation | ⭐⭐⭐⭐ (4/5) | Rich animations, skeleton loading ดี |
| Mobile UX | ⭐⭐ (2/5) | Touch targets เล็ก, font sizes เล็ก |
| Performance | ⭐⭐ (2/5) | 173KB CSS, backdrop-filter บ่อย, no minification |
| Accessibility | ⭐⭐ (2/5) | px units, small fonts, ไม่มี focus styles ชัดเจน |

**Priority Actions:**
1. 🥇 Consolidate CSS variables + design tokens
2. 🥈 Standardize button system
3. 🥉 Reduce breakpoints to 3 main ones
4. 🏅 Extract reusable card patterns
5. 🏅 Fix mobile touch targets + accessibility
