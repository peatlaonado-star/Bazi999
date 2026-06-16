# 📋 STARVIA UX Restructuring Plan — แผนปรับโครงสร้าง UX ฉบับสมบูรณ์

> **วันที่:** 16 มิถุนายน 2569
> **แหล่งข้อมูล:** UX Analysis Round 1 + Round 1B + Round 2 (CSS + HTML/Interaction)
> **เป้าหมาย:** ลดความซับซ้อน เพิ่ม Conversion และ Accessibility
> **ขนาดโค้ดเดิม:** ~700KB source, 13,800+ บรรทัด

---

## SECTION 1: สรุปภาพรวม (Executive Summary)

### 1.1 ปัญหาหลักทั้งหมดที่พบ (รวม Round 1 + Round 2)

| # | หมวด | ปัญหา | ความรุนแรง |
|---|------|-------|-----------|
| 1 | Content | **Information Overload** — รายงานมี 20+ sections ทำให้ผู้ใช้เลื่อนผ่านไม่อ่าน | 🔴 ร้ายแรง |
| 2 | Content | **Paywall กระจายเกินไป** — CTA ล็อค 7 จุด ทำให้รู้สึก "ถูกขาย" ตลอดเวลา | 🔴 ร้ายแรง |
| 3 | Content | **Sections ซ้ำกัน 4 คู่** — เนื้อหาทับซ้อนกัน ไม่ได้ consolidate | 🟡 ปานกลาง |
| 4 | Content | **ไม่มี Navigation / ToC** — ผู้ใช้ไม่รู้ว่ามี section อะไรบ้าง | 🟡 ปานกลาง |
| 5 | Content | **Free/Premium ไม่สมดุล** — บางส่วนฟรีมากเกินไป บางส่วนล็อคเร็วเกินไป | 🟡 ปานกลาง |
| 6 | CSS | **ไม่มี Design Tokens** — hardcoded values หลายร้อยค่า ไม่มี CSS variables ที่ครอบคลุม | 🔴 ร้ายแรง |
| 7 | CSS | **Button Styles 18+ แบบ** — ส่วนใหญ่ gold gradient แต่ padding, radius, font ต่างกันหมด | 🟡 ปานกลาง |
| 8 | CSS | **Card Types 20+ แบบ** — background gradient เดียวกัน แต่เขียนใหม่ทุกครั้ง | 🟡 ปานกลาง |
| 9 | CSS | **Breakpoints 11 แบบ** — ไม่สมเหตุสมผล (400, 420, 460, 480, 500, 520, 560…) | 🟡 ปานกลาง |
| 10 | CSS | **CSS File ขนาดใหญ่** — 173KB / 5,434 บรรทัด ไม่ได้ minify | 🟡 ปานกลาง |
| 11 | CSS | **Hardcoded Colors 150+ ค่า** — `#C9A227` ปรากฏ ~150 ครั้งแทน `var(--g)` | 🟡 ปานกลาง |
| 12 | CSS | **Font Stacks 8 แบบ** — ทำให้ดูไม่ consistent | 🟡 ปานกลาง |
| 13 | CSS | **Transition: all anti-pattern** — ใช้ ~20+ ครั้ง ทำให้ performance แย่ | 🟡 ปานกลาง |
| 14 | CSS | **Touch targets เล็กเกินไป** — tab, share-btn ~36px (ไม่ถึง 44px minimum) | 🟡 ปานกลาง |
| 15 | Interaction | **ไม่มี Form Validation Feedback** — ผู้ใช้ไม่รู้ว่าทำไมปุ่มกดไม่ได้ | 🔴 ร้ายแรง |
| 16 | Interaction | **Label/Select ID Mismatch** — `<label for="g2">` vs `<select id="g2x">` | 🔴 ร้ายแรง |
| 17 | Interaction | **ไม่มี Focus Management** — report โหลดแล้ว focus ไม่ย้าย, modal ไม่มี focus trap | 🔴 ร้ายแรง |
| 18 | Interaction | **ไม่มี ARIA Live Regions** — screen readers ไม่รู้เมื่อ content เปลี่ยน | 🟡 ปานกลาง |
| 19 | Interaction | **Tabs ไม่มี Keyboard Navigation** — ไม่มี arrow key support | 🟡 ปานกลาง |
| 20 | Interaction | **Collapsible Sections ไม่มี aria-expanded** | 🟡 ปานกลาง |
| 21 | Technical | **Streak System ซ้ำกัน** — daily-fortune.js + streak-tracker.js ใช้ค่าคนละตัว | 🔴 ร้ายแรง |
| 22 | Technical | **escapeHTML() ซ้ำกัน 3 สำเนา** — regex vs DOM-based ต่างกัน | 🟡 ปานกลาง |
| 23 | Technical | **32 Script Files ไม่มี Code Splitting** — โหลดทุกอย่างแม้ใช้แค่ Mode 0 | 🟡 ปานกลาง |
| 24 | Technical | **Canvas Animation รันตลอด** — 80 ดาว animate ทุกหน้า ไม่ respect prefers-reduced-motion | 🟡 ปานกลาง |
| 25 | Technical | **STARVIA_CONFIG ซ้ำกัน** — defined twice, second overrides first | 🟡 ปานกลาง |
| 26 | Technical | **Duplicate CSS Selectors** — `.love-blueprint`, `.daily-fortune-card`, `.tab` ฯลฯ นิยาม 2 ครั้ง | 🟡 ปานกลาง |
| 27 | Technical | **Premium Price Hardcoded หลายที่** — 199/เดือน, 159/เดือน กระจาย | 🟡 ปานกลาง |
| 28 | Technical | **Daily Fortune ↔ Report ไม่มีทางกลับ** — Dead end | 🟡 ปานกลาง |
| 29 | Technical | **Vinai ↔ Fortune ไม่เชื่อม** — เสีย free content engagement | 🟢 เล็กน้อย |
| 30 | Technical | **Lottery ↔ Lucky Numbers ไม่เชื่อม** — เสีย engagement | 🟢 เล็กน้อย |

### 1.2 คะแนนภาพรวม (Before)

| หมวด | คะแนน | หมายเหตุ |
|------|--------|---------|
| **Content** | ⭐⭐ (2/5) | 20+ sections, ซ้ำซ้อน, paywall กระจาย |
| **CSS Design System** | ⭐⭐ (2/5) | ไม่มี tokens, hardcoded เต็มไปหมด |
| **Interaction** | ⭐⭐⭐ (3/5) | Smooth animations, แต่ไม่มี validation/error states |
| **Accessibility** | ⭐⭐ (2/5) | Basic ARIA มีบ้าง, ไม่มี focus management, keyboard nav |
| **Performance** | ⭐⭐ (2/5) | 173KB CSS, 32 scripts, canvas รันตลอด, ไม่มี code splitting |
| **Mobile UX** | ⭐⭐ (2/5) | Touch targets เล็ก, font sizes เล็ก |

### 1.3 คะแนนเป้าหมาย (After)

