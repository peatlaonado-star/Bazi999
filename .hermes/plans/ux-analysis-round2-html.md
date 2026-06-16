# STARVIA — UX Analysis Round 2: HTML Structure & Interaction Patterns
> วิเคราะห์จาก source code: index.html, ui-actions.js, onboarding.js, daily-fortune.js, app.js, styles.css, gamification.js, streak-tracker.js, tarot-ui.js, social-proof.js, share-viral.js, renderer-shared.js
> วันที่: 16 มิถุนายน 2569

---

## A) HTML STRUCTURE — โครงสร้างหน้าเว็บ

### A1. Page Layout Overview
```
<body>
  <canvas id="cv">                     ← Star animation canvas (decorative)
  <div class="w">                      ← Main wrapper (max-width: 980px)
    ├── <div class="hd premium-hero">  ← Header / Hero Section
    ├── <div class="modenav">          ← Mode Navigation (3 tabs)
    ├── <div class="mode" id="m0">     ← Mode 0: Self-reading
    │   ├── <div class="card form-card">  ← Birth data form
    │   ├── <section class="daily-fortune-section">  ← Daily fortune widget
    │   ├── <section class="social-proof-section">   ← Social proof stats
    │   ├── <div id="r0">              ← Reading result container (empty div)
    │   └── <section class="value-section">  ← 4-dimension value props
    ├── <div class="mode" id="m1">     ← Mode 1: Couple reading
    │   ├── <div class="card">         ← Couple form
    │   └── <div id="r1">             ← Couple result container
    ├── <div class="mode" id="m2">     ← Mode 2: Auspicious timing
    │   ├── <div class="card">         ← Timing form
    │   └── <div id="r2">             ← Timing result container
    ├── <div id="load">                ← Loading overlay
    ├── Footer (inline styles)         ← Footer with links
  </div>
  <div id="tarot-modal">              ← Tarot modal (outside wrapper)
  <scripts...>                         ← 30+ deferred scripts
</body>
```

### A2. Form Structure (Mode 0 — Self-Reading)
```
<div class="card form-card" id="fc0">
  <div class="form-head">             ← Pill badge + h2 + description
  <div class="row">                    ← Grid: Name + Gender
    <div class="f">
      <label for="n0">ชื่อ</label>
      <input id="n0" type="text">
    </div>
    <div class="f">
      <label for="g0">เพศ</label>
      <select id="g0">...</select>
    </div>
  </div>
  <div class="row">                    ← Grid: Date + Time
    <div class="f">
      <label for="d0">วันเกิด (ค.ศ.)</label>
      <input id="d0" type="date">
    </div>
    <div class="f">
      <label for="t0">เวลาเกิด <span class="opt-label">(ไม่บังคับ)</span></label>
      <input id="t0" type="time">
    </div>
  </div>
  <button class="btn" id="btn0" disabled>✦ เปิดดวงชะตา ✦</button>
  <div class="trust-strip">🔒 ข้อมูลไม่บันทึกลงเซิร์ฟเวอร์</div>
</div>
```

**Issues Found:**
- ❌ `<select>` has no `value` attributes — options rely on text content matching
- ❌ Gender select IDs on options (`g0m`, `g0f`, `g0o`) are unused in JS — dead code
- ❌ Button starts `disabled` with no visual feedback explaining why
- ❌ No form `<form>` element wrapping — relies on button click handler
- ❌ `placeholder="06:00"` on `<input type="time">` is ignored by browsers
- ✅ Labels properly use `for` attribute matching input IDs

### A3. Report Container Structure
```
<div id="r0"></div>    ← Empty div; renderer-individual.js injects HTML here
```
The report is entirely JS-rendered via `renderer-individual.js`. This means:
- **No semantic HTML** in the initial page load for report content
- **Screen readers** can't index report content until JS executes
- **SEO** benefit is minimal — crawlers may miss dynamically injected content

### A4. Footer Structure (Inline Styles)
```html
<div style="text-align:center;padding:40px 0 20px;border-top:1px solid rgba(201,162,39,.1)">
  <!-- STARVIA logo, tagline, privacy/terms links -->
</div>
```
**Issues:**
- ❌ Footer is entirely inline styles — no semantic `<footer>` element
- ❌ No `role="contentinfo"` attribute
- ❌ Links lack `rel` attributes (should have `rel="noopener"` for external)

