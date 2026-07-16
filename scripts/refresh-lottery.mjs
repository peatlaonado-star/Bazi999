#!/usr/bin/env node
/**
 * Refresh lottery results — scrape from sanook.com
 * Run on 1st and 16th of each month at 16:15
 * Updates data/lottery-results.json
 */
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve results file: when running from ~/Starvia/scripts/, use project data dir;
// otherwise (e.g. cron from ~/.hermes/scripts/) use ~/.hermes/data/ with auto-mkdir
function resolveResultsFile() {
  const projectData = path.resolve(__dirname, '..', 'data', 'lottery-results.json');
  const hermesDataDir = path.resolve(process.env.HOME || '/root', '.hermes', 'data');
  const hermesData = path.join(hermesDataDir, 'lottery-results.json');
  // If script is inside the STARVIA project, prefer the project's data/ (next to scripts/)
  const isInStarviaProject = __dirname === '/home/kara/Starvia/scripts' || __dirname.endsWith('/Starvia/scripts');
  if (isInStarviaProject && fs.existsSync(path.dirname(projectData))) {
    return projectData;
  }
  // Otherwise use ~/.hermes/data/ (auto-create)
  try { fs.mkdirSync(hermesDataDir, { recursive: true }); } catch (e) {}
  return hermesData;
}
const RESULTS_FILE = resolveResultsFile();

// Load admin password for pushing to Cloudflare KV
function loadAdminPassword() {
  // 1. Env var (best for cron — set in job env)
  if (process.env.STARVIA_ADMIN_PASSWORD) return process.env.STARVIA_ADMIN_PASSWORD;
  // 2. ~/.hermes/.env
  const hermesEnv = path.resolve(process.env.HOME || '/root', '.hermes', '.env');
  if (fs.existsSync(hermesEnv)) {
    try {
      const content = fs.readFileSync(hermesEnv, 'utf8');
      const m = content.match(/^STARVIA_ADMIN_PASSWORD\s*=\s*["']?([^"'\n]+)["']?/m);
      if (m) return m[1].trim();
    } catch {}
  }
  // 3. ~/Starvia/.env
  const starviaEnv = path.resolve(process.env.HOME || '/root', 'Starvia', '.env');
  if (fs.existsSync(starviaEnv)) {
    try {
      const content = fs.readFileSync(starviaEnv, 'utf8');
      const m = content.match(/^STARVIA_ADMIN_PASSWORD\s*=\s*["']?([^"'\n]+)["']?/m);
      if (m) return m[1].trim();
    } catch {}
  }
  return null;
}

// Push to Cloudflare KV via admin login → /v1/lottery/manual
// This makes the new lottery data visible on starvia.website (frontend reads from KV)
async function pushToCloudflare(results, apiBase, password) {
  if (!password) {
    console.log('[lottery] ⚠ No STARVIA_ADMIN_PASSWORD — skipping CF push (KV will only update on next API hit)');
    return false;
  }
  try {
    // Step 1: login → get JWT
    const loginBody = JSON.stringify({ password });
    const loginRes = await postJson(`${apiBase}/admin/login`, loginBody);
    if (!loginRes.token) {
      console.log(`[lottery] ⚠ Login failed: ${JSON.stringify(loginRes)}`);
      return false;
    }
    // Step 2: POST lottery/manual with JWT
    const manualBody = JSON.stringify({
      date: results.date,
      displayDate: results.displayDate,
      firstPrize: results.firstPrize,
      last3f: results.last3f,
      last3b: results.last3b,
      last2: results.last2,
      near1: results.near1,
    });
    const manualRes = await postJson(`${apiBase}/lottery/manual`, manualBody, loginRes.token);
    if (manualRes.success) {
      console.log(`[lottery] ✅ Pushed to Cloudflare KV: ${results.firstPrize}`);
      return true;
    }
    console.log(`[lottery] ⚠ Manual push failed: ${JSON.stringify(manualRes)}`);
    return false;
  } catch (e) {
    console.log(`[lottery] ⚠ CF push error: ${e.message}`);
    return false;
  }
}

