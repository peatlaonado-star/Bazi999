# STARVIA Phase 4A Render Helper Extraction Plan

> **For Hermes:** Use static-web-refactoring + test-driven-development. Preserve behavior first; split structure second.

**Goal:** Reduce `astro-renderers.js` size and coupling by extracting shared pure helper functions into a dedicated browser-global helper file without changing user-visible behavior.

**Architecture:** Keep the current non-module script loading model for this slice. Add `js/reading-helpers.js` loaded after `data/thai-astrology-content.js` and before `astro-renderers.js`. Existing renderers keep using globals (`escapeHTML`, `buildKarmaMirror`, `getCoupleDharmaType`) so this refactor is small and reversible.

**Tech Stack:** Vanilla JS, Vite static scripts, Vitest, jsdom, Node `vm` tests.

---

## Task 1: Add script load-order characterization

**Objective:** Prove the new helper file is loaded before renderer code.

**Files:**
- Modify: `tests/content.test.js`
- Modify: `index.html`

**Steps:**
1. Add test expecting `js/reading-helpers.js` to appear in `index.html` after `data/thai-astrology-content.js` and before `astro-renderers.js`.
2. Run `npm test` and verify RED.
3. Add script tag in the correct order.
4. Run `npm test` and verify GREEN.

---

## Task 2: Extract pure helpers

**Objective:** Move pure helpers out of `astro-renderers.js` while keeping browser globals intact.

**Files:**
- Create: `js/reading-helpers.js`
- Modify: `astro-renderers.js`
- Modify: tests that load renderers in a VM context
- Modify: `package.json` `check:js`

**Move these definitions:**
- `escapeHTML`
- `FALLBACK_KARMA_MIRROR`
- `buildKarmaMirror`
- `FALLBACK_COUPLE_DHARMA`
- `getCoupleDharmaType`

**Verification:**
- `npm test`
- `npm run check:js`
- `npm run build`

---

## Acceptance Criteria

- All 42+ tests pass.
- Build succeeds.
- `astro-renderers.js` no longer defines the extracted helpers.
- `index.html` load order is: astrology core -> Thai content -> reading helpers -> renderers -> UI actions -> app.
- One commit documents this Phase 4A slice.
