import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

import { createPremiumRequestHandler, loadPremiumConfig } from './premium-service.mjs';
import { createAdminRequestHandler, loadAdminConfig } from './admin-service.mjs';

const port = Number(process.env.PORT || process.env.STARVIA_API_PORT || 8787);
const host = process.env.HOST || '0.0.0.0';

// Static file root — relative to project root when running from starvia-split/
const STATIC_ROOT = path.resolve(process.cwd(), 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

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

// ── Static file server ──

function serveStatic(req, res) {
  let urlPath = req.url || '/';
  // Clean the path
  if (urlPath.includes('?')) urlPath = urlPath.split('?')[0];
  if (urlPath.includes('#')) urlPath = urlPath.split('#')[0];

  // SPA fallback: serve index.html for non-file paths
  let filePath = path.join(STATIC_ROOT, urlPath === '/' ? 'index.html' : urlPath);

  // If path doesn't have an extension, it's a client-side route → serve index.html
  if (!path.extname(filePath)) {
    filePath = path.join(STATIC_ROOT, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Try index.html as last resort for SPA
      if (filePath !== path.join(STATIC_ROOT, 'index.html')) {
        fs.readFile(path.join(STATIC_ROOT, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data2);
        });
        return;
      }
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  // CORS for API routes
  if (url.startsWith('/v1/')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Route admin paths to admin handler
    if (adminHandler && url.startsWith('/v1/admin')) {
      return adminHandler(req, res);
    }
    // Everything else goes to premium handler
    return premiumHandler(req, res);
  }

  // Serve static files
  return serveStatic(req, res);
});

server.listen(port, host, () => {
  console.log(`STARVIA API + Static on http://${host}:${port}`);
  console.log(`  Static root: ${STATIC_ROOT}`);
});