| หมวด | คะแนนเป้าหมาย | วิธีวัด |
|------|---------------|---------|
| **Content** | ⭐⭐⭐⭐ (4/5) | 8-10 sections, paywall 3 จุด, navigation ชัดเจน |
| **CSS Design System** | ⭐⭐⭐⭐ (4/5) | Design tokens ครบ, hardcoded < 20 ค่า |
| **Interaction** | ⭐⭐⭐⭐ (4/5) | Form validation, error states, keyboard nav |
| **Accessibility** | ⭐⭐⭐⭐ (4/5) | Focus management, ARIA live, keyboard nav ครบ |
| **Performance** | ⭐⭐⭐ (3/5) | Code splitting, CSS minified, canvas opt |
| **Mobile UX** | ⭐⭐⭐⭐ (4/5) | Touch targets ≥44px, font ≥11px |

### 1.4 เป้าหมายสูงสุดของแผนนี้

1. **ลด sections จาก 20+ เหลือ 8-10 sections** —合并 sections ซ้ำกัน, ลบ sections ที่ไม่แข็งแกร่ง
2. **ลด paywall จาก 7 จุด เหลือ 3 จุด** — ใช้หลัก "Problem-First": แสดงปัญหาฟรี, ขายทางแก้
3. **สร้าง Design Tokens** — hardcoded values ลดจาก 500+ เหลือ < 20
4. **เพิ่ม Navigation** — floating ToC + cross-section linking
5. **แก้ Accessibility** — focus management, keyboard nav, ARIA live
6. **Optimize Performance** — code splitting, CSS minify, canvas opt

---

## SECTION 2: โครงสร้างรายงานใหม่ (New Report Structure)

### 2.1 แผนผัง Sections ใหม่ (合并 20+ → 9 Sections)

| # | ชื่อ Section | เนื้อหา (รวมจาก) | ฟรี/ล็อค | ตำแหน่ง | เริ่มต้น |
|---|-------------|-------------------|-----------|---------|---------|
| 1 | **🔮 พิมพ์เขียวชะตาของคุณ** (Blueprint Hero) | Blueprint Card + ดาวเจ้าชะตา + ราศี + ลัคนา | ฟรี | บนสุด | เปิด |
| 2 | **📊 กราฟชีวิต + ช่วงชีวิต** (Life Blueprint) | กราฟชีวิต + ทักษามหาอุติ (合并) | ฟรี | ใต้ Hero | เปิด |
| 3 | **🎯 คัมภีร์แก้ดวง 6 ด้าน** (Domain Guide) | คัมภีร์แก้ดวง 6 ด้าน + หมอทักประจำเดือน (合并) | แสดงปัญหาฟรี / ล็อคทางแก้ | ใต้ Life Graph | เปิด |
| 4 | **✨ เสริมดวงของคุณ** (Power Up) | พลังงานเสริมดวง + วิธีเสริมดวงปีนี้ (合并) + กำลังวัน | ฟรีบางส่วน / ล็อคบางส่วน | กลาง | เปิด |
| 5 | **👤 ตัวตน · ความสัมพันธ์ · การงาน · เงิน** (Detail Tabs) | Detail Tabs (合并 กับ กำลังวันเดือนเกิด) | ตัวตน + การงาน ฟรี / คู่ + เงิน ล็อค | กลาง | พับ |
| 6 | **🎲 สูตรเปิดดวงลาภลอย** (Windfall Luck) | สูตรเปิดดวงลาภลอย | ล็อคบางส่วน | ท้าย | พับ |
| 7 | **💘 ตารางเข้ากันได้ธาตุ** (Compatibility) | ตารางเข้ากันได้ธาตุ | ฟรี | ท้าย | พับ |
| 8 | **🌑 ราหูเกตุ + แนวโน้มปีนี้** (Rahu-Ketu + Trends) | ราหูเกตุ + แนวโน้มชีวิตปีนี้ (合并) | ฟรีบางส่วน | ท้าย | พับ |
| 9 | **💎 ปลดล็อกรายงานเต็ม** (CTA Final) | CTA สุดท้าย + Social Proof | CTA | ท้ายสุด | — |

### 2.2 Sections ที่ถูก合并/ลบ

| Sections เดิม | → Sections ใหม่ | เหตุผล |
|--------------|----------------|--------|
| กราฟชีวิต + ทักษามหาอุติ | → **กราฟชีวิต + ช่วงชีวิต** | ทั้งคู่พูดถึง "ช่วงชีวิต" ต่างกันแค่ศาสตร์ |
| คัมภีร์ 6 ด้าน + หมอทักประจำเดือน | → **คัมภีร์แก้ดวง 6 ด้าน** | ทั้งคู่พูดถึง "ด้านชีวิต" ต่างกันแค่ช่วงเวลา |
| พลังงานเสริมดวง + วิธีเสริมดวงปีนี้ | → **เสริมดวงของคุณ** | ทั้งคู่ให้ "สีมงคล/เลขมงคล" ต่างกันแค่ช่วงเวลา |
| กำลังวันประจำตัว + กำลังวันเดือนเกิด | → ย้ายเข้า Detail Tabs | ทั้งคู่พูดถึง "พลังดาว" ต่างกันแค่ระดับ |
| ราหูเกตุ + แนวโน้มชีวิตปีนี้ | → **ราหูเกตุ + แนวโน้มปีนี้** | ทั้งคู่พูดถึง "ดวงอนาคต" |
| กระจกกรรม | → ลบ หรือรวมเข้า Blueprint | ไม่ได้แสดงคุณค่าที่ชัดเจน |

### 2.3 User Flow ใหม่

```
เปิดเว็บ
  │
  ├─→ เห็นฟอร์มกรอกข้อมูล (Hero + benefit statement)
  │     │
  │     ├─→ เห็นตัวอย่างรายงาน (social proof above the fold)
  │     │
  │     └─→ กด "เปิดดวงชะตา"
  │           │
  │           └─→ Skeleton Loader (Illusion of Labor 3.2s)
  │                 │
  │                 └─→ 🔮 พิมพ์เขียวชะตา (Hero Section)
  │                       │
  │                       ├─→ 📊 กราฟชีวิต + ช่วงชีวิต (เปิดอยู่)
  │                       │     │
  │                       │     └─→ [CTA จุดที่ 1] "ดูวิธีแก้ดวงครบทุกด้าน"
  │                       │
  │                       ├─→ 🎯 คัมภีร์แก้ดวง 6 ด้าน (เปิดอยู่)
  │                       │     │
  │                       │     ├─→ แสดงปัญหาฟรี (คะแนน + สถานะ 6 ด้าน)
  │                       │     └─→ ล็อค "วิธีแก้" + "จังหวะ 15 ปี"
  │                       │
  │                       ├─→ ✨ เสริมดวงของคุณ (เปิดอยู่)
  │                       │
  │                       ├─→ 👤 ตัวตน · คู่ · การงาน · เงิน (พับ)
  │                       │
  │                       ├─→ 🎲 สูตรลาภลอย (พับ)
  │                       │
  │                       ├─→ 💘 ตารางธาตุ (พับ)
  │                       │
  │                       ├─→ 🌑 ราหูเกตุ + แนวโน้ม (พับ)
  │                       │
  │                       └─→ 💎 [CTA จุดที่ 2] "ปลดล็อกรายงานเต็ม"
  │                             │
  │                             └─→ [CTA จุดที่ 3] ท้ายรายงาน
  │
  └─→ กลับฟอร์ม (reset)
```

