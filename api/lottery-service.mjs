import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary: runtime file (ephemeral)
const RESULTS_FILE = path.resolve(process.cwd(), 'data', 'lottery-results.json');
// Fallback: committed seed file (persists across deploys)
const SEED_FILE = path.resolve(__dirname, '..', 'data', 'lottery-results.json');

function ensureDataDir() {
  const dir = path.dirname(RESULTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read cached results — try runtime first, then seed
function getCachedResults() {
  try {
    ensureDataDir();
    if (fs.existsSync(RESULTS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
      if (parsed && parsed.firstPrize) return parsed;
    }
  } catch (e) {
    // ignore
  }
  // Fallback: load from committed seed file
  try {
    if (fs.existsSync(SEED_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
      if (parsed && parsed.firstPrize) {
        console.log('[lottery] Loaded from seed file');
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(parsed, null, 2), 'utf8');
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// Write results to cache
function cacheResults(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

// Fetch latest results from GLO API
function fetchFromGLO() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({});
    const options = {
      hostname: 'www.glo.or.th',
      path: '/api/lottery/getLatestLottery',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status && parsed.response) {
            resolve(parsed.response);
          } else {
            reject(new Error('GLO API returned unexpected response'));
          }
        } catch (e) {
          reject(new Error('Failed to parse GLO response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData);
    req.end();
  });
}

// Extract key numbers from the full response
function extractSummary(response) {
  const data = response.data || {};
  return {
    date: response.date || '',
    displayDate: response.displayDate || {},
    period: response.period || [],
    // รางวัลที่ 1
    firstPrize: (data.first && data.first.number && data.first.number[0]) 
      ? data.first.number[0].value : null,
    // เลขหน้า 3 ตัว
    last3f: (data.last3f && data.last3f.number)
      ? data.last3f.number.map(n => n.value) : [],
    // เลขท้าย 3 ตัว
    last3b: (data.last3b && data.last3b.number)
      ? data.last3b.number.map(n => n.value) : [],
    // เลขท้าย 2 ตัว
    last2: (data.last2 && data.last2.number)
      ? data.last2.number.map(n => n.value) : [],
    // เลขข้างเคียงรางวัลที่ 1
    near1: (data.near1 && data.near1.number)
      ? data.near1.number.map(n => n.value) : [],
    // ครบชุดสำหรับ check
    raw: data
  };
}

// Public API
export function getLotteryResults() {
  const cached = getCachedResults();
  return cached || { available: false, message: 'ยังไม่มีข้อมูลผลหวย' };
}

export async function refreshLotteryResults() {
  try {
    const response = await fetchFromGLO();
    const summary = extractSummary(response);
    
    // Check if results have actual data (prize numbers exist)
    if (summary.firstPrize || summary.last2.length > 0) {
      cacheResults({ available: true, ...summary, updatedAt: new Date().toISOString() });
      return { success: true, message: 'อัปเดตผลหวยสำเร็จ', data: summary };
    }
    
    // GLO returned but no prize data yet (before draw)
    return { success: false, message: 'ยังไม่ออกรางวัล', data: null };
  } catch (err) {
    return { success: false, message: 'ไม่สามารถเชื่อมต่อ GLO API: ' + err.message, data: null };
  }
}

// Manual results override (for when GLO API is slow)
export function setManualResults(data) {
  if (!data || !data.firstPrize) {
    return { success: false, message: 'Missing required fields: firstPrize' };
  }
  
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  let displayDate = data.displayDate;
  if (!displayDate || (!displayDate.date && !displayDate.month && !displayDate.year)) {
    const parts = dateStr.split('-');
    displayDate = { date: parts[2] || '', month: parts[1] || '', year: parts[0] || '' };
  }
  
  const result = {
    available: true,
    date: dateStr,
    displayDate,
    period: data.period || [],
    firstPrize: data.firstPrize,
    last3f: data.last3f || [],
    last3b: data.last3b || [],
    last2: data.last2 || [],
    near1: data.near1 || [],
    updatedAt: new Date().toISOString(),
    source: 'manual'
  };
  
  cacheResults(result);
  return { success: true, message: 'Manual results saved', data: result };
}
