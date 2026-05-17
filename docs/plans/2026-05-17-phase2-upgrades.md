# Phase 2 Upgrades — Implementation Plan

**Date:** 2026-05-17  
**Status:** Plan (not yet implemented)  
**Approach:** TDD — write failing tests first, then implement each feature

---

## Codebase Context

- **Render entry:** `renderInd()` at `astro-renderers.js:182` builds the individual reading
- **Current render order:** `.brow` → info card (`.card`) → `powerCardHtml` → `karmaHtml` → `buildElementRadar` → tabs
- **Auspicious entry:** `renderAusp()` at `astro-renderers.js:571` builds the auspicious reading
- **Current auspicious order:** `.brow` → `colorHtml` (today's colors) → `routineHtml` (cosmic routine) → auspicious grid + activities → quote
- **Data source:** `THAI_ASTRO_CONTENT` in `data/thai-astrology-content.js` (currently has `karmaMirror` and `coupleDharma`)
- **CSS vars:** `--g: #C9A227` (gold), `--pu: #5B3FA6` (purple), `--tx: #e8dfc8` (text), `--tx2: #b8a8d8` (muted text)
- **Test setup:** Vitest + jsdom. Each test file has a `loadContext(dom)` helper that creates a VM sandbox, loads content JS then renderer JS.

---

## Feature 1: Thai Life Blueprint Header Card

### What
A branded "Thai Life Blueprint · พิมพ์เขียวชีวิตไทย" header card at the top of the individual reading, before the existing info card. Premium feel: dark card with gold accents, displaying name, planet, element, rasi, and lagna.

### Where
- **Insert point:** `astro-renderers.js`, inside `wrap.innerHTML` assignment (line 291). Add the blueprint card HTML *before* the existing `.brow` + `.card` markup.
- **CSS:** New class `.blueprint-card` in `styles.css` (append after `.karma-card` section, ~line 862).

### CSS Design (`.blueprint-card`)
Model after `.karma-card` and `.action-plan-card` patterns:
- Dark gradient background: `linear-gradient(145deg, rgba(20,10,45,0.95), rgba(43,20,82,0.7))`
- Gold border: `1px solid rgba(201,162,39,0.35)`
- Gold inner glow: `box-shadow: 0 10px 30px rgba(0,0,0,0.4), inset 0 0 20px rgba(201,162,39,0.06)`
- Border-radius: `18px` (matches `.karma-card`)
- Pseudo-element `::before` for subtle decorative "✦" watermark (same pattern as `.action-plan-card::before`)

Sub-classes:
- `.bp-kicker` — Small pill badge "Thai Life Blueprint · พิมพ์เขียวชีวิตไทย" (centered, uppercase, 9px, gold on translucent bg). Model after `.karma-kicker`.
- `.bp-title` — User's name in large gold serif font (Georgia). Model after `.karma-title` but use `var(--g2)` gradient.
- `.bp-grid` — 5-column grid (or wrapping flex) showing: ☉ planet, 🌍 element, ♈ rasi, 📍 lagna, 🎂 age
- `.bp-item` — Each data cell: icon/symbol on top, label below in muted text, value in gold

### HTML Structure (built in JS)
```html
<div class="blueprint-card">
  <div class="bp-kicker">Thai Life Blueprint · พิมพ์เขียวชีวิตไทย</div>
  <div class="bp-title">✦ {nm} ✦</div>
  <div class="bp-grid">
    <div class="bp-item">
      <div class="bp-icon" style="color:{p.c}">{p.s}</div>
      <div class="bp-label">ดาวเจ้าชะตา</div>
      <div class="bp-value" style="color:{p.c}">{p.n}</div>
    </div>
    <div class="bp-item">
      <div class="bp-icon">🌍</div>
      <div class="bp-label">ธาตุ</div>
      <div class="bp-value">ธาตุ{p.el}</div>
    </div>
    <div class="bp-item">
      <div class="bp-icon" style="color:{r.c}">{r.s}</div>
      <div class="bp-label">ราศีเกิด</div>
      <div class="bp-value" style="color:{r.c}">{r.n}</div>
    </div>
    <div class="bp-item">
      <div class="bp-icon" style="color:{l.c}">{l.s}</div>
      <div class="bp-label">ลัคนา</div>
      <div class="bp-value" style="color:{l.c}">{l.n}</div>
    </div>
    <div class="bp-item">
      <div class="bp-icon">🎂</div>
      <div class="bp-label">อายุ</div>
      <div class="bp-value">{ageTxt}</div>
    </div>
  </div>
</div>
```

### JS Changes (`astro-renderers.js`)
1. Build `blueprintCardHtml` string variable (before `wrap.innerHTML` assignment).
2. All values must go through `escapeHTML()` (name `nm` is already escaped at line 184; planet/sign symbols and element names are data-driven, but wrap in escapeHTML for safety).
3. Insert at the beginning of `wrap.innerHTML` concatenation (line 291), *before* the `.brow` div.

### Tests (`tests/render-individual.test.js`)
Add a new `describe('Thai Life Blueprint header card')` block:
- **Test 1:** Renders `.blueprint-card` class in the output
- **Test 2:** Contains the kicker text "Thai Life Blueprint"
- **Test 3:** Shows the user's name (escaped)
- **Test 4:** Shows planet symbol + name
- **Test 5:** Shows element name
- **Test 6:** Shows rasi name
- **Test 7:** Shows lagna name
- **Test 8:** Blueprint card appears before the info card (`.card` class) in the DOM order
- **Test 9:** XSS: name `<script>alert(1)</script>` is escaped inside blueprint card

### Implementation Steps
1. Write 9 failing tests in `tests/render-individual.test.js`
2. Run tests — confirm they fail
3. Add `.blueprint-card` CSS to `styles.css` (after line 862)
4. Build `blueprintCardHtml` in `astro-renderers.js` `renderInd()` (before line 291)
5. Prepend to `wrap.innerHTML`
6. Run tests — confirm they pass
7. Run full test suite — confirm no regressions

---

## Feature 2: Personal Auspicious Calendar Upgrade

### What
Upgrade the existing auspicious mode (`renderAusp`) with:
1. A header card showing the user's planet + element connection (like a mini blue-print)
2. Better visual hierarchy (card-based layout instead of flat list)
3. Time windows for each activity recommendation (not just "best day")

### Where
- **JS changes:** `astro-renderers.js`, inside `renderAusp()` (lines 571–673)
- **CSS changes:** `styles.css`, add `.ausp-header-card` and `.ausp-activity-row` classes
- **Tests:** `tests/render-auspicious.test.js`

### Data Source
Currently, `renderAusp()` has these data structures inline:
- `TODAY_COLORS` array (weekday-based color recommendations) — used for daily color card
- `routines` object keyed by element (`ไฟ/ดิน/ลม/น้ำ`) — used for cosmic routine
- `ACTS_TH` array — 5 activity recommendations with best/second-best days
- `PLC` — 7×7 compatibility matrix for day grid

No new data structures need to be added to `THAI_ASTRO_CONTENT` for this feature. All data is already available from the planet object `p` and the inline arrays.

### Upgrade 1: Header Card (`.ausp-header-card`)
A compact "personal blueprint" at the top of the auspicious reading, similar to Feature 1 but smaller. Shows:
- User's planet symbol + name
- Element name + emoji
- A one-line "connection" message (e.g., "พลังงานจากดวงอาทิตย์เสริมวันอาทิตย์ของคุณ")

**CSS:** `.ausp-header-card` — dark card, gold border, compact padding. Model after `.blueprint-card` but with less vertical space (no grid, just a horizontal flex with planet + element + message).

**JS:** Build `auspHeaderHtml` at the top of `renderAusp()`, insert before the existing `.brow` in `wrap.innerHTML`.

### Upgrade 2: Better Visual Hierarchy
Current layout is flat: brow → colorHtml → routineHtml → card(grid + activities) → quote.

New layout:
```
brow
auspHeaderHtml          ← NEW: personal header card
colorHtml               (unchanged)
routineHtml             (unchanged)
activities card         ← UPGRADED: card-based with better hierarchy
  - Section title "ปฏิทินวันมงคลส่วนตัว"
  - 7-day grid (unchanged)
  - NEW: "เวลาที่เหมาะสำหรับกิจกรรม" header
  - Activities list (upgraded with time windows)
quote
```

The key visual upgrade is restructuring the activities section (lines 649–654) from a flat list into individual `.hi` cards with time window indicators.

### Upgrade 3: Time Windows for Activities
Current `ACTS_TH` data: `[['activity name', bestDay, secondBestDay], ...]`

Each activity gets a time window based on the element's cosmic routine. Map the element to a recommended time block:
- **ไฟ:** 06:00–08:00 (Ignite) or 09:00–14:00 (Blaze)
- **ดิน:** 09:00–15:00 (Build) or 16:00–18:00 (Organize)
- **ลม:** 09:00–12:00 (Flow) or 13:00–16:00 (Connect)
- **น้ำ:** 09:00–12:00 (Nurture) or 13:00–16:00 (Create)

**JS:** Create a mapping object `ACTIVITY_TIMES` that assigns time windows to each activity based on element. Display the time window as a small tag next to the activity name.

**Updated activity HTML pattern:**
```html
<div class="hi">
  <div class="hn" style="width:auto;border-radius:7px;padding:0 8px;font-size:10px">
    {activityName}
  </div>
  <div class="ht" style="font-size:12px;">
    {u.ab} <strong style="color:#C9A227">{u.ad}{bestDay}</strong>
    <span style="font-size:10px;color:var(--tx2);">(รองลงมา: {u.ad}{secondDay})</span>
    <span class="act-time-window" style="font-size:10px; color:#E8A0CF; margin-left:6px;">
      ⏰ {timeWindow}
    </span>
  </div>
</div>
```

### Tests (`tests/render-auspicious.test.js`)
Add new `describe('Auspicious mode personal upgrades')` block:
- **Test 1:** Renders `.ausp-header-card` class
- **Test 2:** Header card shows planet name
- **Test 3:** Header card shows element name
- **Test 4:** Activity recommendations contain time window indicators (class `.act-time-window`)
- **Test 5:** XSS: name `<script>` is escaped in header card

### Implementation Steps
1. Write 5 failing tests in `tests/render-auspicious.test.js`
2. Run tests — confirm they fail
3. Add `.ausp-header-card` CSS to `styles.css`
4. Build `auspHeaderHtml` in `renderAusp()` (astro-renderers.js)
5. Add `ACTIVITY_TIMES` mapping object and update activity rendering
6. Insert header into `wrap.innerHTML`
7. Run tests — confirm they pass
8. Run full test suite — confirm no regressions

---

## Feature 3: Daily Thai Cosmic Brief

### What
A compact 5-line block added to the individual reading, positioned after the Karma Mirror card. Shows today's energy, personal color, focus area, warning, and one recommended action. Uses weekday-based content from `THAI_ASTRO_CONTENT`.

### Where
- **Data:** New `dailyBrief` section in `THAI_ASTRO_CONTENT` (`data/thai-astrology-content.js`)
- **JS:** New helper function `buildDailyBrief(p, dayOfWeek)` in `astro-renderers.js`, and rendering in `renderInd()`
- **CSS:** New `.cosmic-brief` class in `styles.css`
- **Tests:** `tests/render-individual.test.js` (and optionally a new `tests/cosmic-brief.test.js`)

### Data Structure (`THAI_ASTRO_CONTENT.dailyBrief`)
Add to `data/thai-astrology-content.js`:

```js
dailyBrief: {
  weekdayEnergy: [
    'พลังงานวันอาทิตย์: ความมั่นคงและการยืนหยัด — วันนี้เหมาะกับการนำ',
    'พลังงานวันจันทร์: ความอ่อนไหวและความคิดสร้างสรรค์ — วันนี้เหมาะกับการริเริ่ม',
    'พลังงานวันอังคาร: ความกล้าหาญและความมุ่งมั่น — วันนี้เหมาะกับการลงมือทำ',
    'พลังงานวันพุธ: ความคิดสร้างสรรค์และการสื่อสาร — วันนี้เหมาะกับการเจรจา',
    'พลังงานวันพฤหัสบดี: ปัญญาและความเมตตา — วันนี้เหมาะกับการเรียนรู้',
    'พลังงานวันศุกร์: ความรักและความสัมพันธ์ — วันนี้เหมาะกับการสร้างสัมพันธ์',
    'พลังงานวันเสาร์: วินัยและความรับผิดชอบ — วันนี้เหมาะกับการสะสางงาน'
  ],
  weekdayFocus: [
    'โฟกัส: การเป็นผู้นำที่นุ่มนวล',
    'โฟกัส: ความคิดสร้างสรรค์และสัญชาตญาณ',
    'โฟกัส: ความกล้าที่จะตัดสินใจ',
    'โฟกัส: การสื่อสารที่ชัดเจน',
    'โฟกัส: การเรียนรู้สิ่งใหม่',
    'โฟกัส: ความสัมพันธ์ที่ใกล้ชิด',
    'โฟกัส: การจัดระเบียบชีวิต'
  ],
  weekdayWarning: [
    'ระวัง: อย่ากดดันตัวเองมากเกินไป',
    'ระวัง: อย่าจมอยู่กับอารมณ์',
    'ระวัง: อย่าปะทะโดยไม่คิด',
    'ระวัง: อย่าพูดมากเกินไป',
    'ระวัง: อย่ายึดมั่นถือมั่น',
    'ระวัง: อย่าเอาใจคนอื่นจนลืมตัวเอง',
    'ระวัง: อย่าแบกรับทุกอย่างคนเดียว'
  ],
  weekdayAction: [
    'สิ่งที่ควรทำวันนี้: เขียน 3 สิ่งที่รู้สึกขอบคุณ',
    'สิ่งที่ควรทำวันนี้: นั่งสมาธิ 5 นาทีก่อนนอน',
    'สิ่งที่ควรทำวันนี้: ออกกำลังกายเบาๆ 20 นาที',
    'สิ่งที่ควรทำวันนี้: โทรหาคนที่ไม่ได้คุยมานาน',
    'สิ่งที่ควรทำวันนี้: อ่านหนังสือหรือบทความที่ให้ปัญญา',
    'สิ่งที่ควรทำวันนี้: ทำอะไรพิเศษให้คนที่รัก',
    'สิ่งที่ควรทำวันนี้: สะสางงานค้างที่คั่งค้าง'
  ]
}
```

Also add a fallback in `astro-renderers.js`:
```js
var FALLBACK_DAILY_BRIEF = {
  weekdayEnergy: ['พลังงานวันนี้: มีพลังงานดีสำหรับการเริ่มต้นใหม่'],
  weekdayFocus: ['โฟกัส: สิ่งที่สำคัญที่สุดวันนี้'],
  weekdayWarning: ['ระวัง: อย่ารีบตัดสินใจ'],
  weekdayAction: ['สิ่งที่ควรทำวันนี้: หยุดพักสักครู่']
};
```

### Helper Function (`astro-renderers.js`)
Add `buildDailyBrief(p, dayOfWeek)` function (after `buildKarmaMirror`):

```js
function buildDailyBrief(p, dayOfWeek) {
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var db = content && content.dailyBrief ? content.dailyBrief : FALLBACK_DAILY_BRIEF;
  
  var energy = db.weekdayEnergy[dayOfWeek] || db.weekdayEnergy[0];
  var focus = db.weekdayFocus[dayOfWeek] || db.weekdayFocus[0];
  var warning = db.weekdayWarning[dayOfWeek] || db.weekdayWarning[0];
  var action = db.weekdayAction[dayOfWeek] || db.weekdayAction[0];
  
  // Personal color from POWER_ELEMENTS (reuse existing array)
  var pe = POWER_ELEMENTS[dayOfWeek];
  
  return {
    energy: energy,
    color: pe.c1n,
    colorHex: pe.c1,
    focus: focus,
    warning: warning,
    action: action
  };
}
```

**Note:** `POWER_ELEMENTS` is currently defined *inside* `renderInd()` (line 252). To share it with `buildDailyBrief`, we need to either:
- **Option A (minimal):** Pass `pe` into `buildDailyBrief` as a parameter.
- **Option B:** Move `POWER_ELEMENTS` to module scope.

**Recommended: Option A** — pass the color info from the caller. This keeps changes minimal.

Updated signature: `buildDailyBrief(p, dayOfWeek, personalColor)` where `personalColor = { name: pe.c1n, hex: pe.c1 }`.

### CSS (`.cosmic-brief`)
Compact block, not a full card. Positioned after `.karma-card`:

```css
/* Daily Thai Cosmic Brief */
.cosmic-brief {
  background: linear-gradient(90deg, rgba(201,162,39,0.04), rgba(91,63,166,0.08), rgba(201,162,39,0.04));
  border: 1px dashed rgba(201,162,39,0.22);
  border-radius: 12px;
  padding: 14px 16px;
  margin: 12px 0 16px;
  font-size: 12.5px;
  line-height: 1.9;
  color: var(--tx);
}
.cb-title {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--g);
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 10px;
  font-weight: 600;
}
.cb-line {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 3px;
}
.cb-line:last-child { margin-bottom: 0; }
.cb-label {
  color: var(--tx2);
  font-size: 11px;
  flex-shrink: 0;
}
.cb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}
```

### HTML Structure (built in JS)
```html
<div class="cosmic-brief">
  <div class="cb-title">✦ สรุปพลังงานวันนี้ · Daily Cosmic Brief ✦</div>
  <div class="cb-line">
    <div class="cb-dot" style="background:{colorHex}"></div>
    <div>{energy}</div>
  </div>
  <div class="cb-line">
    <div class="cb-dot" style="background:{colorHex}"></div>
    <div>สีมงคลวันนี้: <strong style="color:{colorHex}">{colorName}</strong></div>
  </div>
  <div class="cb-line">
    <div class="cb-dot" style="background:#E8A0CF"></div>
    <div>{focus}</div>
  </div>
  <div class="cb-line">
    <div class="cb-dot" style="background:#E8534A"></div>
    <div>{warning}</div>
  </div>
  <div class="cb-line">
    <div class="cb-dot" style="background:var(--g)"></div>
    <div>{action}</div>
  </div>
</div>
```

### JS Changes (`astro-renderers.js`)
1. Add `FALLBACK_DAILY_BRIEF` constant (near `FALLBACK_KARMA_MIRROR`, ~line 11).
2. Add `buildDailyBrief(p, dayOfWeek, personalColor)` function (after `buildKarmaMirror`, ~line 37).
3. In `renderInd()`, after building `karmaHtml` (line 288), add:
   ```js
   var briefData = buildDailyBrief(p, dayOfWeek, { name: pe.c1n, hex: pe.c1 });
   var cosmicBriefHtml = '<div class="cosmic-brief">' + /* ... */ + '</div>';
   ```
   **Note:** `pe` is defined at line 261, so the brief must be built after that line. Insert the brief HTML construction between the `pe` definition and the `wrap.innerHTML` assignment.
4. Add `cosmicBriefHtml` to `wrap.innerHTML` after `karmaHtml` (after line 306).

### Tests
**Option 1 (inline in `tests/render-individual.test.js`):**
Add `describe('Daily Thai Cosmic Brief')` block:
- **Test 1:** Renders `.cosmic-brief` class in output
- **Test 2:** Contains "Daily Cosmic Brief" title text
- **Test 3:** Contains 5 `.cb-line` elements (energy, color, focus, warning, action)
- **Test 4:** Shows personal color name from POWER_ELEMENTS
- **Test 5:** Cosmic brief appears after `.karma-card` in DOM order
- **Test 6:** XSS: name is escaped (indirectly, through existing tests)

**Option 2 (new file `tests/cosmic-brief.test.js`):**
Standalone test file with its own `loadContext()`. Better for isolation but duplicates setup.

**Recommended: Option 1** — keep it in `render-individual.test.js` to match existing pattern.

### Implementation Steps
1. Add `dailyBrief` content to `data/thai-astrology-content.js`
2. Add `FALLBACK_DAILY_BRIEF` and `buildDailyBrief()` to `astro-renderers.js`
3. Write 6 failing tests in `tests/render-individual.test.js`
4. Run tests — confirm they fail
5. Add `.cosmic-brief` CSS to `styles.css`
6. Wire `cosmicBriefHtml` into `renderInd()` after karma card
7. Run tests — confirm they pass
8. Run full test suite — confirm no regressions

---

## File Change Summary

| File | Changes |
|------|---------|
| `astro-renderers.js` | +blueprintCardHtml in renderInd(), +auspHeaderHtml in renderAusp(), +ACTIVITY_TIMES mapping, +buildDailyBrief() function, +FALLBACK_DAILY_BRIEF constant |
| `styles.css` | +`.blueprint-card` and sub-classes, +`.ausp-header-card`, +`.cosmic-brief` and sub-classes |
| `data/thai-astrology-content.js` | +`dailyBrief` section with weekday-based content |
| `tests/render-individual.test.js` | +9 tests (blueprint card) +6 tests (cosmic brief) = 15 new tests |
| `tests/render-auspicious.test.js` | +5 tests (personal upgrades) |

---

## Implementation Order

1. **Feature 1: Blueprint Card** — Self-contained, no data changes, easiest to test in isolation
2. **Feature 3: Cosmic Brief** — Adds new data + helper function, but only touches `renderInd()`
3. **Feature 2: Auspicious Upgrade** — Touches different function (`renderAusp()`), can be done independently

Each feature is a separate commit to keep the git history clean and reviewable.

---

## Risk Notes

- **`POWER_ELEMENTS` scope:** Currently local to `renderInd()`. Feature 3 needs to read color data from it. Passing as parameter (Option A) avoids moving it to module scope, which could break the function's self-contained nature.
- **`escapeHTML` usage:** All user-provided data (name) is already escaped. Planet/sign/element values come from data objects, not user input, but wrapping in `escapeHTML()` is still good practice.
- **CSS specificity:** New classes use unique prefixes (`bp-`, `cb-`, `ausp-`) to avoid collisions with existing styles.
- **Test isolation:** The `loadContext()` pattern creates a fresh VM sandbox per test, so each test is fully isolated.