### 2.4 เปรียบเทียบ ก่อน/หลัง

| มิติ | ก่อน | หลัง |
|------|------|------|
| จำนวน Sections | 20+ sections | 9 sections |
| Paywall จุด | 7 จุด | 3 จุด |
| Sections ซ้ำกัน | 4 คู่ | 0 คู่ (合并 แล้ว) |
| Navigation | ไม่มี | Floating ToC + Cross-section links |
| Collapsed Sections | 10+ sections | 4 sections (ส่วนที่ไม่ใช่ hero) |
| Free Content 价值 | ไม่สมดุล | Problem-First (แสดงปัญหาฟรี) |
| CTA ที่ซ้ำกัน | Daily Fortune CTA + Premium Preview + Price Anchor | เหลือ 3 CTA หลัก |

---

## SECTION 3: Paywall Strategy ใหม่

### 3.1 หลักการ "Problem-First"

> **แสดงปัญหาฟรี → ขายทางแก้**

แทนที่จะล็อคเนื้อหาทั้งหมด ให้แสดง **"ปัญหา"** ของผู้ใช้ฟรี แล้วล็อค **"ทางแก้"** ไว้ขาย Premium

**ตัวอย่าง:**
- คัมภีร์ 6 ด้าน → แสดงคะแนน 6 ด้าน + สถานะ "อ่อนแอ" **ฟรี** → ล็อค "วิธีแก้" + "จังหวะ 15 ปี" **Premium**
- Detail Tabs → แสดง "ตัวตน" + "การงาน" **ฟรี** → ล็อค "คู่สัมพันธ์" + "การเงิน" **Premium**

### 3.2 แผน Paywall 3 จุด (จาก 7)

```
จุดที่ 1: หลัง Hero Section (Blueprint)
├── ข้อความ: "นี่คือพิมพ์เขียวชะตาของคุณ 🔮 ปลดล็อกรายงานเต็มเพื่อดูวิธีแก้ดวง"
├── ปุ่ม: "อ่านรายงานเต็ม · 199 บาท/เดือน"
├── Social proof: "94% บอกว่า 'ตรงจนตกใจ'"
└── ราคา anchoring: "590 → 199 บาท/เดือน"

จุดที่ 2: หลัง Life Graph + Domain Guide
├── ข้อความ: "คุณมีจุดอ่อนซ่อนอยู่ 🔒 ดูวิธีแก้ดวงครบทุกด้าน"
├── ปุ่ม: "ดูวิธีแก้ดวงของคุณ · 199 บาท/เดือน"
└── Teaser: "คัมภีร์แก้ดวง 6 ด้าน — เฉพาะปัญหา ทางแก้ล็อคอยู่"

จุดที่ 3: ท้ายรายงาน
├── ข้อความ: "รายงานนี้เป็นเพียงส่วนเล็กๆ 🔓 ปลดล็อกรายงานเต็ม"
├── ปุ่ม: "ปลดล็อกรายงานเต็ม · 199 บาท/เดือน"
└── สรุป: "รายงานเต็มมี 40+ หัวข้อ ที่ออกแบบมาเพื่อคุณ"
```

### 3.3 Free vs Premium Content Map ใหม่

| Section | Free Content | Premium Content |
|---------|-------------|-----------------|
| 🔮 Blueprint Hero | ดาวเจ้าชะตา + ราศี + ลัคนา + สรุป | — (ฟรีทั้งหมด) |
| 📊 Life Graph | Timeline จุดเปลี่ยน + Energy bar | — (ฟรีทั้งหมด) |
| 🎯 Domain Guide | คะแนน 6 ด้าน + สถานะ (อ่อน/กลาง/แข็ง) | วิธีแก้ + จังหวะ 15 ปี + หมอทักครบทุกด้าน |
| ✨ Power Up | สีมงคล + เลขมงคล (basic) | พิธีเสริมดวง + วิธีใช้ + กำลังวันละเอียด |
| 👤 Detail Tabs | ตัวตน + การงาน | คู่สัมพันธ์ + การเงิน |
| 🎲 Windfall Luck | เลขนำโชค 3 ตัว (จาก daily fortune) | สูตรเปิดดวงลาภลอย + พิธี + คาถา |
| 💘 Compatibility | ตารางเข้ากันได้ธาตุ 4×4 | — (ฟรีทั้งหมด) |
| 🌑 Rahu-Ketu | ราหูเกตุสรุป | แนวโน้มชีวิตปีนี้ + วิธีแก้ราหู |
| 💎 CTA | — | — |

### 3.4 สิ่งที่เปลี่ยนจากเดิม

| ก่อน | หลัง | เหตุผล |
|------|------|--------|
| หมอทัก ล็อค 4/5 domains | แสดง 6 ด้านฟรี, ล็อคทางแก้ | ให้เห็น "ปัญหา" ก่อน แล้วขาย "ทางแก้" |
| Detail Tabs ฟรีทั้งหมด | ล็อค คู่ + เงิน | ฟรีมากเกินไป ไม่ต้องซื้อ premium |
| ทักษามหาอุติ ฟรีทั้งหมด | รวมเข้า Life Graph, ฟรีบางส่วน | ให้คุณค่าเยอะจนไม่ต้องซื้อ |
| กระจกกรรม ล็อคทั้งหมด | ลบ หรือรวมเข้า Blueprint | ไม่ได้แสดงคุณค่าที่ชัดเจน |
| Premium Preview Summary | ลบออก | CTA กระจายเกินไป |
| Premium Price Anchor | ลบออก | ราคาแสดงบ่อยเกินไป |
| Daily Fortune CTA | ลบออก (เหลือ link เล็กๆ) | CTA กระจายเกินไป |

---

## SECTION 4: CSS Refactoring Plan

### 4.1 Design Tokens ที่ต้องสร้าง

สร้างใน `:root` ของ `styles.css`:

```css
/* === COLORS === */
:root {
  /* Gold scale */
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
  
  /* Background */
  --bg: #09061c;
  --bg2: #120a2d;
  --surface: rgba(37,24,68,.72);
  --surface2: rgba(52,34,89,.82);
  --cd: rgba(37,24,68,.62);
  
  /* === SPACING (4px base) === */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 20px;
  --sp-6: 24px;
  --sp-8: 32px;
  --sp-10: 40px;
  
  /* === TYPOGRAPHY (rem) === */
  --text-xs: 0.6875rem;    /* 11px */
  --text-sm: 0.8125rem;    /* 13px */
  --text-base: 0.9375rem;  /* 15px */
  --text-lg: 1.125rem;     /* 18px */
  --text-xl: 1.5rem;       /* 24px */
  --text-2xl: 2rem;        /* 32px */
  --text-hero: clamp(2.5rem, 6vw, 4rem);
  
  /* Font families (ลดจาก 8 เหลือ 3) */
  --font-body: "Sarabun", "Leelawadee UI", "Segoe UI", Tahoma, sans-serif;
  --font-heading: "Chakra Petch", "Kanit", "Sarabun", sans-serif;
  --font-display: "Noto Serif Thai", Georgia, serif;
  
  /* === BORDER RADIUS === */
  --r-sm: 8px;
  --r-md: 14px;
  --r-lg: 18px;
  --r-xl: 24px;
  --r-pill: 999px;
  
  /* === SHADOWS === */
  --shadow-sm: 0 4px 12px rgba(0,0,0,.2);
  --shadow-md: 0 8px 24px rgba(0,0,0,.3);
  --shadow-lg: 0 16px 40px rgba(0,0,0,.4);
  
  /* === TRANSITIONS === */
  --ease: cubic-bezier(.4,0,.2,1);
  --duration: .25s;
  --duration-slow: .4s;
  
  /* === Z-INDEX SCALE === */
  --z-nav: 100;
  --z-modal: 1000;
  --z-notification: 1100;
  --z-overlay: 1200;
}
```

