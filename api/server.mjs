import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

import { createPremiumRequestHandler, loadPremiumConfig } from './premium-service.mjs';
import { createAdminRequestHandler, loadAdminConfig } from './admin-service.mjs';
import { subscribe, getSubscribers, getSubscriberCount, unsubscribe } from './newsletter-service.mjs';
import { getLotteryResults, refreshLotteryResults, setManualResults } from './lottery-service.mjs';
import { createStreakReward, verifyStreakReward, getRewardStats } from './streak-service.mjs';
import { createPaymentHandler } from './payment-service.mjs';

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

// Payment handler (Omise) — gracefully disabled if no API key
let paymentHandler = null;
try {
  if (process.env.OMISE_SECRET_KEY) {
    paymentHandler = createPaymentHandler();
    console.log('STARVIA Payment API (Omise) loaded');
  } else {
    console.log('STARVIA Payment API skipped: OMISE_SECRET_KEY not set');
  }
} catch (err) {
  console.log('STARVIA Payment API skipped:', err.message);
}

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
  
  // GET /v1/newsletter/count (public)
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
  
  return null; // Not handled
}

// ── Lottery Handler ──
async function handleLottery(req, res) {
  const url = req.url || '/';
  
  // GET /v1/lottery/results
  if (req.method === 'GET' && url === '/v1/lottery/results') {
    const results = getLotteryResults();
    return writeJson(res, 200, { success: true, ...results });
  }
  
  // POST /v1/lottery/refresh
  if (req.method === 'POST' && url === '/v1/lottery/refresh') {
    try {
      const results = await refreshLotteryResults();
      return writeJson(res, 200, { success: true, ...results });
    } catch (err) {
      return writeJson(res, 500, { success: false, error: err.message });
    }
  }
  
  // POST /v1/lottery/manual
  if (req.method === 'POST' && url === '/v1/lottery/manual') {
    try {
      const body = await readJsonBody(req);
      const result = setManualResults(body);
      return writeJson(res, 200, result);
    } catch (err) {
      return writeJson(res, 400, { success: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }
  }
  
  return null; // Not handled
}

// ── Streak Reward Handler ──
async function handleStreak(req, res) {
  const url = req.url || '/';
  
  // POST /v1/streak/create
  if (req.method === 'POST' && url === '/v1/streak/create') {
    try {
      const body = await readJsonBody(req);
      const result = createStreakReward(body);
      return writeJson(res, result.success ? 200 : 400, result);
    } catch (err) {
      return writeJson(res, 400, { success: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }
  }
  
  // POST /v1/streak/verify
  if (req.method === 'POST' && url === '/v1/streak/verify') {
    try {
      const body = await readJsonBody(req);
      const result = verifyStreakReward(body);
      return writeJson(res, result.success ? 200 : 400, result);
    } catch (err) {
      return writeJson(res, 400, { success: false, error: 'ข้อมูลไม่ถูกต้อง' });
    }
  }
  
  // GET /v1/streak/stats
  if (req.method === 'GET' && url === '/v1/streak/stats') {
    const stats = getRewardStats();
    return writeJson(res, 200, { success: true, ...stats });
  }
  
  return null; // Not handled
}

// ── Main Request Handler ──
const server = http.createServer(async (req, res) => {
  const url = req.url || '/';
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Try newsletter handler
  const newsletterResult = await handleNewsletter(req, res);
  if (newsletterResult !== null) return;
  
  // Try lottery handler
  const lotteryResult = await handleLottery(req, res);
  if (lotteryResult !== null) return;
  
  // Try streak handler
  const streakResult = await handleStreak(req, res);
  if (streakResult !== null) return;
  
  // Payment endpoints (Omise)
  if (url.startsWith('/v1/payment/') && paymentHandler) {
    const handled = await paymentHandler(req, res);
    if (handled !== false) return;
  }

  // Premium endpoints
  if (url.startsWith('/v1/premium/')) {
    return premiumHandler(req, res);
  }
  
  // Admin endpoints
  if (url.startsWith('/v1/admin/') || url === '/admin.html') {
    if (adminHandler) {
      return adminHandler(req, res);
    } else {
      return writeJson(res, 404, { success: false, error: 'Admin API not configured' });
    }
  }
  
  // Health check
  if (url === '/healthz') {
    return writeJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  }
  
  // Static file serving
  let filePath = path.join(STATIC_ROOT, url === '/' ? 'index.html' : url);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    // Try index.html for SPA routing
    try {
      const indexPath = path.join(STATIC_ROOT, 'index.html');
      const content = fs.readFileSync(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    } catch (indexErr) {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

server.listen(port, host, () => {
  console.log(`STARVIA API running on http://${host}:${port}`);
});
