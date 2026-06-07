# STARVIA Browser Premium Smoke Test — 2026-05-19

## Scope

Manual-sale Premium flow on local staging:

1. Issue a one-time PIN with `npm run pin:issue`.
2. Start backend with `STARVIA_PIN_STORE_FILE`.
3. Start Vite frontend.
4. Fill individual reading form.
5. Render Thai Life Blueprint.
6. Open Premium unlock modal.
7. Verify PIN against backend.
8. Confirm locked sections unlock and token persists.
9. Reload and restore Premium status from `/premium/status`.

## Environment

- Frontend: `http://127.0.0.1:5173/index.html`
- Backend: `http://127.0.0.1:8787/v1`
- Test PIN: `BROWSER199` in a temporary local PIN store

## Findings

### Fixed during this smoke test

Browser execution exposed a real load-order bug in `ui-actions.js`:

- `initDailyMantra()` referenced `CL` before `app.js` defined it.
- The exception stopped the rest of `ui-actions.js` from initializing `_premiumState`.
- As a result, `isPremiumUnlocked()` existed due function hoisting but failed at runtime with `_premiumState` undefined.

Fixes applied:

- Guard language check with `typeof CL !== 'undefined' && CL === 'en'`.
- Stop syncing legacy boolean state to `window.isPremiumUnlocked`, because that name collides with the `isPremiumUnlocked()` function in browser globals.
- Use `window.isPremiumUnlockedFlag` as the temporary boolean mirror instead.
- Added VM regression tests for browser-global behavior.

## Result after fix

- `isPremiumUnlocked()` initializes correctly in browser.
- Reading form renders results.
- Premium modal opens.
- PIN verification succeeds through backend.
- `.is-locked` count changes from 6 to 0.
- `localStorage.starviaPremiumToken` is saved.
- Reload + `restorePremiumStatus()` returns active and unlocks Premium.

## Verification commands

```bash
npm test
npm run check:js
npm run build
```

Latest passing result:

- Test files: 12 passed
- Tests: 78 passed
- Syntax check: passed
- Build: passed, including copied legal pages and plain-script assets

## Notes

The browser tool continued reporting blank historic exception entries after the fix, but direct DOM/state probes confirmed the Premium flow completed successfully after the guarded `CL` fix.
