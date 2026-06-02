import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sendWelcomeEmail } from './email-service.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary: runtime file (ephemeral, survives until next deploy)
const SUBSCRIBERS_FILE = path.resolve(process.cwd(), 'data', 'newsletter-subscribers.json');
// Fallback: committed seed file (persists across deploys)
const SEED_FILE = path.resolve(__dirname, '..', 'data', 'newsletter-subscribers.json');

// Ensure data directory exists
function ensureDataDir() {
  const dir = path.dirname(SUBSCRIBERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load subscribers from file — try runtime first, then seed
function loadSubscribers() {
  ensureDataDir();
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.error('Error loading runtime subscribers:', err.message);
  }
  // Fallback: load from committed seed file
  try {
    if (fs.existsSync(SEED_FILE)) {
      const data = fs.readFileSync(SEED_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`[newsletter] Loaded ${parsed.length} subscribers from seed file`);
        // Copy seed to runtime file for future writes
        fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(parsed, null, 2), 'utf8');
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading seed subscribers:', err.message);
  }
  return [];
}

// Save subscribers to file
function saveSubscribers(subscribers) {
  ensureDataDir();
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving subscribers:', err.message);
    return false;
  }
}

// Validate email format
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Subscribe to newsletter
export function subscribe(data) {
  const { email, birthdate } = data;
  
  // Validate email
  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'กรุณากรอกอีเมลที่ถูกต้อง' };
  }
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  
  // Load existing subscribers
  const subscribers = loadSubscribers();
  
  // Check for duplicate
  const existing = subscribers.find(s => s.email === normalizedEmail);
  if (existing) {
    // Update birthdate if provided and not already set
    if (birthdate && !existing.birthdate) {
      existing.birthdate = birthdate;
      existing.updatedAt = new Date().toISOString();
      saveSubscribers(subscribers);
    }
    return { success: true, message: 'สมัครสำเร็จแล้วค่ะ' };
  }
  
  // Add new subscriber
  const newSubscriber = {
    email: normalizedEmail,
    birthdate: birthdate || null,
    subscribedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    active: true
  };
  
  subscribers.push(newSubscriber);
  
  if (saveSubscribers(subscribers)) {
    // Send welcome email asynchronously (don't block the response)
    sendWelcomeEmail(normalizedEmail, birthdate).catch(err => {
      console.error('Failed to send welcome email:', err.message);
    });
    
    return { success: true, message: 'สมัครสำเร็จ!' };
  } else {
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}

// Get all subscribers (admin only)
export function getSubscribers() {
  return loadSubscribers();
}

// Get subscriber count
export function getSubscriberCount() {
  const subscribers = loadSubscribers();
  return subscribers.filter(s => s.active).length;
}

// Unsubscribe
export function unsubscribe(email) {
  if (!email) {
    return { success: false, error: 'กรุณากรอกอีเมล' };
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  const subscribers = loadSubscribers();
  
  const subscriber = subscribers.find(s => s.email === normalizedEmail);
  if (!subscriber) {
    return { success: false, error: 'ไม่พบอีเมลนี้ในระบบ' };
  }
  
  subscriber.active = false;
  subscriber.unsubscribedAt = new Date().toISOString();
  
  if (saveSubscribers(subscribers)) {
    return { success: true, message: 'ยกเลิกการสมัครสำเร็จ' };
  } else {
    return { success: false, error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
  }
}