---

## B) INTERACTION PATTERNS — รูปแบบการโต้ตอบ

### B1. Form Submission Flow
```
User fills form → Button enabled (via input listeners in app.js)
→ User clicks "เปิดดวงชะตา" → go0() called
→ Skeleton loader shown → "Illusion of Labor" text animation (3 steps × 3.2s)
→ Result injected into #r0 via renderer-individual.js
```

**Implementation:**
- Button state managed by `app.js` event listeners on all inputs
- No form validation feedback (no red borders, no error messages)
- Loading animation uses CSS `@keyframes skeletonPulse` with staggered delays
- Result rendering uses `innerHTML` injection — no virtual DOM

**Issues:**
- ❌ No validation messages shown — if date is empty, button stays disabled silently
- ❌ No error recovery — if calculation fails, user sees no feedback
- ❌ Loading states are cosmetic (3.2s fixed delay), not responsive to actual computation
- ❌ No progress bar during loading — only text changes

### B2. Collapsible Section Behavior
```javascript
// From ui-actions.js — initCollapsibleSections()
document.querySelectorAll('.collapsible-section').forEach(function(section) {
  var body = section.querySelector('.section-body');
  var toggle = section.querySelector('.section-toggle');
  
  toggle.addEventListener('click', function() {
    var willCollapse = !section.classList.contains('collapsed');
    if (willCollapse) {
      var h = body.scrollHeight;
      body.style.setProperty('--section-h', h + 'px');
      body.offsetHeight; // Force reflow
      section.classList.add('collapsed');
    } else {
      section.classList.remove('collapsed');
      requestAnimationFrame(measureHeight);
    }
  });
});
```

**Issues:**
- ❌ Uses CSS custom property `--section-h` for animation — older browsers won't animate
- ❌ No `aria-expanded` attribute toggled on the toggle button
- ❌ No `role="region"` or `aria-controls` linking toggle to content
- ❌ `requestAnimationFrame(measureHeight)` may cause layout shift during expand
- ✅ Force reflow before collapse ensures smooth animation start

### B3. Tab Switching Mechanics
```javascript
// From renderer-shared.js — buildTabs()
btn.addEventListener('click', function() {
  var nextSec = document.getElementById(pre + i);
  // Hide all sections, show target
  document.querySelectorAll('.sec').forEach(s => s.classList.remove('on'));
  nextSec.classList.add('on');
  // Update tab active state
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
});
```

**Issues:**
- ❌ No `aria-selected` attribute on tabs
- ❌ No `role="tablist"`, `role="tab"`, `role="tabpanel"` semantics
- ❌ No keyboard navigation (arrow keys between tabs)
- ❌ Tab switch uses class toggle with CSS transition — no `aria-hidden` management
- ✅ Smooth transition via `.sec.tab-exit` CSS animation

### B4. Smooth Scroll Behavior
```css
html { scroll-behavior: smooth; }
```

And in onboarding.js:
```javascript
valueSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
```

**Issues:**
- ✅ Global smooth scroll via CSS — works for anchor links
- ✅ Programmatic smooth scroll in onboarding dismiss
- ❌ No `scroll-padding-top` set for fixed headers (if any added later)
- ❌ No scroll-to-error when form validation fails

### B5. Loading States / Animations

**Skeleton Loading (`#load`):**
```html
<div id="load">
  <div class="skeleton-wrap" id="skeleton-wrap"></div>
  <div class="skeleton-steps">
    <div class="skeleton-step" style="background:var(--g)"></div>
    × 4
  </div>
  <p id="load-txt">กำลังอ่านดวงชะตาของคุณ...</p>
</div>
```

**Issues:**
- ❌ Skeleton wrap is empty — actual skeleton content is generated by JS
- ❌ No ARIA live region for loading status updates
- ❌ Loading text changes are not announced to screen readers
- ✅ Staggered pulse animation creates nice visual effect