**เป้าหมาย:** ลด hardcoded values จาก 500+ เหลือ < 20 ค่า

### 4.2 Breakpoint Consolidation (11 → 3)

| Breakpoints เดิม | → Breakpoints ใหม่ | หมายเหตุ |
|-----------------|-------------------|---------|
| 400, 420, 460px | **480px** | รวมเป็น mobile breakpoint เดียว |
| 480, 500, 520px | **480px** | |
| 560, 620, 640px | **640px** | Tablet breakpoint |
| 720, 780px | **768px** | Desktop breakpoint |

```css
/* === 3 Breakpoints หลัก === */
/* Mobile: < 480px */
/* Tablet: 481-768px */
/* Desktop: > 768px */

@media (max-width: 480px) {
  /* รวม styles จาก 400, 420, 460, 480, 500, 520px */
  .row { grid-template-columns: 1fr; }
  .dg { grid-template-columns: repeat(4, 1fr); }
  .cgrid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 481px) and (max-width: 768px) {
  /* รวม styles จาก 560, 620, 640, 720px */
}

@media (min-width: 769px) {
  /* Desktop styles */
}
```

**เป้าหมาย:** ลด media queries จาก ~30+ แห่ง เหลือ ~15 แห่ง

### 4.3 Button Standardization (18+ → 5)

```css
/* === Button System === */

/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;        /* Touch target */
  padding: 12px 24px;
  border: none;
  border-radius: var(--r-pill);
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: 700;
  letter-spacing: .04em;
  cursor: pointer;
  transition: transform var(--duration) var(--ease),
              box-shadow var(--duration) var(--ease);
}

/* 1. Primary (Gold) — ใช้กับ CTA หลัก */
.btn-primary {
  background: linear-gradient(135deg, var(--g), var(--g3));
  color: #080415;
}
.btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }

/* 2. Secondary (Ghost) — ใช้กับปุ่มรอง */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--g-border);
  color: var(--tx);
}
.btn-secondary:hover { background: var(--g-bg); }

/* 3. Small — ใช้กับ inline actions */
.btn-sm {
  min-height: 36px;
  padding: 8px 16px;
  font-size: var(--text-xs);
}

/* 4. Full Width — ใช้กับ mobile CTA */
.btn-block { width: 100%; }

/* 5. Disabled */
.btn:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }
```

**Mapping จาก classes เดิม:**

| Classes เดิม | → Class ใหม่ |
|-------------|-------------|
| `.btn`, `.hero-primary`, `.conversion-cta .cta-btn`, `.lock-cta`, `.dfc-btn`, `.ob-btn-primary`, `.streak-reward-cta`, `.streak-unlock-btn`, `.pcc-btn`, `.ceb-cta` | `.btn-primary` |
| `.rbtn`, `.hero-secondary` | `.btn-secondary` |
| `.pdf-btn`, `.share-btn` | `.btn-sm` |
| `.streak-discount-btn`, `.streak-code-copy` | `.btn-sm.btn-secondary` |
| `.csc-btn-line`, `.csc-btn-copy` | `.btn-sm` (platform colored variant) |
| `.section-toggle-cta` | `.btn-sm.btn-secondary` |

**เป้าหมาย:** ลด button classes จาก 18+ เหลือ 5

### 4.4 Card Pattern Extraction (20+ → 1 base + 5 variants)

```css
/* === Base Card === */
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

/* === Card Variants === */
.card--compact { padding: var(--sp-4); border-radius: var(--r-lg); }
.card--flat { backdrop-filter: none; box-shadow: none; background: var(--surface); }
.card--featured { border-color: var(--g-border-active); }
.card--pink { border-color: rgba(232,160,207,.3); }
.card--danger { border-color: rgba(239,83,80,.3); }

/* === Card Inner Patterns === */
.card__kicker {
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
  font-family: var(--font-heading);
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
```

**Mapping จาก card classes เดิม:**

| Card Classes เดิม | → Class ใหม่ |
|-------------------|-------------|
| `.value-card`, `.preview-card`, `.power-card`, `.dharma-card` | `.card` |
| `.domain-card`, `.karma-card`, `.matrix-card`, `.wellness-card` | `.card.card--compact` |
| `.blueprint-card`, `.action-plan-card` | `.card.card--featured` |
| `.love-destiny-card`, `.love-blueprint` | `.card.card--pink` |
| `.daily-fortune-card`, `.life-graph-card`, `.lottery-card` | `.card` |
| `.reading-snapshot`, `.monthly-life-map` | `.card.card--compact` |

**เป้าหมาย:** ลด duplicated card CSS จาก ~500 lines เหลือ ~150 lines

### 4.5 Additional CSS Fixes

| ปัญหา | วิธีแก้ |
|--------|--------|
| Hardcoded `#C9A227` 150+ ครั้ง | แทนด้วย `var(--g)` |
| `transition: all` 20+ ครั้ง | เปลี่ยนเป็น `transition: transform var(--duration) var(--ease), box-shadow var(--duration) var(--ease)` |
| Font sizes 9-10px | เพิ่มเป็น 11px minimum |
| Touch targets < 44px | เพิ่ม min-height: 44px ทุก interactive element |
| `.tab` นิยาม 2 ครั้ง | ลบ definition ที่ line 2090-2124 (ใช้ต้นฉบับที่ line 48) |
| `.love-blueprint` นิยาม 2 ครั้ง | ลบ definition ที่ line 777-783 |
| `.daily-fortune-card` นิยาม 2 ครั้ง | ลบ definition ที่ line 2277 (ใช้ต้นฉบับที่ line 2543) |
| `.detail-tabs-card` นิยาม 2 ครั้ง | ลบ definition ที่ line 1280 |
| `!important` 5 แห่ง | แก้ specificity แทนการใช้ `!important` |
| `.ob-overlay` z-index 10000 | ใช้ `var(--z-overlay)` |
| `.gk-notification` z-index 10001 | ใช้ `var(--z-notification)` |
| `.modal-overlay` z-index 9999 | ใช้ `var(--z-modal)` |

---

## SECTION 5: Interaction Improvements

### 5.1 Floating Navigation / ToC Design

```
┌──────────────────────────────────────────────┐
│  🔮 พิมพ์เขียว  📊 กราฟ  🎯 คัมภีร์  ✨ เสริม  👤 ตัวตน  │
│  ═══════════════════════════════════════════  │  ← Progress bar
└──────────────────────────────────────────────┘
```

**ตำแหน่ง:** Sticky ด้านบน, ปรากฏหลัง scroll ผ่าน Hero Section

