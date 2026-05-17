# Thai Content Architecture + Karma Mirror MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Make STARVIA feel more distinctively Thai and more emotionally memorable by extracting Thai astrology content into structured data and adding a `Karma Mirror / กระจกกรรม` MVP section to the individual reading.

**Architecture:** Keep the current static vanilla JS architecture for now. Add one new data file for Thai astrology content, load it before `astro-renderers.js`, and keep renderer changes minimal. Use TDD for each behavior because the renderer uses large HTML strings and can regress easily.

**Tech Stack:** Vanilla HTML/CSS/JS, Vitest, jsdom, current static file layout.

---

## Task 1: Load a Thai astrology content data file

**Objective:** Add a dedicated content file and include it in the page without changing visible behavior yet.

**Files:**
- Create: `data/thai-astrology-content.js`
- Modify: `index.html`
- Test: `tests/content.test.js`

**Step 1: Write failing test**

Create `tests/content.test.js` that loads `data/thai-astrology-content.js` in a VM context and expects `THAI_ASTRO_CONTENT` to exist with `karmaMirror` definitions.

Expected shape:

```js
THAI_ASTRO_CONTENT = {
  karmaMirror: {
    elements: {
      'ไฟ': { pattern, lesson, action, ritual },
      'ดิน': { pattern, lesson, action, ritual },
      'ลม': { pattern, lesson, action, ritual },
      'น้ำ': { pattern, lesson, action, ritual }
    },
    weekdayShadows: [/* 7 items */]
  }
}
```

**Step 2: Run test to verify failure**

Run:

```bash
npm test
```

Expected: FAIL because the file or global does not exist yet.

**Step 3: Create minimal content file**

Create `data/thai-astrology-content.js` with `var THAI_ASTRO_CONTENT = {...}`. Keep it global to match the current non-module app style.

**Step 4: Include the file in `index.html`**

Add the script before `astro-renderers.js`:

```html
<script src="data/thai-astrology-content.js"></script>
```

**Step 5: Run test and syntax check**

```bash
npm test
npm run check:js
node --check data/thai-astrology-content.js
```

Expected: PASS.

**Step 6: Commit**

```bash
git add data/thai-astrology-content.js index.html tests/content.test.js
git commit -m "feat: add thai astrology content data"
```

---

## Task 2: Add Karma Mirror helper function

**Objective:** Add a pure helper that combines element and weekday shadow content into one reading model.

**Files:**
- Modify: `astro-renderers.js`
- Test: `tests/karma-mirror.test.js`

**Step 1: Write failing test**

Test expected behavior:

```js
const result = buildKarmaMirror({ el: 'ไฟ' }, 2);
expect(result.title).toContain('กระจกกรรม');
expect(result.pattern).toBeTruthy();
expect(result.weekdayShadow).toBeTruthy();
expect(result.action).toBeTruthy();
```

Also test fallback:

```js
const result = buildKarmaMirror({ el: 'unknown' }, 99);
expect(result.pattern).toBeTruthy();
```

**Step 2: Run test to verify failure**

```bash
npm test
```

Expected: FAIL because `buildKarmaMirror` does not exist.

**Step 3: Implement helper**

Add near the top of `astro-renderers.js` after `escapeHTML`:

```js
function buildKarmaMirror(p, dayOfWeek){
  var content = (typeof THAI_ASTRO_CONTENT !== 'undefined') ? THAI_ASTRO_CONTENT : null;
  var km = content && content.karmaMirror ? content.karmaMirror : null;
  var elementKey = p && p.el ? p.el : 'ไฟ';
  var element = km && km.elements[elementKey] ? km.elements[elementKey] : km.elements['ไฟ'];
  var shadow = km && km.weekdayShadows[dayOfWeek] ? km.weekdayShadows[dayOfWeek] : km.weekdayShadows[0];
  return {
    title: 'กระจกกรรม · Karma Mirror',
    pattern: element.pattern,
    lesson: element.lesson,
    weekdayShadow: shadow,
    action: element.action,
    ritual: element.ritual
  };
}
```

Adjust defensively if `km` is missing to avoid runtime crashes.

**Step 4: Run tests**

```bash
npm test
npm run check:js
```

Expected: PASS.

**Step 5: Commit**

```bash
git add astro-renderers.js tests/karma-mirror.test.js
git commit -m "feat: add karma mirror helper"
```

---

## Task 3: Render Karma Mirror in individual reading

**Objective:** Show the Karma Mirror MVP as a premium-feeling section in the individual report.