**"Illusion of Labor" Animation:**
```javascript
// 3 text changes over 3.2 seconds
messages = [
  "✨ กำลังคำนวณตำแหน่งดวงดาว...",
  "🔮 กำลังถอดรหัสราศีและลัคนา...",
  "📜 กำลังสร้างพิมพ์เขียวชีวิตของคุณ..."
];
```
- ✅ Creates perceived value
- ❌ Fixed 3.2s delay regardless of actual computation time
- ❌ No actual progress indication

---

## C) ACCESSIBILITY — การเข้าถึง

### C1. ARIA Labels
| Element | Current State | Issue |
|---------|---------------|-------|
| `<html lang="th">` | ✅ Present | Correct |
| Hero section | ✅ `aria-label="ทางลัดเริ่มใช้งาน"` on `.hero-actions` | Good |
| Daily fortune | ✅ `aria-label="ดวงวันนี้"` on section | Good |
| Social proof | ✅ `aria-label="ความน่าเชื่อถือ"` on section | Good |
| Value section | ✅ `aria-label="4 มิติที่จะเปลี่ยนมุมมอง"` | Good |
| Tarot modal | ✅ `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Good |
| Tarot close | ✅ `aria-label="ปิด"` | Good |
| Decorative emojis | ✅ `aria-hidden="true"` on most | Good |

**Missing ARIA:**
- ❌ Mode navigation buttons (`<button class="mnb">`) — no `aria-pressed` or `role="tab"`
- ❌ Form inputs — no `aria-required` on required fields
- ❌ Collapsible sections — no `aria-expanded` on toggles
- ❌ Tab buttons — no `role="tab"`, `aria-selected`
- ❌ Report sections — no `role="region"` or `aria-label`
- ❌ Loading overlay — no `aria-live="polite"` region

### C2. Keyboard Navigation
| Interaction | Keyboard Support | Issue |
|------------|------------------|-------|
| Mode switching | ✅ `<button>` elements are focusable | OK |
| Form submission | ✅ `<button>` in form | OK |
| Tab switching | ❌ No arrow key navigation | Tabs not in `role="tablist"` |
| Collapsible sections | ❌ Enter/Space works (native button), but toggle may not be `<button>` | Verify toggle element type |
| Tarot modal | ❌ No focus trap implemented | Focus can escape modal |
| Modal close | ✅ Has close button | But no Escape key handler |

**Critical Issues:**
- ❌ **No focus management** after dynamic content loads (report sections)
- ❌ **No skip navigation** link for keyboard users
- ❌ **No visible focus styles** beyond browser defaults (`.f input:focus` only changes border)
- ❌ **Canvas animation** (`#cv`) — no mechanism to pause for users with motion sensitivity

### C3. Screen Reader Compatibility
- ❌ Dynamic content injected via `innerHTML` is not announced
- ❌ No `aria-live` regions for status updates (loading, streak counter)
- ❌ Report content is 100% JS-rendered — not crawlable by assistive tech on initial load
- ❌ Social proof numbers are animated — screen readers may read intermediate values
- ❌ Star canvas animation has no pause mechanism for vestibular disorders

---

## D) PERFORMANCE — ประสิทธิภาพ

### D1. Script Loading Order
```html
<!-- 32 scripts total, ALL deferred -->
<script defer src="js/daily-fortune.js?v=2.0.2"></script>
<script defer src="data/cosmic-events-generated.js"></script>
<script defer src="js/cosmic-events.js?v=1.0"></script>
<script defer src="js/share-viral.js?v=2.0.2"></script>
<script defer src="js/social-proof.js?v=2.0.2"></script>
<script defer src="astrology-core.js?v=2.0.2"></script>
<!-- ... 12 more data scripts ... -->
<script defer src="js/renderer-individual.js?v=2.0.2"></script>
<script defer src="js/renderer-couple.js?v=2.0.2"></script>
<script defer src="js/renderer-auspicious.js?v=2.0.2"></script>
<script defer src="js/onboarding.js?v=2.0.2"></script>
<script defer src="js/gamification.js?v=2.0.2"></script>
<script defer src="ui-actions.js?v=2.0.2"></script>
<script defer src="js/analytics.js?v=2.0.2"></script>
<script defer src="js/ab-testing.js?v=2.0.2"></script>
<script defer src="app.js?v=2.0.2"></script>
<!-- Tarot modal -->
<script defer src="js/tarot.js?v=2.0.2"></script>
<script defer src="js/tarot-ui.js?v=2.0.2"></script>
```

