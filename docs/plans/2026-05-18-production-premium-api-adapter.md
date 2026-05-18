# STARVIA Production Premium API Adapter Implementation Plan

> **For Hermes:** Use test-driven-development + static-web-refactoring. Preserve demo mode for local testing, but add a real backend adapter path for production.

**Goal:** Replace the commented-out premium backend flow with a tested production API adapter controlled by frontend config, while keeping the current demo PIN available only when demo mode is enabled.

**Architecture:** Add a small config resolver in `ui-actions.js` that reads `window.STARVIA_CONFIG`. `verifyPin()` should use local demo pins when `demoMode !== false`, and call `POST /premium/verify` when `demoMode === false`. The adapter should return a Promise so tests and future UI can await completion.

**Tech Stack:** Vanilla JavaScript, browser globals, Vitest, Node `vm` test harness.

---

## Task 1: Add production-mode failing tests

**Objective:** Prove `verifyPin()` can call a backend endpoint when demo mode is disabled.

**Files:**
- Modify: `tests/premium.test.js`

**Tests:**
1. With `window.STARVIA_CONFIG = { demoMode: false, apiBaseUrl: 'https://api.example.test/v1' }`, `verifyPin()` should call:
   - `https://api.example.test/v1/premium/verify`
   - method `POST`
   - JSON body `{ pin: 'ABC123' }`
   - then call `onPremiumVerified('token-123')` on `{ success: true, token: 'token-123' }`.
2. On `{ success: false }`, it should call `onPremiumFailed()`.

**Expected RED:** `fetch` is not called because current `verifyPin()` always uses hardcoded demo mode.

---

## Task 2: Implement config resolver and backend adapter

**Objective:** Add production path without breaking local demo tests.

**Files:**
- Modify: `ui-actions.js`

**Implementation notes:**
- Add `getStarviaConfig()`.
- Default should preserve current behavior: demo mode on, demo pin `STAR199`.
- When `demoMode === false`, call `fetch(apiBaseUrl + '/premium/verify', ...)`.
- Return the Promise from `verifyPin()` in production mode.
- Keep `onPremiumVerified(token)` and `onPremiumFailed()` as the single UI update paths.

---

## Task 3: Document config and production status

**Objective:** Make deployment behavior explicit.

**Files:**
- Modify: `docs/PAYMENT_API_CONTRACT.md`
- Modify: `docs/STARVIA_TH_PRODUCT_ROADMAP.md`

**Docs:**
- Add frontend config example:

```html
<script>
window.STARVIA_CONFIG = {
  demoMode: false,
  apiBaseUrl: 'https://api.starvia.app/v1'
};
</script>
```

- Mark production adapter as implemented, while actual backend/payment gateway remains future work.

---

## Verification

Run:

```bash
npm test
npm run check:js
npm run build
git status --short
```

Expected:
- All tests pass.
- Existing demo PIN tests still pass.
- New production API tests pass.
- Build succeeds.