**Files:**
- Modify: `astro-renderers.js`
- Modify: `styles.css`
- Test: `tests/security.test.js` or new `tests/render-individual.test.js`

**Step 1: Write failing render test**

Using jsdom, call `renderInd(...)` and assert:

```js
expect(output).toContain('กระจกกรรม');
expect(output).toContain('สิ่งที่ชีวิตมักพากลับมาเรียนรู้');
```

**Step 2: Run test to verify failure**

```bash
npm test
```

Expected: FAIL because the section is not rendered.

**Step 3: Add renderer HTML**

Inside `renderInd`, after `thaksaHtml` or before tabs are built, create:

```js
var karma = buildKarmaMirror(p, dayOfWeek);
var karmaHtml = '<div class="karma-card">'
  + '<div class="karma-kicker">Thai Life Blueprint</div>'
  + '<div class="karma-title">✦ ' + escapeHTML(karma.title) + ' ✦</div>'
  + '<div class="karma-desc">กระจกกรรมไม่ใช่คำตัดสิน แต่คือรูปแบบที่ชีวิตมักพาคุณกลับมาเรียนรู้ซ้ำ</div>'
  + '<div class="karma-grid">'
  + '<div><strong>รูปแบบที่มักวนซ้ำ:</strong><br>' + escapeHTML(karma.pattern) + '</div>'
  + '<div><strong>บทเรียนของดาว:</strong><br>' + escapeHTML(karma.lesson) + '</div>'
  + '<div><strong>เงาจากวันเกิด:</strong><br>' + escapeHTML(karma.weekdayShadow) + '</div>'
  + '<div><strong>สิ่งที่ควรทำเดือนนี้:</strong><br>' + escapeHTML(karma.action) + '</div>'
  + '</div>'
  + '<div class="karma-ritual">พิธีเล็ก ๆ 7 วัน: ' + escapeHTML(karma.ritual) + '</div>'
  + '</div>';
```

Add `karmaHtml` after `powerCardHtml` or before `buildElementRadar(...)`.

**Step 4: Add CSS**

Add `.karma-card`, `.karma-kicker`, `.karma-title`, `.karma-desc`, `.karma-grid`, `.karma-ritual` with the current STARVIA gold/navy/purple visual language.

**Step 5: Run tests and browser smoke test**

```bash
npm test
npm run check:js
```

Then manually open `index.html` or run a local server and verify the section appears on mobile width.

**Step 6: Commit**

```bash
git add astro-renderers.js styles.css tests/render-individual.test.js
git commit -m "feat: render karma mirror in individual report"
```

---

## Task 4: Upgrade Couple Dharma Map labels

**Objective:** Keep the current compatibility score but make relationship output more Thai and meaningful.

**Files:**
- Modify: `data/thai-astrology-content.js`
- Modify: `astro-renderers.js`
- Test: `tests/couple.test.js`

**Step 1: Write failing test**

Assert that high/medium/low compatibility maps to a pair type object with Thai labels.

**Step 2: Add pair type content**

Add `coupleDharma.pairTypes` with labels:
- คู่เกื้อหนุน
- คู่กระจกใจ
- คู่รักแรง
- คู่บทเรียน
- คู่สร้างฐาน

**Step 3: Add helper**

Add `getCoupleDharmaType(total, elS, sameElement)`.

**Step 4: Render in matrix card**

Show pair type under the score.

**Step 5: Verify and commit**

```bash
npm test
npm run check:js
git add data/thai-astrology-content.js astro-renderers.js tests/couple.test.js
git commit -m "feat: add couple dharma map labels"
```

---

## Task 5: Add Daily Thai Cosmic Brief MVP

**Objective:** Add a daily reason to return without needing backend.

**Files:**
- Modify: `data/thai-astrology-content.js`
- Modify: `astro-renderers.js`
- Modify: `styles.css`
- Test: `tests/daily-brief.test.js`

**Behavior:** Individual reading shows one compact block:
- พลังวันนี้
- สีที่ควรใช้
- สิ่งที่ควรโฟกัส
- สิ่งที่ควรเลี่ยง
- การกระทำเล็ก ๆ วันนี้

Use existing weekday/current date logic and content table.

**Verification:**

```bash
npm test
npm run check:js
```

Commit:

```bash
git commit -m "feat: add thai cosmic daily brief"
```

---

## Final Verification Checklist

- [ ] `npm test` passes
- [ ] `npm run check:js` passes
- [ ] No user input is inserted without escaping
- [ ] STARVIA still works in all 3 modes
- [ ] Visual cards are readable on mobile
- [ ] Each task is committed separately

