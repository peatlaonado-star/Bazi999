import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || 'STARVIA <noreply@starvia.website>';
const SUBSCRIBERS_FILE = path.resolve(process.cwd(), 'data', 'newsletter-subscribers.json');
const SEED_FILE = path.resolve(__dirname, '..', 'data', 'newsletter-subscribers.json');

// Load active subscribers — try runtime first, then seed
function getActiveSubscribers() {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf8');
      const subscribers = JSON.parse(data);
      if (Array.isArray(subscribers) && subscribers.length > 0) {
        return subscribers.filter(s => s.active);
      }
    }
  } catch (err) {
    console.error('Error loading runtime subscribers:', err.message);
  }
  // Fallback: load from committed seed file
  try {
    if (fs.existsSync(SEED_FILE)) {
      const data = fs.readFileSync(SEED_FILE, 'utf8');
      const subscribers = JSON.parse(data);
      if (Array.isArray(subscribers) && subscribers.length > 0) {
        console.log(`[email] Loaded ${subscribers.length} subscribers from seed file`);
        return subscribers.filter(s => s.active);
      }
    }
  } catch (err) {
    console.error('Error loading seed subscribers:', err.message);
  }
  return [];
}

// Send email via Resend API
async function sendEmail(to, subject, html, text) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return { success: false, error: 'RESEND_API_KEY is not set' };
  }

  try {
    const body = {
      from: NEWSLETTER_FROM,
      to: [to],
      subject: subject,
      html: html,
      headers: {
        'List-Unsubscribe': `<https://starvia.website/unsubscribe?email=${encodeURIComponent(to)}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      }
    };

    // Add plain text version if provided (improves spam score)
    if (text) {
      body.text = text;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (response.ok) {
      return { success: true, id: result.id };
    } else {
      return { success: false, error: result.message || 'Failed to send email' };
    }
  } catch (err) {
    console.error('Error sending email:', err.message);
    return { success: false, error: err.message };
  }
}

// Generate daily horoscope email HTML
function generateDailyHoroscopeHTML(email, birthdate) {
  // Simple horoscope based on birthdate
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  const horoscopes = [
    { day: 'อาทิตย์', color: '#FF6B35', message: 'วันนี้ดาวอาทิตย์ส่องแสงสดใส เหมาะกับการเริ่มต้นสิ่งใหม่ๆ ให้ความมั่นใจกับตัวเอง' },
    { day: 'จันทร์', color: '#C4C4C4', message: 'วันนี้ดาวจันทร์ส่งพลังแห่งอารมณ์ ให้ความใส่ใจกับความรู้สึกของตัวเองและคนรอบข้าง' },
    { day: 'อังคาร', color: '#FF4444', message: 'วันนี้ดาวอังคารให้พลังแห่งความกล้า เหมาะกับการตัดสินใจเรื่องสำคัญ' },
    { day: 'พุธ', color: '#4CAF50', message: 'วันนี้ดาวพุธให้ปัญญาและความเฉลียวฉลาด เหมาะกับการเรียนรู้สิ่งใหม่' },
    { day: 'พฤหัสบดี', color: '#FF9800', message: 'วันนี้ดาวพฤหัสบดีให้โชคและความเจริญรุ่งเรือง เหมาะกับการลงทุน' },
    { day: 'ศุกร์', color: '#E91E63', message: 'วันนี้ดาวศุกร์ให้เสน่ห์และความรัก เหมาะกับการพบปะผู้คน' },
    { day: 'เสาร์', color: '#9C27B0', message: 'วันนี้ดาวเสาร์ให้ความอดทนและมั่นคง เหมาะกับการทำงานหนัก' }
  ];

  const todayHoroscope = horoscopes[dayOfWeek];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1A1035; font-family: 'Leelawadee UI', 'Segoe UI', Tahoma, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1A1035; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(91, 63, 166, 0.3), rgba(201, 162, 39, 0.15)); border-radius: 18px; border: 1px solid rgba(201, 162, 39, 0.25);">
          <tr>
            <td style="padding: 30px; text-align: center;">
              <!-- Header -->
              <div style="font-size: 12px; letter-spacing: 0.5em; color: #5a4a7a; text-transform: uppercase; margin-bottom: 10px;">
                ✦ ดวงรายวัน ✦
              </div>
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #8B6914, #C9A227 50%, #f0d96a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 10px 0;">
                STARVIA
              </h1>
              <div style="font-size: 11px; color: #b8a8d8; margin-bottom: 25px;">
                ค้นพบดวงดาว เข้าใจตัวเอง
              </div>
              
              <!-- Divider -->
              <div style="width: 120px; height: 1px; background: linear-gradient(90deg, transparent, #C9A227, transparent); margin: 0 auto 25px;"></div>
              
              <!-- Day Info -->
              <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px dashed rgba(201,162,39,0.3);">
                <div style="font-size: 14px; color: #e8dfc8; margin-bottom: 8px;">
                  วัน${todayHoroscope.day}ที่ ${today.getDate()} ${today.toLocaleDateString('th-TH', { month: 'long' })} ${today.getFullYear() + 543}
                </div>
                <div style="font-size: 12px; color: #b8a8d8;">
                  ${todayHoroscope.message}
                </div>
              </div>
              
              <!-- Horoscope Card -->
              <div style="background: rgba(201,162,39,0.08); border: 1px solid rgba(201,162,39,0.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 11px; letter-spacing: 0.2em; color: #C9A227; text-transform: uppercase; margin-bottom: 12px;">
                  ✦ ดวงชะตาประจำวัน ✦
                </div>
                <div style="font-size: 15px; color: #e8dfc8; line-height: 1.8;">
                  ${getPersonalizedHoroscope(birthdate, dayOfWeek)}
                </div>
              </div>
              
              <!-- CTA -->
              <div style="margin: 25px 0;">
                <a href="https://starvia.website/" style="display: inline-block; background: linear-gradient(135deg, #C9A227, #8B6914); color: #05030f; text-decoration: none; padding: 12px 30px; border-radius: 9px; font-weight: 700; font-size: 14px; letter-spacing: 0.08em;">
                  ✦ ดูดวงเต็มรูปแบบ ✦
                </a>
              </div>
              
              <!-- Footer -->
              <div style="font-size: 10px; color: #5a4a7a; margin-top: 20px;">
                <p>ได้รับอีเมลนี้เพราะสมัครรับดวงรายวันจาก STARVIA</p>
                <p style="margin-top: 10px;">
                  <a href="https://starvia.website/unsubscribe?email=${encodeURIComponent(email)}" style="color: #8c7bb3; text-decoration: underline;">
                    ยกเลิกการสมัคร
                  </a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Get personalized horoscope based on birthdate
function getPersonalizedHoroscope(birthdate, dayOfWeek) {
  if (!birthdate) {
    return 'วันนี้ดาวทุกดวงส่งพลังบวกให้คุณ ให้ความใส่ใจกับสิ่งที่อยู่ตรงหน้า และทำสิ่งที่ทำให้ตัวเองมีความสุข';
  }

  const birth = new Date(birthdate);
  const month = birth.getMonth() + 1;
  const day = birth.getDate();

  // Determine zodiac sign
  let zodiac = '';
  if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) zodiac = 'กุมภ์';
  else if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) zodiac = 'มีน';
  else if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) zodiac = 'เมษ';
  else if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) zodiac = 'พฤษภ';
  else if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) zodiac = 'เมถุน';
  else if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) zodiac = 'กรกฎ';
  else if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) zodiac = 'สิงห์';
  else if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) zodiac = 'กันย์';
  else if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) zodiac = 'ตุลย์';
  else if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) zodiac = 'พิจิก';
  else if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) zodiac = 'ธนู';
  else zodiac = 'มกร';

  const horoscopes = {
    'กุมภ์': 'วันนี้ราศีกุมภ์จะรู้สึกถึงพลังงานใหม่ๆ ที่เข้ามา ให้เปิดรับสิ่งใหม่ๆ แต่ไม่ต้องรีบตัดสินใจ ค่อยๆ คิดทีละ bước',
    'มีน': 'วันนี้ราศีมีนจะมีความรู้สึกลึกซึ้ง ให้เชื่อมั่นในสัญชาตญาณของตัวเอง แต่ระวังอย่าจมอยู่กับความคิดมากเกินไป',
    'เมษ': 'วันนี้ราศีเมษจะมีพลังงานสูง เหมาะกับการลงมือทำสิ่งที่ค้างไว้ แต่ระวังอย่าใจร้อนจนเกินไป',
    'พฤษภ': 'วันนี้ราศีพฤษภจะรู้สึกมั่นคงและปลอดภัย ให้ใช้เวลากับสิ่งที่รักและคนที่รัก',
    'เมถุน': 'วันนี้ราศีเมถุนจะมีไอเดียมากมาย ให้จดไว้และค่อยๆ เรียงลำดับความสำคัญ',
    'กรกฎ': 'วันนี้ราศีกรกฎจะรู้สึกอ่อนไหว ให้ดูแลตัวเองดีๆ และอย่าลืมว่าความอ่อนโยนคือจุดแข็ง',
    'สิงห์': 'วันนี้ราศีสิงห์จะเปล่งประกาย ให้แสดงความเป็นตัวเองออกมา แต่ระวังอย่าดึงดูดความสนใจมากเกินไป',
    'กันย์': 'วันนี้ราศีกันย์จะมีสมาธิดี เหมาะกับการจัดระเบียบและวางแผน แต่ระวังอย่า perfectionist มากเกินไป',
    'ตุลย์': 'วันนี้ราศีตุลย์จะรู้สึกสมดุล ให้ใช้เวลากับการสร้างความสัมพันธ์ที่ดีกับคนรอบข้าง',
    'พิจิก': 'วันนี้ราศีพิจิกจะรู้สึกลึกซึ้ง ให้เชื่อมั่นในสัญชาตญาณ แต่ระวังอย่าหวาดระแวงเกินไป',
    'ธนู': 'วันนี้ราศีธนูจะรู้สึกอิสระ ให้ทำสิ่งที่รักและไม่ต้องกังวลเรื่องกฎเกณฑ์มากเกินไป',
    'มกร': 'วันนี้ราศีมกรจะมีสมาธิดี เหมาะกับการทำงานหนัก แต่ระวังอย่ากดดันตัวเองมากเกินไป'
  };

  return horoscopes[zodiac] || 'วันนี้ดาวทุกดวงส่งพลังบวกให้คุณ ให้ความใส่ใจกับสิ่งที่อยู่ตรงหน้า และทำสิ่งที่ทำให้ตัวเองมีความสุข';
}

// Send daily horoscope to all subscribers
export async function sendDailyHoroscope() {
  const subscribers = getActiveSubscribers();
  
  if (subscribers.length === 0) {
    console.log('No active subscribers to send to');
    return { success: true, sent: 0, message: 'No subscribers' };
  }

  const today = new Date();
  const subject = `✦ ดวงรายวัน STARVIA — ${today.getDate()} ${today.toLocaleDateString('th-TH', { month: 'short' })}`;
  
  let sent = 0;
  let failed = 0;
  
  for (const subscriber of subscribers) {
    const html = generateDailyHoroscopeHTML(subscriber.email, subscriber.birthdate);
    const result = await sendEmail(subscriber.email, subject, html);
    
    if (result.success) {
      sent++;
      console.log(`✓ Sent to ${subscriber.email}`);
    } else {
      failed++;
      console.error(`✗ Failed to send to ${subscriber.email}: ${result.error}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return { success: true, sent, failed, total: subscribers.length };
}

// Send welcome email to new subscriber
export async function sendWelcomeEmail(email, birthdate) {
  const subject = '✦ ยินดีต้อนรับสู่ STARVIA — ดวงรายวันส่งถึงคุณแล้ว!';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #1A1035; font-family: 'Leelawadee UI', 'Segoe UI', Tahoma, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1A1035; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(91, 63, 166, 0.3), rgba(201, 162, 39, 0.15)); border-radius: 18px; border: 1px solid rgba(201, 162, 39, 0.25);">
          <tr>
            <td style="padding: 30px; text-align: center;">
              <h1 style="font-family: Georgia, 'Times New Roman', serif; font-size: 32px; font-weight: 700; background: linear-gradient(135deg, #8B6914, #C9A227 50%, #f0d96a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 20px 0;">
                STARVIA
              </h1>
              
              <div style="background: rgba(201,162,39,0.08); border: 1px solid rgba(201,162,39,0.2); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 18px; color: #C9A227; margin-bottom: 12px;">
                  ✦ ยินดีต้อนรับ! ✦
                </div>
                <div style="font-size: 15px; color: #e8dfc8; line-height: 1.8;">
                  คุณได้สมัครรับดวงรายวันจาก STARVIA เรียบร้อยแล้ว<br>
                  เราจะส่งดวงชะตารายวันให้คุณทุกเช้า
                </div>
              </div>
              
              <div style="font-size: 13px; color: #b8a8d8; margin-bottom: 20px;">
                ${birthdate ? 'เราได้บันทึกวันเกิดของคุณแล้ว ดวงรายวันจะเป็นแบบเฉพาะบุคคล' : 'ถ้าต้องการดวงเฉพาะบุคคล สามารถกรอกวันเกิดได้ในเว็บไซต์'}
              </div>
              
              <div style="margin: 25px 0;">
                <a href="https://starvia.website/" style="display: inline-block; background: linear-gradient(135deg, #C9A227, #8B6914); color: #05030f; text-decoration: none; padding: 12px 30px; border-radius: 9px; font-weight: 700; font-size: 14px; letter-spacing: 0.08em;">
                  ✦ ดูดวงเต็มรูปแบบ ✦
                </a>
              </div>
              
              <div style="font-size: 10px; color: #5a4a7a; margin-top: 20px;">
                <p>ดาวไม่ได้ตัดสินชีวิตคุณ — ดาวช่วยให้คุณมองเห็นตัวเองชัดขึ้น</p>
                <p style="margin-top: 10px;">
                  <a href="https://starvia.website/unsubscribe?email=${encodeURIComponent(email)}" style="color: #8c7bb3; text-decoration: underline;">
                    ยกเลิกการสมัคร
                  </a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
  
  const text = [
    '✦ ยินดีต้อนรับสู่ STARVIA! ✦',
    '',
    'คุณได้สมัครรับดวงรายวันจาก STARVIA เรียบร้อยแล้ว',
    'เราจะส่งดวงชะตารายวันให้คุณทุกเช้า',
    '',
    birthdate ? 'เราได้บันทึกวันเกิดของคุณแล้ว ดวงรายวันจะเป็นแบบเฉพาะบุคคล' : 'ถ้าต้องการดวงเฉพาะบุคคล สามารถกรอกวันเกิดได้ในเว็บไซต์',
    '',
    'ดูดวงเต็มรูปแบบ: https://starvia.website/',
    '',
    'ยกเลิก: https://starvia.website/unsubscribe?email=' + encodeURIComponent(email),
    '',
    'ดาวไม่ได้ตัดสินชีวิตคุณ — ดาวช่วยให้คุณมองเห็นตัวเองชัดขึ้น'
  ].join('\n');

  return sendEmail(email, subject, html, text);
}

export { sendEmail, getActiveSubscribers };