**Issues:**
- ❌ **32 separate script files** — each creates a network request (even with HTTP/2, parsing overhead)
- ❌ **No code splitting** — all scripts load even if user only uses Mode 0
- ❌ **Data files loaded eagerly** — `cosmic-events-generated.js`, `thai-astrology-content.js`, etc. load even if not needed
- ❌ **Duplicate `html2canvas`** — loaded in `<head>` AND in `dist/assets/`
- ❌ **No `<link rel="modulepreload">`** for ES modules (using defer instead)
- ✅ All scripts use `defer` — won't block rendering
- ✅ Cache busting with `?v=2.0.2` query strings

### D2. Deferred Loading Patterns
- ✅ `html2canvas.min.js` — deferred (correct)
- ✅ Umami analytics — deferred (correct)
- ✅ All app scripts — deferred (correct)
- ❌ Google Fonts loaded synchronously in `<head>` — blocks first paint
- ❌ No `font-display: swap` specified (Google Fonts may handle this)

### D3. Image Optimization
- ❌ QR payment image (`assets/qr-payment.jpg`) — no `loading="lazy"`, no `width`/`height`
- ❌ OG image (`og-share-story.jpg`) — not optimized for social media dimensions
- ❌ No WebP/AVIF alternatives for images
- ❌ No `<picture>` elements for responsive images

### D4. Critical Rendering Path
- ❌ **No inline critical CSS** — entire `styles.css` (173KB) loads as external
- ❌ **No `<link rel="preload">`** for critical resources
- ❌ **Canvas animation** runs from page load — uses CPU/GPU even before user interacts
- ✅ `scroll-behavior: smooth` in CSS — minimal impact
- ✅ CSS variables (`:root`) enable efficient theme application

---

## E) ISSUES FOUND — ปัญหาที่พบ

### E1. Broken Interactions
| Issue | Severity | Location |
|-------|----------|----------|
| **Duplicate `STARVIA_CONFIG`** — defined twice (line 26-31 and line 292-296), second overrides first | Medium | index.html |
| **Version string `tab-teaser-v1`** — doesn't match semantic versioning `v=2.0.2` | Low | index.html line 400 |
| **`initDailyMantra()` called immediately** — before DOM ready, may fail if `.hd` not yet rendered | Medium | ui-actions.js line 84 |
| **Gender `<option>` IDs unused** — `g0m`, `g0f`, `g0o` never referenced in JS | Low | index.html |
| **`restorePremiumStatus()` called at load** — triggers network request before user interacts | Medium | ui-actions.js line 196 |

### E2. Dead Code
| Code | Location | Issue |
|------|----------|-------|
| `g0m`, `g0f`, `g0o`, `g1am`... option IDs | index.html | Never referenced in JS |
| `g2x` select ID vs `g2` label `for` | index.html line 255 | `<select id="g2x">` but `<label for="g2">` — mismatch! |
| `html2canvas.min.js` loaded twice | index.html lines 22, dist/ | Duplicate load |
| `escapeHTML()` defined in both onboarding.js AND daily-fortune.js | Multiple files | Code duplication |
| `getLS()`, `safeJSON()` defined in 4+ files | Multiple files | Utility duplication |

### E3. Missing States (Empty, Error, Loading)
| State | Current | Needed |
|-------|---------|--------|
| **Form validation error** | None — button stays disabled | Visual error messages on invalid fields |
| **Network error (API)** | Silent failure | User-facing error message with retry |
| **Empty report** | `#r0` stays empty | "Something went wrong" fallback |
| **Daily fortune error** | Default placeholder text | Error state with retry button |
| **Premium unlock failure** | Red flash for 2s | Persistent error with help link |
| **Payment QR expired** | "QR หมดอายุ" text | Clear CTA to regenerate |
| **Tarot daily limit** | Shows limit screen | Back button, upgrade CTA |