**CSS:**
```css
.toc-nav {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  background: rgba(9,6,28,.95);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--g-border);
  padding: 8px 16px;
  overflow-x: auto;
  white-space: nowrap;
  display: flex;
  gap: 12px;
  align-items: center;
}

.toc-nav a {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  color: var(--tx2);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  transition: background var(--duration) var(--ease),
              color var(--duration) var(--ease);
}

.toc-nav a:hover,
.toc-nav a.active {
  background: var(--g-bg);
  color: var(--g);
}

.toc-progress {
  height: 2px;
  background: var(--g);
  position: absolute;
  bottom: 0;
  left: 0;
  transition: width var(--duration) var(--ease);
}
```

**Implementation:**
```javascript
// แสดง toc-nav หลัง scroll ผ่าน Hero
window.addEventListener('scroll', function() {
  var toc = document.querySelector('.toc-nav');
  var hero = document.querySelector('.hd');
  if (window.scrollY > hero.offsetHeight) {
    toc.classList.add('visible');
  } else {
    toc.classList.remove('visible');
  }
  
  // Update active state
  var sections = document.querySelectorAll('[data-toc]');
  sections.forEach(function(section) {
    var rect = section.getBoundingClientRect();
    if (rect.top <= 100 && rect.bottom > 100) {
      document.querySelector('.toc-nav a.active').classList.remove('active');
      document.querySelector('.toc-nav a[href="#' + section.id + '"]').classList.add('active');
    }
  });
});
```

### 5.2 Cross-Section Linking Map

| จาก | → ไปที่ | วิธีเชื่อม |
|-----|--------|-----------|
| Life Graph (จุดเปลี่ยนชีวิต) | Domain Guide (คัมภีร์ 6 ด้าน) | "ดูวิธีแก้ดวงสำหรับช่วงอายุนี้ →" |
| Domain Guide (คะแนน 6 ด้าน) | Detail Tabs (ตัวตน·การงาน) | "ดูรายละเอียดด้านนี้ →" |
| Domain Guide | Life Graph | "ดูกราฟชีวิตของคุณ →" |
| Detail Tabs (ตัวตน) | Power Up (เสริมดวง) | "เสริมดวงด้านนี้ด้วยสีมงคล →" |
| Daily Fortune | Life Graph | "ดูกราฟชีวิตของคุณ →" |
| Daily Fortune | Vinai Section | "💡 กิจกรรมเสริมดวงวันนี้" |
| Lottery | Daily Fortune (เลขนำโชค) | "เลขนำโชคของคุณตรงกับสลากหรือไม่?" |
| Streak Reward (ใกล้ 7 วัน) | Premium Lock | "ครบ 7 วัน? รับ Premium ฟรี 1 วัน!" |

**Implementation:** ใช้ anchor links + scroll-to-section
```javascript
function scrollToSection(sectionId) {
  var section = document.getElementById(sectionId);
  if (section) {
    var offset = document.querySelector('.toc-nav').offsetHeight + 16;
    window.scrollTo({
      top: section.offsetTop - offset,
      behavior: 'smooth'
    });
  }
}
```

### 5.3 Focus Trap + Keyboard Navigation

**Tarot Modal Focus Trap:**
```javascript
function trapFocus(modal) {
  var focusable = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  var first = focusable[0];
  var last = focusable[focusable.length - 1];
  
  modal.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    if (e.key === 'Escape') closeTarot();
  });
  
  first.focus();
}
```

**Tab Keyboard Navigation:**
```javascript
// Arrow key navigation for tabs
document.querySelectorAll('[role="tablist"]').forEach(function(tablist) {
  var tabs = tablist.querySelectorAll('[role="tab"]');
  
  tablist.addEventListener('keydown', function(e) {
    var currentIndex = Array.from(tabs).indexOf(document.activeElement);
    var newIndex;
    
    if (e.key === 'ArrowRight') {
      newIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    }
    
    if (newIndex !== undefined) {
      e.preventDefault();
      tabs[newIndex].focus();
      tabs[newIndex].click();
    }
  });
});
```

**Focus After Report Loads:**
```javascript
function focusReadingResult() {
  var result = document.getElementById('r0');
  if (result) {
    result.setAttribute('tabindex', '-1');
    result.focus();
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

### 5.4 Accessibility Fixes

| ปัญหา | วิธีแก้ | ไฟล์ |
|--------|--------|------|
| Mode nav ไม่มี `aria-pressed` | เพิ่ม `aria-pressed` ทุกปุ่ม mode | `index.html` |
| Form ไม่มี `aria-required` | เพิ่ม `aria-required="true"` ที่ required fields | `index.html` |
| Collapsible ไม่มี `aria-expanded` | เพิ่ม `aria-expanded` ทุก toggle + toggle content | `ui-actions.js` |
| Tabs ไม่มี ARIA semantics | เพิ่ม `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected` | `renderer-shared.js` |
| Loading ไม่มี `aria-live` | เพิ่ม `<div aria-live="polite">` สำหรับ loading status | `index.html` |
| Canvas ไม่มี pause | เพิ่ม `prefers-reduced-motion` check | `app.js` |
| Report ไม่มี focus | เพิ่ม focus management หลัง report loads | `renderer-individual.js` |
| Footer ไม่มี semantic | เปลี่ยน `<div>` เป็น `<footer>` + `role="contentinfo"` | `index.html` |
| Label/Select mismatch | เปลี่ยน `<select id="g2x">` เป็น `<select id="g2">` | `index.html` |
| ไม่มี skip navigation | เพิ่ม `<a href="#r0" class="sr-only sr-only-focusable">ข้ามไปยังรายงาน</a>` | `index.html` |

**ARIA Live Region:**
```html
<!-- เพิ่มในหน้าเว็บ -->
<div id="sr-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>
```
```javascript
function announce(message) {
  var el = document.getElementById('sr-announcer');
  if (el) el.textContent = message;
}
// เรียกใช้: announce('กำลังโหลดรายงาน...'), announce('รายงานพร้อมแล้ว')
```

---

## SECTION 6: Technical Debt

### 6.1 Duplicate Code to Consolidate

| Code | ไฟล์ที่ซ้ำกัน | วิธีแก้ |
|------|-------------|--------|
| `escapeHTML()` | `daily-fortune.js`, `renderer-shared.js`, `onboarding.js` (3 สำเนา) | ย้ายไป `reading-helpers.js` เป็น single source of truth |
| `escapeHtml()` | `renderer-shared.js` (DOM-based) | ใช้ version เดียวกัน (DOM-based ดีกว่า regex) |
| `getLS()` | 4+ ไฟล์ | ย้ายไป `reading-helpers.js` |
| `safeJSON()` | 4+ ไฟล์ | ย้ายไป `reading-helpers.js` |
| `getTodayKey()` | หลายไฟล์ | ย้ายไป `reading-helpers.js` |
| `seededRandom()` | หลายไฟล์ | ย้ายไป `reading-helpers.js` |
| `updateStreak()` | `daily-fortune.js` | ลบออก ใช้ `StreakReward` (streak-tracker.js) เป็น single source |
| Streak badges | `daily-fortune.js` + `onboarding.js` | ใช้ render จากที่เดียวเท่านั้น |
| Premium price | `renderer-shared.js` + `onboarding.js` | สร้าง config object เก็บราคาทั้งหมดในที่เดียว |
| Social proof counter | `daily-fortune.js` + `social-proof.js` | ใช้ counter เดียว |
| `STARVIA_CONFIG` | `index.html` line 26-31 + line 292-296 | ลบตัวที่สองออก (ตัวแรกถูก override) |
| `html2canvas.min.js` | `index.html` head + `dist/assets/` | ลบตัวที่ซ้ำกัน |

### 6.2 Performance Improvements

| ปัญหา | วิธีแก้ | ผลกระทบ |
|--------|--------|---------|
| **32 scripts ไม่มี code splitting** | Dynamic import สำหรับ Mode 1-2 (couple/auspicious) | ลด initial payload ~40% |
| **CSS 173KB ไม่ได้ minify** | Minify + extract critical CSS inline | ลด first paint time |
| **Canvas animation รันตลอด** | เพิ่ม `prefers-reduced-motion` check + debounce resize | ลด battery drain บน mobile |
| **Google Fonts blocking** | เพิ่ม `font-display: swap` + preconnect | ลด render blocking |
| **No `<link rel="preload">`** | Preload critical CSS + fonts | ลด perceived load time |
| **`backdrop-filter: blur()` บ่อย** | ลดการใช้, ใช้ fallback background แทน | เพิ่ม performance บน mobile Safari |
| **No `content-visibility: auto`** | เพิ่มสำหรับ off-screen sections | ลด rendering cost |
| **Data files loaded eagerly** | Lazy load `cosmic-events-generated.js`, `thai-astrology-content.js` | ลด initial payload |
| **No WebP/AVIF images** | สร้าง WebP alternatives + `<picture>` elements | ลด image payload |
| **QR payment image ไม่มี lazy loading** | เพิ่ม `loading="lazy"` + width/height | ลด initial load |

**Code Splitting Implementation:**
```javascript
var loadedModes = {};

