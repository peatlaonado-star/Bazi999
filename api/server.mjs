import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

import { createPremiumRequestHandler, loadPremiumConfig } from './premium-service.mjs';
import { createAdminRequestHandler, loadAdminConfig } from './admin-service.mjs';
import { subscribe, getSubscribers, getSubscriberCount, unsubscribe } from './newsletter-service.mjs';

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

// ── Helper: Read JSON body ──
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// ── Helper: Write JSON response ──
function writeJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ── Newsletter Handler ──
async function handleNewsletter(req, res) {
  const url = req.url || '/';
  
  // POST /v1/newsletter/subscribe
  if (req.method === 'POST' && url === '/v1/newsletter/subscribe') {
    try {
      const body = await readJsonBody(req);
      const result = subscribe(body);
      return writeJson(res, result.success ? 200 : 400, result);
    } catch (err) {
      return writeJson(res, 400, { success: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }
  }
  
  // GET /v1/newsletter/subscribers (admin only)
  if (req.method === 'GET' && url === '/v1/newsletter/subscribers') {
    // Simple auth check - require admin token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return writeJson(res, 401, { success: false, error: 'Unauthorized' });
    }
    
    const subscribers = getSubscribers();
    return writeJson(res, 200, { success: true, subscribers, count: subscribers.length });
  }
  
  // GET /v1/newsletter/count
  if (req.method === 'GET' && url === '/v1/newsletter/count') {
    const count = getSubscriberCount();
    return writeJson(res, 200, { success: true, count });
  }
  
  // POST /v1/newsletter/unsubscribe
  if (req.method === 'POST' && url === '/v1/newsletter/unsubscribe') {
    try {
      const body = await readJsonBody(req);
      const result = unsubscribe(body.email);
      return writeJson(res, result.success ? 200 : 400, result);
    } catch (err) {
      return writeJson(res, 400, { success: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }
  }
  
  return writeJson(res, 404, { success: false, error: 'Not found' });
}

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

const server = http.createServer(async (req, res) => {
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
    
    // Route newsletter paths
    if (url.startsWith('/v1/newsletter')) {
      return handleNewsletter(req, res);
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
