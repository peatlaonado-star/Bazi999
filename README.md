# STARVIA split build

Files:
- `index.html` — page shell
- `styles.css` — extracted styles
- `astrology-core.js` — astrology helpers and calculations
- `astro-renderers.js` — renderers for the 3 reading modes
- `ui-actions.js` — image export, premium, and modal actions
- `app.js` — bootstrap and event binding
- `assets/` — local static assets
- `dist/` — minified production build

Notes:
- External fonts/CDN/remote images were replaced with local assets where practical.
- The source files stay readable for maintenance; the `dist/` folder is the deploy-ready, minified output.
- Behavior should remain the same.

Product direction:
- STARVIA is being developed as a modern Thai astrology life-map system, not a generic horoscope page.
- Current roadmap: `docs/STARVIA_TH_PRODUCT_ROADMAP.md`
- Current backend plan: `docs/plans/2026-05-18-premium-verify-backend-api.md`
- Payment API contract: `docs/PAYMENT_API_CONTRACT.md`

Backend API:
- `api/premium-service.mjs` — premium PIN verification and token issuing logic
- `api/server.mjs` — Node HTTP server for `POST /v1/premium/verify`
- Local start example:
  ```bash
  STARVIA_PREMIUM_PINS="STAR199" STARVIA_JWT_SECRET="replace-with-long-random-secret" npm run api:start
  ```
