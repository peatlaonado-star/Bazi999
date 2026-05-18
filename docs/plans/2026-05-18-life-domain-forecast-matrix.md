# STARVIA Life Domain Forecast Matrix Implementation Plan

> **For Hermes:** Use test-driven-development + static-web-refactoring. Do not add production renderer code before writing failing Vitest tests.

**Goal:** Add a complete individual-reading section that tells the user their current life situation, how to strengthen/improve it, and which age periods are likely to bring opportunities across โชค, การเงิน, สุขภาพ, ความสัมพันธ์, การงาน, and บริวาร.

**Architecture:** Keep STARVIA as a vanilla JS/Vite static app. Add structured forecast content in `data/thai-astrology-content.js`, pure helper logic in `js/reading-helpers.js`, and render the UI in `js/renderer-individual.js`. The section should adapt from element + current age band + next age bands, while keeping user input escaped.

**Tech Stack:** Vanilla JavaScript, browser globals, Vite, Vitest, jsdom, Node `vm` test harness.

---

## Current audit summary

Current STARVIA reading modes:

1. **Individual / Thai Life Blueprint** — strongest mode. Covers identity, shadow, love, career, money, past/present/future, Karma Mirror, Daily Cosmic Brief, lucky numbers/colors.
2. **Couple / Couple Dharma Map** — covers relationship compatibility, element chemistry, pair type, and relationship action plan.
3. **Auspicious / Personal Auspicious Calendar** — covers lucky colors, daily routine, auspicious days, best days/time windows for activities.

Current gaps against the new requirement:

| Domain | Current state | Needed |
|---|---|---|
| โชค | Lucky colors/numbers/days exist | Current situation + age opportunities + specific strengthening method |
| การเงิน | Wealth Blueprint exists | Current financial pressure/opportunity + age opportunities |
| สุขภาพ | Only routine/wellness indirectly | Dedicated health/vitality reading |
| ความสัมพันธ์ | Love + Couple reading exist | Age-specific relationship opportunities and current situation |
| การงาน | Career Blueprint exists | Current work situation + career age windows |
| บริวาร | Not explicit | Dedicated team/supporters/subordinates domain |

---

## Task 1: Add failing tests for domain labels and required parts

**Objective:** Prove the individual output must include all six required domains and the required content parts.

**Files:**
- Modify: `tests/render-individual.test.js`

**Steps:**
1. Add a test rendering `renderInd(...)` and asserting the output contains:
   - `Life Domain Forecast Matrix`
   - `แผนที่สถานการณ์ชีวิต`
   - `โชค`, `การเงิน`, `สุขภาพ`, `ความสัมพันธ์`, `การงาน`, `บริวาร`
2. Add assertions for the required part labels:
   - `สถานการณ์ปัจจุบัน`
   - `สัญญาณเตือน`
   - `วิธีเสริม`
   - `โอกาสตามช่วงอายุ`
3. Run: `npm test -- tests/render-individual.test.js --reporter=dot`
4. Expected: FAIL because the section is not implemented yet.

---

## Task 2: Add structured domain forecast content

**Objective:** Store reusable domain content outside the renderer.

**Files:**
- Modify: `data/thai-astrology-content.js`
- Modify: `tests/content.test.js`

**Data shape proposal:**

```js
lifeDomainForecast: {
  domains: [
    { key: 'luck', label: 'โชค', subtitle: 'จังหวะโอกาส' },
    { key: 'money', label: 'การเงิน', subtitle: 'ทรัพย์สิน' },
    { key: 'health', label: 'สุขภาพ', subtitle: 'พลังชีวิต' },
    { key: 'relationship', label: 'ความสัมพันธ์', subtitle: 'คู่ครอง / ครอบครัว' },
    { key: 'career', label: 'การงาน', subtitle: 'ชื่อเสียง / ความก้าวหน้า' },
    { key: 'supporters', label: 'บริวาร', subtitle: 'ทีม / ผู้สนับสนุน / คนรอบตัว' }
  ],
  elementGuidance: {
    'ไฟ': { ... },
    'ดิน': { ... },
    'ลม': { ... },
    'น้ำ': { ... }
  },
  ageBandOpportunities: {
    root: { ... }, learn: { ... }, identity: { ... }, launch: { ... },
    build: { ... }, lead: { ... }, expand: { ... }, mentor: { ... }, legacy: { ... }
  }
}
```

**Steps:**
1. Write failing content test that validates all six domain keys exist.
2. Run content test and confirm RED.
3. Add minimal content object with labels and domain-specific text.
4. Run content test and confirm GREEN.

---

## Task 3: Add pure helper to build forecast data

**Objective:** Create a helper that maps the current age band and next age bands into domain forecasts.

**Files:**
- Modify: `js/reading-helpers.js`
- Modify: `tests/karma-mirror.test.js` or create `tests/life-domain-forecast.test.js`

**Function proposal:**

```js
function buildLifeDomainMatrix(p, r, l, currentBand, nextBands) {
  return {
    title: 'Life Domain Forecast Matrix',
    domains: [
      {
        key: 'luck',
        label: 'โชค',
        current: '...',
        warning: '...',
        remedy: '...',
        opportunities: [
          { ageRange: '36–42 ปี', text: '...' }
        ]
      }
    ]
  };
}
```

**Steps:**
1. Write failing helper test requiring all six domains and at least one opportunity range.
2. Run helper test and confirm RED.
3. Implement helper with safe fallbacks if content is missing.
4. Run helper test and full unit suite.

---

## Task 4: Render the section in individual reading

**Objective:** Show the Life Domain Forecast Matrix in the individual report.

**Files:**
- Modify: `js/renderer-individual.js`
- Modify: `styles.css`
- Modify: `tests/render-individual.test.js`

**Placement:**
Render after `karmaHtml` and before `cosmicBriefHtml`, or before the tab block, so it is visible before premium tabs.

**UI requirements:**
- Premium dark/gold card matching existing `karma-card` / `blueprint-card` language.
- Six compact domain cards.
- Each card has four labeled parts:
  - สถานการณ์ปัจจุบัน
  - สัญญาณเตือน
  - วิธีเสริม
  - โอกาสตามช่วงอายุ
- Opportunity age ranges must be explicit.

**Steps:**
1. Extend the failing render test from Task 1.
2. Implement minimal renderer HTML.
3. Add CSS classes such as `.domain-matrix`, `.domain-card`, `.domain-part`, `.domain-age-chip`.
4. Run render test and confirm GREEN.
5. Run full suite.

---

## Task 5: Verify build and update docs

**Objective:** Ensure app is deployable and docs match current status.

**Files:**
- Modify: `docs/STARVIA_TH_PRODUCT_ROADMAP.md`
- Modify: `README.md` if the “Next implementation plan” pointer is stale.

**Verification commands:**

```bash
npm test
npm run check:js
npm run build
git status --short
```

**Expected:**
- 42+ tests pass; new tests included.
- Build succeeds and `dist/` includes all plain-script assets.
- Roadmap marks Life Domain Forecast Matrix as the active next build slice.

---

## Acceptance criteria

- Individual reading output contains all six required domains: โชค, การเงิน, สุขภาพ, ความสัมพันธ์, การงาน, บริวาร.
- Each domain includes current situation, warning/blockage, remedy/action, and age-band opportunities.
- At least two future age bands are rendered when available.
- The forecast changes based on at least element and age band.
- User input remains escaped.
- `npm test`, `npm run check:js`, and `npm run build` pass.
- Implementation is committed after completion.
