import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const REWARDS_FILE = path.resolve(process.cwd(), 'data', 'streak-rewards.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(REWARDS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read rewards store
function readRewards() {
  try {
    ensureDataDir();
    if (fs.existsSync(REWARDS_FILE)) {
      return JSON.parse(fs.readFileSync(REWARDS_FILE, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return { rewards: [] };
}

// Write rewards store
function writeRewards(data) {
  try {
    ensureDataDir();
    fs.writeFileSync(REWARDS_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}

// Generate unique streak reward code
function generateRewardCode() {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `STREAK-${random}`;
}

// Create fingerprint from request (for rate limiting)
function createFingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  return crypto.createHash('sha256').update(`${ua}:${ip}`).digest('hex').slice(0, 16);
}

// Check if user already claimed reward this month
function hasClaimedThisMonth(fingerprint) {
  const store = readRewards();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  return store.rewards.some(r => 
    r.fingerprint === fingerprint && 
    r.claimedAt && 
    r.claimedAt.startsWith(currentMonth)
  );
}

// Create a new streak reward
export function createStreakReward(req) {
  const fingerprint = createFingerprint(req);
  
  // Rate limit: 1 per month per user
  if (hasClaimedThisMonth(fingerprint)) {
    return {
      success: false,
      error: 'ALREADY_CLAIMED',
      message: 'คุณรับรางวัลเดือนนี้ไปแล้ว เดือนหน้ามาใหม่นะคะ!'
    };
  }
  
  const code = generateRewardCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  
  const reward = {
    code,
    fingerprint,
    claimedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false,
    type: 'streak_7day'
  };
  
  const store = readRewards();
  store.rewards.push(reward);
  writeRewards(store);
  
  return {
    success: true,
    code,
    expiresAt: expiresAt.toISOString(),
    message: 'ปลดล็อก Premium ฟรี 24 ชม.!'
  };
}

// Verify a streak reward code
export function verifyStreakReward(code) {
  const store = readRewards();
  const reward = store.rewards.find(r => r.code === code);
  
  if (!reward) {
    return {
      success: false,
      error: 'INVALID_CODE',
      message: 'รหัสไม่ถูกต้อง'
    };
  }
  
  if (reward.used) {
    return {
      success: false,
      error: 'CODE_USED',
      message: 'รหัสนี้ถูกใช้ไปแล้ว'
    };
  }
  
  if (new Date(reward.expiresAt) <= new Date()) {
    return {
      success: false,
      error: 'CODE_EXPIRED',
      message: 'รหัสนี้หมดอายุแล้ว'
    };
  }
  
  // Mark as used
  reward.used = true;
  reward.usedAt = new Date().toISOString();
  writeRewards(store);
  
  return {
    success: true,
    message: 'ปลดล็อก Premium สำเร็จ!',
    expiresIn: 24 * 60 * 60 // 24 hours in seconds
  };
}

// Get reward stats (for admin)
export function getRewardStats() {
  const store = readRewards();
  const now = new Date();
  
  return {
    total: store.rewards.length,
    active: store.rewards.filter(r => !r.used && new Date(r.expiresAt) > now).length,
    used: store.rewards.filter(r => r.used).length,
    expired: store.rewards.filter(r => !r.used && new Date(r.expiresAt) <= now).length
  };
}