function loadMode(mode) {
  if (loadedModes[mode]) return Promise.resolve();
  
  var scripts = {
    0: ['js/renderer-individual.js'],
    1: ['js/renderer-couple.js', 'data/couple-compatibility.js'],
    2: ['js/renderer-auspicious.js', 'data/auspicious-timing.js']
  };
  
  return Promise.all((scripts[mode] || []).map(function(src) {
    return new Promise(function(resolve) {
      var script = document.createElement('script');
      script.src = src + '?v=2.0.2';
      script.defer = true;
      script.onload = resolve;
      document.body.appendChild(script);
    });
  })).then(function() { loadedModes[mode] = true; });
}
```

### 6.3 Bug Fixes

| Bug | ที่พบ | วิธีแก้ |
|-----|------|--------|
| **Label/Select ID mismatch** | `<label for="g2">` vs `<select id="g2x">` | เปลี่ยน `<select id="g2x">` เป็น `<select id="g2">` |
| **STARVIA_CONFIG override** | Defined twice in index.html (line 26 + 292) | ลบ definition ที่ line 292 |
| **Version string mismatch** | `tab-teaser-v1` vs `v=2.0.2` | ปรับเป็น version เดียวกัน |
| **initDailyMantra() called before DOM ready** | ui-actions.js line 84 | ย้ายไป DOMContentLoaded |
| **restorePremiumStatus() at load** | ui-actions.js line 196 | ย้ายไป user interaction trigger |
| **Gender option IDs unused** | `g0m`, `g0f`, `g0o` | ลบ dead code |
| **Duplicate `.love-blueprint`** | Line 309 + line 777 | ลบตัวที่ line 777 |
| **Duplicate `.daily-fortune-card`** | Line 2277 + line 2543 | ลบตัวที่ line 2277 |
| **Duplicate `.tab`** | Line 48 + line 2090 | ลบตัวที่ line 2090 |
| **Footer inline styles** | index.html | ย้ายไป CSS classes |
| **No `<noscript>`** | index.html | เพิ่ม `<noscript>` fallback |

---

## SECTION 7: Implementation Phases

### Phase 1: Quick Wins (1-2 วัน)
> ทำได้เลย ไม่ต้อง refactor มาก

| # | Task | ไฟล์ | ผลกระทบ |
|---|------|------|--------|
| 1 | **แก้ Label/Select ID mismatch** — เปลี่ยน `<select id="g2x">` เป็น `<select id="g2">` | `index.html` | 🔴 bug fix |
| 2 | **ลบ STARVIA_CONFIG ซ้ำ** — ลบ definition ที่ line 292 | `index.html` | 🟡 bug fix |
| 3 | **ลบ Duplicate CSS Selectors** — `.love-blueprint`, `.daily-fortune-card`, `.tab`, `.detail-tabs-card` | `styles.css` | 🟡 ลด ~200 lines |
| 4 | **แก้ Version String** — เปลี่ยน `tab-teaser-v1` เป็น `v=2.0.2` | `index.html` | 🟢 consistency |
| 5 | **ลบ Gender Option IDs** — `g0m`, `g0f`, `g0o` | `index.html` | 🟢 dead code |
| 6 | **เพิ่ม `<noscript>`** — fallback message | `index.html` | 🟢 accessibility |
| 7 | **ย้าย Footer inline styles** ไป CSS classes | `index.html` + `styles.css` | 🟢 maintainability |
| 8 | **เพิ่ม `aria-required="true"`** ที่ required fields | `index.html` | 🟢 accessibility |
| 9 | **เพิ่ม `loading="lazy"`** ที่ QR payment image | `index.html` | 🟢 performance |
| 10 | **เพิ่ม `prefers-reduced-motion`** สำหรับ canvas | `app.js` | 🟢 accessibility + performance |

### Phase 2: Content Restructuring (3-5 วัน)
> merge sections + paywall

| # | Task | ไฟล์ | ผลกระทบ |
|---|------|------|--------|
| 1 | **合并 กราฟชีวิต + ทักษามหาอุติ** | `renderer-individual.js`, `life-graph.js` | 🔴 ลด sections |
| 2 | **合并 คัมภีร์ 6 ด้าน + หมอทัก** | `renderer-individual.js` | 🔴 ลด sections |
| 3 | **合并 พลังงานเสริม + วิธีเสริมดวง** | `renderer-individual.js` | 🔴 ลด sections |
| 4 | **合并 ราหูเกตุ + แนวโน้มปีนี้** | `renderer-individual.js` | 🟡 ลด sections |
| 5 | **ลบ Premium Preview Summary** | `renderer-shared.js` | 🔴 ลด paywall จุด |
| 6 | **ลบ Premium Price Anchor** | `renderer-shared.js` | 🔴 ลด paywall จุด |
| 7 | **ลบ Daily Fortune CTA** (เหลือ link เล็กๆ) | `daily-fortune.js` | 🟡 ลด paywall จุด |
| 8 | **ปรับ Free/Premium Balance** — แสดง domain 6 ด้านฟรี, ล็อคทางแก้ | `renderer-individual.js` | 🔴 Problem-First |
| 9 | **ล็อค Detail Tabs** — ล็อค "คู่" + "เงิน" | `renderer-shared.js` | 🟡 Premium balance |
| 10 | **สร้าง Premium Config Object** — เก็บราคา/offer ทั้งหมดในที่เดียว | `new: config.js` | 🟡 maintainability |
| 11 | **เพิ่ม Cross-Section Links** | `renderer-individual.js` | 🟡 UX |
| 12 | **ปรับ Collapsed States** — 3 sections แรกเปิด, ที่เหลือพับ | `renderer-individual.js` | 🟡 UX |

### Phase 3: CSS Refactoring (5-7 วัน)
> design tokens + breakpoints

| # | Task | ไฟล์ | ผลกระทบ |
|---|------|------|--------|
| 1 | **สร้าง Design Tokens** — เพิ่ม CSS variables ครบถ้วน | `styles.css` | 🔴 foundation |
| 2 | **Replace Hardcoded Colors** — `#C9A227` → `var(--g)` 150+ แห่ง | `styles.css` | 🔴 maintainability |
| 3 | **Consolidate Breakpoints** — 11 → 3 | `styles.css` | 🟡 maintainability |
| 4 | **Standardize Buttons** — 18+ → 5 classes | `styles.css` | 🟡 consistency |
| 5 | **Extract Card Patterns** — 20+ → 1 base + 5 variants | `styles.css` | 🟡 consistency |
| 6 | **Fix `transition: all`** — เปลี่ยนเป็น specific properties | `styles.css` | 🟡 performance |
| 7 | **Fix Font Sizes** — minimum 11px ทุกที่ | `styles.css` | 🟡 accessibility |
| 8 | **Fix Touch Targets** — minimum 44px ทุก interactive element | `styles.css` | 🟡 mobile UX |
| 9 | **Fix `!important`** — แก้ specificity แทน | `styles.css` | 🟡 maintainability |
| 10 | **Consolidate Font Stacks** — 8 → 3 | `styles.css` | 🟡 consistency |
| 11 | **Minify CSS** — build step | build | 🟡 performance |
| 12 | **Add `content-visibility: auto`** สำหรับ off-screen sections | `styles.css` | 🟢 performance |

