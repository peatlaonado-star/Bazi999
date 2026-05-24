import http from 'node:http';

import { createPremiumRequestHandler, loadPremiumConfig } from './premium-service.mjs';
import { createAdminRequestHandler, loadAdminConfig } from './admin-service.mjs';

const port = Number(process.env.PORT || process.env.STARVIA_API_PORT || 8787);
const host = process.env.HOST || '0.0.0.0';

const premiumConfig = loadPremiumConfig(process.env);

let adminConfig = null;
let adminHandler = null;
try {
  adminConfig = loadAdminConfig(process.env);
  adminHandler = createAdminRequestHandler(adminConfig);
  console.log('STARVIA Admin API loaded');
} catch (err) {
  console.log('STARVIA Admin API skipped:', err.message);
}

const premiumHandler = createPremiumRequestHandler(premiumConfig);

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  // Route admin paths to admin handler
  if (adminHandler && url.startsWith('/v1/admin')) {
    return adminHandler(req, res);
  }
  // Everything else goes to premium handler
  return premiumHandler(req, res);
});

server.listen(port, host, () => {
  console.log(`STARVIA API listening on http://${host}:${port}`);
});