### E4. Inconsistent Patterns
| Pattern | Instance A | Instance B | Issue |
|---------|------------|------------|-------|
| **HTML injection** | `innerHTML` in renderers | `insertAdjacentHTML` in onboarding | Inconsistent DOM manipulation |
| **Event binding** | `addEventListener` in JS | `onclick` attributes in HTML | Mixed event handling |
| **State management** | localStorage (onboarding) | localStorage (gamification) | Same key potential conflicts |
| **Error handling** | Try/catch in premium | No catch in form submission | Inconsistent resilience |
| **Font loading** | Google Fonts in `<head>` | No font loading strategy | Blocks rendering |

---

## F) TOP 5 INTERACTION RECOMMENDATIONS — แนะนำ 5 อันดับแรก

### 🥇 1. Add Form Validation Feedback (Impact: HIGH)
**ปัญหา:** ผู้ใช้ไม่รู้ว่าทำไมปุ่มยังกดไม่ได้

**วิธีแก้:**
```html
<!-- เพิ่ม error message elements -->
<div class="f">
  <label for="d0">วันเกิด (ค.ศ.)</label>
  <input id="d0" type="date" required aria-required="true">
  <span class="f-error" id="d0-error" role="alert"></span>
</div>
```
```javascript
// เพิ่ม real-time validation
function validateForm() {
  var d0 = document.getElementById('d0');
  var n0 = document.getElementById('n0');
  var btn0 = document.getElementById('btn0');
  
  if (!d0.value) {
    d0.parentElement.classList.add('f-error-state');
    document.getElementById('d0-error').textContent = 'กรุณาเลือกวันเกิด';
  } else {
    d0.parentElement.classList.remove('f-error-state');
    document.getElementById('d0-error').textContent = '';
  }
  
  btn0.disabled = !(d0.value && n0.value);
}
```

**CSS:**
```css
.f-error-state input { border-color: #F44336; }
.f-error { color: #F44336; font-size: 11px; margin-top: 4px; display: block; }
```

---

### 🥈 2. Implement Focus Management for Modal & Dynamic Content (Impact: HIGH)
**ปัญหา:** Tarot modal ไม่มี focus trap, report content โหลดแล้ว focus ไม่ย้าย

**วิธีแก้:**
```javascript
// Focus trap for tarot modal
function trapFocus(modal) {
  var focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
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

// After reading loads, scroll to and focus the result
function focusReadingResult() {
  var result = document.getElementById('r0');
  if (result) {
    result.setAttribute('tabindex', '-1');
    result.focus();
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

---

### 🥉 3. Add ARIA Live Regions for Dynamic Updates (Impact: MEDIUM-HIGH)
**ปัญหา:** Screen readers ไม่รู้เมื่อ content เปลี่ยน

**วิธีแก้:**
```html
<!-- เพิ่มในหน้าเว็บ -->
<div id="sr-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>
```
```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}
```
```javascript
function announce(message) {
  var el = document.getElementById('sr-announcer');
  if (el) el.textContent = message;
}

// เรียกใช้เมื่อ:
announce('กำลังโหลดรายงาน...'); // Loading
announce('รายงานพร้อมแล้ว');     // Report loaded
announce('ปลดล็อก Premium สำเร็จ'); // Premium unlock
```

---

### 4. Consolidate Duplicate Utilities & Fix Label/Select Mismatch (Impact: MEDIUM)
**ปัญหา:** `escapeHTML()`, `getLS()`, `safeJSON()` ซ้ำกัน 4+ ที่, Label `<label for="g2">` vs `<select id="g2x">` mismatch

**วิธีแก้:**
```javascript
// สร้าง utils.js — single source of truth
var StarviaUtils = {
  escapeHTML: function(str) { /* ... */ },
  getLS: function() { /* ... */ },
  safeJSON: function(str) { /* ... */ },
  getTodayKey: function() { /* ... */ },
  seededRandom: function(seed) { /* ... */ }
};

