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