### Phase 4: Interaction + A11y (3-5 วัน)
> navigation + focus + keyboard

| # | Task | ไฟล์ | ผลกระทบ |
|---|------|------|--------|
| 1 | **สร้าง Floating ToC Navigation** | `index.html` + `styles.css` + `ui-actions.js` | 🔴 navigation |
| 2 | **เพิ่ม Progress Bar** | `ui-actions.js` | 🟡 UX |
| 3 | **แก้ Form Validation Feedback** — visual error messages | `index.html` + `app.js` + `styles.css` | 🔴 UX |
| 4 | **เพิ่ม Focus Trap** สำหรับ Tarot modal | `tarot-ui.js` | 🔴 accessibility |
| 5 | **เพิ่ม Escape Key** สำหรับ modal close | `tarot-ui.js` | 🟡 accessibility |
| 6 | **เพิ่ม ARIA Live Regions** — loading status, streak counter | `index.html` + multiple JS | 🟡 accessibility |
| 7 | **เพิ่ม Tab ARIA Semantics** — `role="tablist"`, `role="tab"`, `aria-selected` | `renderer-shared.js` | 🟡 accessibility |
| 8 | **เพิ่ม Keyboard Navigation** — arrow keys สำหรับ tabs | `renderer-shared.js` | 🟡 accessibility |
| 9 | **เพิ่ม `aria-expanded`** สำหรับ collapsible sections | `ui-actions.js` | 🟡 accessibility |
| 10 | **เพิ่ม Focus Management** หลัง report loads | `renderer-individual.js` | 🟡 accessibility |
| 11 | **เพิ่ม Skip Navigation Link** | `index.html` | 🟢 accessibility |
| 12 | **Fix Footer** — เปลี่ยน `<div>` เป็น `<footer>` + `role="contentinfo"` | `index.html` | 🟢 accessibility |

### Phase 5: Performance (2-3 วัน)
> code splitting + optimization

| # | Task | ไฟล์ | ผลกระทบ |
|---|------|------|--------|
| 1 | **Code Splitting** — Dynamic import สำหรับ Mode 1-2 | `app.js` | 🔴 ลด payload ~40% |
| 2 | **Consolidate Utility Functions** — `escapeHTML`, `getLS`, `safeJSON` → `reading-helpers.js` | Multiple JS files | 🟡 maintainability |
| 3 | **ลบ Duplicate Streak System** — ใช้ `StreakReward` เป็น single source | `daily-fortune.js` | 🔴 bug fix |
| 4 | **Canvas Optimization** — `prefers-reduced-motion` + debounce resize | `app.js` | 🟡 battery |
| 5 | **Lazy Load Data Files** — `cosmic-events-generated.js`, `thai-astrology-content.js` | `index.html` | 🟡 payload |
| 6 | **Preconnect Google Fonts** — `<link rel="preconnect">` | `index.html` | 🟢 performance |
| 7 | **Add `<link rel="preload">`** สำหรับ critical CSS | `index.html` | 🟢 performance |
| 8 | **WebP Images** — สร้าง WebP alternatives | `assets/` | 🟢 payload |
| 9 | **Fix `restorePremiumStatus()` at load** — ย้ายไป user interaction | `ui-actions.js` | 🟡 network |
| 10 | **Fix `initDailyMantra()` before DOM ready** — ย้ายไป DOMContentLoaded | `ui-actions.js` | 🟡 reliability |

---

## SECTION 8: Priority Matrix

### 8.1 ตารางเรียงตาม Impact × Effort

| ลำดับ | Task | Impact | Effort | 优先 | Phase |
|-------|------|--------|--------|------|-------|
| 1 | แก้ Label/Select ID mismatch | 🔴 สูง | ⚡ 5 นาที | **Quick Win** | Phase 1 |
| 2 | ลบ STARVIA_CONFIG ซ้ำ | 🟡 กลาง | ⚡ 5 นาที | **Quick Win** | Phase 1 |
| 3 | ลบ Duplicate CSS Selectors | 🟡 กลาง | ⚡ 15 นาที | **Quick Win** | Phase 1 |
| 4 | เพิ่ม `prefers-reduced-motion` | 🟡 กลาง | ⚡ 15 นาที | **Quick Win** | Phase 1 |
| 5 | เพิ่ม Form Validation Feedback | 🔴 สูง | ⏳ 1 ชม. | **Quick Win** | Phase 4 |
| 6 | แก้ Version String | 🟢 ต่ำ | ⚡ 5 นาที | **Quick Win** | Phase 1 |
| 7 | เพิ่ม `<noscript>` | 🟢 ต่ำ | ⚡ 5 นาที | **Quick Win** | Phase 1 |
| 8 | เพิ่ม `aria-required` | 🟡 กลาง | ⚡ 10 นาที | **Quick Win** | Phase 1 |
| 9 | ลบ Gender Option IDs | 🟢 ต่ำ | ⚡ 5 นาที | **Quick Win** | Phase 1 |
| 10 | เพิ่ม `loading="lazy"` ที่ images | 🟢 ต่ำ | ⚡ 5 นาที | **Quick Win** | Phase 1 |
| 11 | 合并 Sections (4 คู่) | 🔴 สูง | ⏳ 2-3 วัน | **Medium** | Phase 2 |
| 12 | ปรับ Paywall 3 จุด | 🔴 สูง | ⏳ 1-2 วัน | **Medium** | Phase 2 |
| 13 | สร้าง Design Tokens | 🔴 สูง | ⏳ 1 วัน | **Medium** | Phase 3 |
| 14 | Replace Hardcoded Colors | 🟡 กลาง | ⏳ 2 วัน | **Medium** | Phase 3 |
| 15 | สร้าง Floating ToC | 🔴 สูง | ⏳ 1-2 วัน | **Medium** | Phase 4 |
| 16 | Focus Trap + Keyboard Nav | 🔴 สูง | ⏳ 1 วัน | **Medium** | Phase 4 |
| 17 | ARIA Live Regions | 🟡 กลาง | ⏳ 0.5 วัน | **Medium** | Phase 4 |
| 18 | Code Splitting | 🔴 สูง | ⏳ 1 วัน | **Medium** | Phase 5 |
| 19 | Consolidate Breakpoints | 🟡 กลาง | ⏳ 1 วัน | **Long-term** | Phase 3 |
| 20 | Standardize Buttons | 🟡 กลาง | ⏳ 1 วัน | **Long-term** | Phase 3 |
| 21 | Extract Card Patterns | 🟡 กลาง | ⏳ 1-2 วัน | **Long-term** | Phase 3 |
| 22 | Fix `transition: all` | 🟡 กลาง | ⏳ 0.5 วัน | **Long-term** | Phase 3 |
| 23 | Minify CSS | 🟡 กลาง | ⏳ 0.5 วัน | **Long-term** | Phase 3 |
| 24 | Canvas Optimization | 🟡 กลาง | ⏳ 0.5 วัน | **Long-term** | Phase 5 |
| 25 | WebP Images | 🟢 ต่ำ | ⏳ 0.5 วัน | **Long-term** | Phase 5 |