// ใช้ StarviaUtils.escapeHTML() แทน escapeHTML() ทุกที่
```

**Fix label mismatch:**
```html
<!-- Before (broken) -->
<label for="g2">เพศ</label>
<select id="g2x">

<!-- After (fixed) -->
<label for="g2">เพศ</label>
<select id="g2">
```

---

### 5. Implement Progressive Loading & Code Splitting (Impact: MEDIUM)
**ปัญหา:** โหลด 32 scripts ทั้งที่ผู้ใช้ Mode 0 อาจไม่ต้องการ Mode 1-2

**วิธีแก้:**
```javascript
// Dynamic import for mode-specific scripts
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

// เรียกใช้เมื่อ switch mode
function setMode(m) {
  loadMode(m).then(function() {
    // ... render mode content
  });
}
```

**Impact:** Reduces initial payload by ~40% for Mode 0 users (couple/auspicious data scripts deferred)

---

## G) ADDITIONAL FINDINGS — ผลการวิเคราะห์เพิ่มเติม

### G1. Canvas Animation Performance
```javascript
// app.js — runs on every page load
var cv = document.getElementById('cv');
var cx = cv.getContext('2d');
function dS() {
  cx.clearRect(0, 0, cv.width, cv.height);
  ST.forEach(function(s) { /* draw 80 stars */ });
  requestAnimationFrame(dS);
}
```
- ❌ 80 stars animated continuously — battery drain on mobile
- ❌ No `prefers-reduced-motion` check
- ❌ Canvas resizes on every window resize without debouncing

**Fix:**
```javascript
// Add motion preference check
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Draw stars once, no animation
  drawStars();
} else {
  dS(); // Animate
}

// Debounce resize
var resizeTimer;
addEventListener('resize', function() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(iS, 150);
});
```

### G2. localStorage Key Conflicts
Multiple modules use localStorage:
- `starvia_onboarding` (Onboarding)
- `starvia_streak` (StreakTracker + DailyFortune)
- `starvia_gamification` (Gamification)
- `starvia_streak_premium` (StreakReward)
- `starvia_streak_discount` (StreakReward)
- `starviaPremiumToken` (Premium)
- `starvia_version` (Cache busting)
- `starvia_display_name` (Payment)
- `starvia_email` (Payment)
- `onboarding_previewed` (Onboarding)

**Risk:** `starvia_streak` is used by BOTH `daily-fortune.js` (line 11) AND `streak-tracker.js` (line 7) — they read/write the same key with different data structures!

### G3. Inline Styles in Footer
The entire footer (lines 277-287) uses inline styles instead of CSS classes. This:
- Makes responsive design harder
- Prevents consistent theming
- Increases HTML payload slightly

### G4. Missing `noscript` Fallback
No `<noscript>` tag exists — users with JS disabled see a blank page with only the canvas and form.

### G5. Version Cache Busting Inconsistency
- Scripts use `?v=2.0.2` query strings
- But the version banner uses `APP_VERSION = "tab-teaser-v1"`
- These don't match, causing potential cache confusion

---

## H) SUMMARY — สรุป

| Category | Score | Notes |
|----------|-------|-------|
| HTML Structure | 6/10 | Good semantic base, but footer inline styles and empty report containers |
| Interaction Patterns | 7/10 | Smooth animations, but missing validation feedback and error states |
| Accessibility | 4/10 | Basic ARIA labels present, but no focus management, keyboard nav, or live regions |
| Performance | 5/10 | 32 scripts, no code splitting, canvas runs always, no critical CSS |
| Code Quality | 6/10 | Consistent patterns mostly, but duplicate utilities and label mismatches |

**Priority Actions:**
1. 🔴 Fix label/select ID mismatch (`g2x` vs `g2`)
2. 🔴 Add form validation visual feedback
3. 🟡 Implement focus trap for tarot modal
4. 🟡 Add `aria-live` regions for dynamic content
5. 🟡 Consolidate duplicate utility functions into shared module
6. 🟢 Add `prefers-reduced-motion` for canvas
7. 🟢 Implement progressive script loading
8. 🟢 Add `<noscript>` fallback
9. 🟢 Move footer inline styles to CSS
10. 🟢 Align version strings across codebase