function postJson(url, body, bearerToken = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const data = Buffer.from(body, 'utf8');
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    };
    if (bearerToken) headers['Authorization'] = `Bearer ${bearerToken}`;
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + (u.search || ''),
      method: 'POST',
      headers,
      timeout: 15000,
    }, (res) => {
      let respData = '';
      res.on('data', c => respData += c);
      res.on('end', () => {
        try { resolve(JSON.parse(respData)); }
        catch { resolve({ success: false, raw: respData }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(data);
    req.end();
  });
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractFromSanook(html) {
  // Find the lottoResult JSON by brace-matching
  const startMarker = 'var lottoResult = ';
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return null;
  const jsonStart = startIdx + startMarker.length;
  let depth = 0, endIdx = jsonStart;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') depth--;
    if (depth === 0) { endIdx = i + 1; break; }
  }
  
  try {
    const data = JSON.parse(html.substring(jsonStart, endIdx));
    const p = data.prize;
    if (!p || !p.prize_1) return null;

    // Determine draw date from page title
    const dateMatch = html.match(/งวดวันที่\s*(\d+)\s*(\S+)\s*(\d+)/);
    let drawDate = new Date();
    if (dateMatch) {
      const thaiMonths = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
        'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
      const monthIdx = thaiMonths.indexOf(dateMatch[2]);
      if (monthIdx >= 0) {
        const y = parseInt(dateMatch[3]) - 543;
        const m = monthIdx;
        const d = parseInt(dateMatch[1]);
        drawDate = new Date(y, m, d, 12, 0, 0); // noon to avoid timezone issues
      }
    }

    return {
      available: true,
      date: drawDate.toISOString().split('T')[0],
      displayDate: {
        date: String(drawDate.getDate()).padStart(2, '0'),
        month: String(drawDate.getMonth() + 1).padStart(2, '0'),
        year: String(drawDate.getFullYear())
      },
      period: [],
      firstPrize: p.prize_1,
      last3f: p.prize_first3 || [],
      last3b: p.prize_last3 || [],
      last2: [p.prize_last2 || ''],
      near1: p.prize1_close || [],
      updatedAt: new Date().toISOString(),
      source: 'sanook.com'
    };
  } catch (e) {
    console.error('[lottery] Parse error:', e.message);
    return null;
  }
}

async function main() {
  // Determine which draw date to look for
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  
  // Build the URL for sanook (format: DDMMYYYY in Buddhist Era)
  const yy = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  const beYear = now.getFullYear() + 543; // Convert CE to BE
  const urlDate = `${yy}${mm}${beYear}`;
  
  const url = `https://news.sanook.com/lotto/check/${urlDate}/`;
  console.log(`[lottery] Fetching from: ${url}`);
  
  try {
    const html = await fetch(url);
    const results = extractFromSanook(html);
    
    if (!results || !results.firstPrize) {
      console.log('[lottery] No results found — maybe draw hasn\'t happened yet');
      process.exit(0);
    }

    // Check if newer than existing — check BOTH project data AND hermes data
    // (cron runs from ~/.hermes/scripts/ so checks ~/.hermes/data/; manual runs check project data)
    function readExisting(path) {
      try { return JSON.parse(fs.readFileSync(path, 'utf8')); } catch { return {}; }
    }
    const projectExisting = fs.existsSync(RESULTS_FILE) ? readExisting(RESULTS_FILE) : {};
    const hermesData = path.resolve(process.env.HOME || '/root', '.hermes', 'data', 'lottery-results.json');
    const hermesExisting = fs.existsSync(hermesData) ? readExisting(hermesData) : {};

    // Use whichever has a fresher date as the reference
    const refDate = [projectExisting.date, hermesExisting.date].filter(Boolean).sort().pop() || '';
    const refPrize = (refDate === projectExisting.date ? projectExisting.firstPrize : hermesExisting.firstPrize) || '';
    const refUpdatedAt = (refDate === projectExisting.date ? projectExisting.updatedAt : hermesExisting.updatedAt) || '';

    // Skip ONLY if both same date AND same prize AND very fresh (<30 min old) — otherwise push to CF
    const ageMs = refUpdatedAt ? (Date.now() - new Date(refUpdatedAt).getTime()) : Infinity;
    const isFresh = ageMs < 30 * 60 * 1000;

    if (refDate === results.date && refPrize === results.firstPrize && isFresh) {
      console.log(`[lottery] Already up to date: ${results.date} — ${results.firstPrize} (age: ${Math.round(ageMs/60000)}min)`);
      process.exit(0);
    }

    if (refDate === results.date && refPrize === results.firstPrize) {
      console.log(`[lottery] Same data but ${Math.round(ageMs/60000)}min old — will re-push to CF KV`);
    }

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf8');
    console.log(`[lottery] ✅ Updated! ${results.date} — First prize: ${results.firstPrize}`);
    console.log(`[lottery] Last 3 front: ${results.last3f.join(', ')}`);
    console.log(`[lottery] Last 3 back: ${results.last3b.join(', ')}`);
    console.log(`[lottery] Last 2: ${results.last2.join(', ')}`);

    // Push to Cloudflare KV so frontend (starvia.website) shows the new data
    const apiBase = process.env.STARVIA_API_BASE || 'https://starvia.website/v1';
    const password = loadAdminPassword();
    await pushToCloudflare(results, apiBase, password);
    
  } catch (err) {
    console.error('[lottery] ❌ Error:', err.message);
    process.exit(1);
  }
}

main();