### 8.2 Quick Wins vs Long-term

```
Impact
  High │  [11]合并Sections  [12]Paywall3จุด  [13]DesignTokens
       │  [15]FloatingToC  [16]FocusTrap     [18]CodeSplit
       │  [5]FormValidation
       │
  Med  │  [3]DeleteDupCSS  [8]aria-required  [14]HardcodedColors
       │  [4]reduced-motion                    [17]ARIALive
       │                                       [19]Breakpoints
       │                                       [20]Buttons
  Low  │  [1]LabelFix      [6]Version         [23]MinifyCSS
       │  [7]<noscript>    [9]GenderIDs       [24]CanvasOpt
       │  [10]lazy loading                    [25]WebP
       │─────────────────────────────────────────────────
       │  ⚡ ง่าย (< 1 ชม.)    ⏳ กลาง (1-3 วัน)    🐢 ยาก (> 3 วัน)
                              Effort
```

---

## SECTION 9: Success Metrics

### 9.1 KPIs ที่ควรติดตาม

| KPI | วิธีวัด | เป้าหมาย | Phase |
|-----|--------|---------|-------|
| **Scroll Depth** | ดูว่าผู้ใช้เลื่อนลงถึง section ไหน (analytics) | เพิ่มจาก ~30% เหลือ ~60% เลื่อนถึง section 5+ | Phase 2 |
| **Paywall Conversion Rate** | % ของผู้ที่เห็น CTA แล้วกดซื้อ | เพิ่มจาก ~2% เป็น ~5% | Phase 2 |
| **Time on Page** | เวลาเฉลี่ยที่ใช้ในหน้ารายงาน | เพิ่มจาก ~2 นาที เป็น ~5 นาที | Phase 2+ |
| **Bounce Rate** | % ของผู้ที่ปิดหน้าหลังเห็นรายงาน | ลดจาก ~60% เหลือ ~40% | Phase 2 |
| **Section Interaction Rate** | % ของผู้ที่ expand/click sections | เพิ่มจาก ~20% เป็น ~50% | Phase 4 |
| **Lighthouse Accessibility Score** | Lighthouse audit | เพิ่มจาก ~60 เป็น ~85+ | Phase 4 |
| **Lighthouse Performance Score** | Lighthouse audit | เพิ่มจาก ~50 เป็น ~75+ | Phase 5 |
| **CSS File Size** | styles.css size | ลดจาก 173KB เหลือ < 100KB (minified) | Phase 3 |
| **Initial Script Payload** | Total JS size on load | ลด ~40% สำหรับ Mode 0 users | Phase 5 |
| **Mobile Touch Target Compliance** | Manual audit + automated | 100% interactive elements ≥ 44px | Phase 3 |
| **Font Size Compliance** | Manual audit | 100% text ≥ 11px | Phase 3 |
| **Keyboard Navigation Success** | Manual test | 100% tasks completable via keyboard | Phase 4 |
| **Screen Reader Compatibility** | NVDA/VoiceOver test | All sections announced correctly | Phase 4 |
| **Streak System Accuracy** | Manual test (7-day streak) | Streak count consistent across modules | Phase 5 |

### 9.2 วิธีวัดผล

1. **ก่อนเริ่มทำ:** บันทึก baseline ของทุก KPI ข้างต้น
2. **ระหว่างทำ:** ทดสอบทุก phase ด้วย manual testing
3. **หลังทำ:** วัดผล KPI อีกครั้งหลัง deploy
4. **ติดตาม:** ใช้ Umami Analytics (มีอยู่แล้วในโปรเจค) สำหรับ Scroll Depth, Time on Page, Bounce Rate

### 9.3 Checklist ก่อน Deploy

- [ ] ทดสอบบน Chrome, Firefox, Safari, Edge
- [ ] ทดสอบบน Mobile (iOS Safari, Android Chrome)
- [ ] ทดสอบ Keyboard Navigation ครบ
- [ ] ทดสอบ Screen Reader (NVDA/VoiceOver)
- [ ] Lighthouse audit: Performance ≥ 75, Accessibility ≥ 85
- [ ] ทดสอบ Paywall flow ครบทุก 3 จุด
- [ ] ทดสอบ Premium unlock flow
- [ ] ทดสอบ Streak system 7 วัน
- [ ] ทดสอบ Daily Fortune + Report linking
- [ ] ทดสอบ Code Splitting (Mode 0, 1, 2)
- [ ] ทดสอบ Canvas animation + prefers-reduced-motion
- [ ] ทดสอบ on slow network (3G)
- [ ] ทดสอบ on low-end device

---

## สรุป Timeline ทั้งหมด

| Phase | ระยะเวลา | งานหลัก |
|-------|---------|---------|
| **Phase 1:** Quick Wins | 1-2 วัน | Bug fixes, dead code, accessibility basics |
| **Phase 2:** Content Restructuring | 3-5 วัน | Merge sections, paywall strategy, navigation |
| **Phase 3:** CSS Refactoring | 5-7 วัน | Design tokens, breakpoints, buttons, cards |
| **Phase 4:** Interaction + A11y | 3-5 วัน | ToC, focus trap, keyboard nav, ARIA |
| **Phase 5:** Performance | 2-3 วัน | Code splitting, canvas opt, image optimization |
| **รวม** | **14-22 วัน** | |

---

> **หมายเหตุ:** แผนนี้เป็น living document — ควรอัพเดตหลังทำแต่ละ phase เพื่อบันทึกสิ่งที่เปลี่ยนแปลงจริง
