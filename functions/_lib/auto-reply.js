// Facebook Auto-Reply — ตอบคอมเม้นต์อัตโนมัติ
// Reads recent comments on page posts, matches keywords, and sends Thai replies.
//
// Endpoints exposed via functions/v1/facebook/[[path]].js:
//   POST /v1/facebook/auto-reply → scan comments + auto-reply (admin auth)
//   POST /v1/facebook/auto-reply/test → dry-run mode (no actual replies sent)
//
// Auth: Bearer token via env STARVIA_ADMIN_JWT_SECRET (admin-only)
//
// Keyword matching is Thai-focused for Starvia astrology services.
// Reference: https://developers.facebook.com/docs/pages-api/comments/

import { jsonResponse, errorResponse, getClientIp, handleOptions } from './cors.js';
import { withAdminAuth } from './admin.js';

const GRAPH_API_VERSION = 'v22.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

function getConfig(env) {
  const token = env.FACEBOOK_PAGE_TOKEN;
  const pageId = String(env.FACEBOOK_PAGE_ID || '').trim();
  if (!token) throw new Error('FACEBOOK_PAGE_TOKEN not set in env');
  if (!pageId) throw new Error('FACEBOOK_PAGE_ID not set in env');
  return { token, pageId };
}

// ═══════════════════════════════════════════════════════
// 🔑 Keyword → Reply Mapping (Thai)
// ═══════════════════════════════════════════════════════

const KEYWORD_RULES = [
  {
    keywords: ['ดูดวง', 'ดูดวงฟรี', 'ทำนาย', 'ทำนายดวง', 'horoscope', 'horoscope ฟรี'],
    reply: `🔮 ยินดีต้อนรับค่ะ! ดูดวงฟรีได้ที่เว็บไซต์ Starvia ค่ะ

✨ เข้าไปดูได้เลย: https://starvia.website

ระบบของเราใช้ข้อมูลจากดวงดาวจริง เพื่อให้คำทำนายที่แม่นยำค่ะ 🌟`,
  },
  {
    keywords: ['ราคา', 'กี่บาท', 'ค่าใช้จ่าย', 'เท่าไหร่', 'ราคาเท่าไหร่', 'premium ราคา', 'ปลดล็อกราคา', 'ปลดล็อกราคา'],
    reply: `💰 รายละเอียดราคา Starvia Premium ค่ะ

🌟 Premium Plan: 199 บาท / 30 วัน
   ✅ ดูดวงรายปี, ดวงคู่, ฤกษ์ auspicious, และอีกมากมาย

💳 วิธีชำระเงิน:
   1. โอนเงิน 199 บาท
   2. ส่งสลิปมาในแชทนี้
   3. รอรับ PIN ปลดล็อคอัตโนมัติ

ข้อมูลเพิ่มเติม: https://starvia.website`,
  },
  {
    keywords: ['สมัคร', 'สมัครสมาชิก', 'เข้า会员', 'upgrade', 'อัพเกรด', 'ซื้อpremium', 'ซื้อ premium', 'ปลดล็อค', 'ปลดล็อก'],
    reply: `🌟 วิธีสมัคร Starvia Premium ค่ะ

ขั้นตอนง่ายๆ:
1️⃣ โอนเงิน 199 บาท ไปที่บัญชีของเรา
2️⃣ ถ่ายสลิปการโอนเงิน
3️⃣ ส่งสลิปมาในแชท Facebook นี้
4️⃣ ระบบจะส่ง PIN ปลดล็อคให้อัตโนมัติ!

ใช้ PIN ที่ได้รับไปกรอกที่เว็บไซต์ได้เลยค่ะ 🔑`,
  },
  {
    keywords: ['ติดต่อ', 'ติดต่อทีมงาน', 'ติดต่อเจ้าหน้าที่', 'ช่วยเหลือ', 'help', 'support', 'ถาม'],
    reply: `💬 ติดต่อทีมงาน Starvia ได้เลยค่ะ!

ทีมงานพร้อมตอบคำถามและช่วยเหลือคุณ 😊
พิมพ์คำถามของคุณมาในแชทนี้ได้เลยค่ะ

หรือเข้าไปดูข้อมูลเพิ่มเติมได้ที่:
🌐 https://starvia.website`,
  },
  {
    keywords: ['ขอบคุณ', 'ขอบคุณค่ะ', 'ขอบคุณนะ', 'thanks', 'thank you', 'thank'],
    reply: `🙏 ยินดีค่ะ! ขอบคุณที่ใช้บริการ Starvia นะคะ
หากมีคำถามเพิ่มเติม ถามได้เลยค่ะ 😊`,
  },
  {
    keywords: ['สวัสดี', 'hello', 'hi', 'ฮาโหล', 'หวัดดี'],
    reply: `✨ สวัสดีค่ะ! ยินดีต้อนรับสู่ Starvia 🔮

-Starvia ให้บริการดูดวงจากดวงดาวจริง ฟรี!
เข้าไปดูดวงได้ที่: https://starvia.website

มีอะไรให้ช่วยเหลือไหมคะ? 😊`,
  },
  {
    keywords: [' PIN', 'รหัส', 'pin', 'star-', ' STAR'],
    reply: `🔑 วิธีใช้ PIN ปลดล็อค Premium:

1. ไปที่ https://starvia.website
2. เลือกดูดวง Premium
3. กรอกรหัส PIN ที่ได้รับ
4. สนุกกับการดูดวงได้เลยค่ะ!

⚠️ PIN มีอายุ 30 วันนับจากวันที่ได้รับค่ะ`,
  },
];

// ═══════════════════════════════════════════════════════
// 🔍 Match comment text against keyword rules
// ═══════════════════════════════════════════════════════

function matchKeyword(text) {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { matched: kw, reply: rule.reply };
      }
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════
// 📥 Fetch recent page posts
// ═══════════════════════════════════════════════════════

async function fetchRecentPosts(pageId, token, limit = 10) {
  const fields = 'id,message,created_time,updated_time';
  const url = `${GRAPH_BASE}/${pageId}/feed?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const resp = await fetch(url);
  const data = await resp.json();

  if (!resp.ok || data.error) {
    throw new Error(data.error?.message || `Failed to fetch posts (HTTP ${resp.status})`);
  }
  return data.data || [];
}

// ═══════════════════════════════════════════════════════
// 💬 Fetch comments for a given post
// ═══════════════════════════════════════════════════════

async function fetchPostComments(postId, token, limit = 25) {
  const fields = 'id,message,from,created_time,comment_count';
  const url = `${GRAPH_BASE}/${postId}/comments?fields=${encodeURIComponent(fields)}&limit=${limit}&filter=stream&access_token=${encodeURIComponent(token)}`;

  const resp = await fetch(url);
  const data = await resp.json();

  if (!resp.ok || data.error) {
    // Some posts may not allow comments or be deleted
    console.warn(`Failed to fetch comments for ${postId}:`, data.error?.message);
    return [];
  }
  return data.data || [];
}

// ═══════════════════════════════════════════════════════
// ✉️ Reply to a comment (as page)
// ═══════════════════════════════════════════════════════

async function replyToComment(commentId, message, pageId, token) {
  const url = `${GRAPH_BASE}/${commentId}/comments`;
  const body = JSON.stringify({
    message,
    access_token: token,
  });

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await resp.json();

  if (!resp.ok || data.error) {
    throw new Error(data.error?.message || `Failed to reply (HTTP ${resp.status})`);
  }
  return { success: true, commentId: data.id };
}

// ═══════════════════════════════════════════════════════
// 🔔 Notify admin via Telegram (optional)
// ═══════════════════════════════════════════════════════

async function notifyTelegramAutoReply(env, summary) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return false;

  const text = [
    `🤖 Auto-Reply Summary`,
    ``,
    `📝 Comments scanned: ${summary.scanned}`,
    `✅ Replies sent: ${summary.replied}`,
    `⏭️ Skipped (no match): ${summary.skipped}`,
    `❌ Errors: ${summary.errors.length}`,
    ``,
    summary.details.map(d => {
      const icon = d.status === 'replied' ? '✅' : d.status === 'skipped' ? '⏭️' : '❌';
      const commentSnippet = (d.commentText || '').substring(0, 60);
      return `${icon} ${d.author}: "${commentSnippet}" → ${d.matched || 'no match'}`;
    }).join('\n'),
  ].join('\n');

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return true;
  } catch (e) {
    console.error('Telegram notify error:', e.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════
// 🚀 Main handler: POST /v1/facebook/auto-reply
// ═══════════════════════════════════════════════════════

export async function facebookAutoReply(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body = {};
  try {
    body = await request.json();
  } catch {
    // Allow empty body for cron triggers
    body = {};
  }

  const dryRun = body.dry_run === true;
  const postLimit = Math.min(20, Number(body.post_limit) || 10);
  const commentLimit = Math.min(50, Number(body.comment_limit) || 25);

  try {
    const { token, pageId } = getConfig(env);

    // Rate limit: 10 auto-reply runs/hour per IP
    const ip = getClientIp(request);
    const rateKey = `fb:autoreply:rate:${ip}`;
    let count = 0;
    try {
      const cur = await env.STARVIA_KV?.get(rateKey);
      count = cur ? parseInt(cur, 10) || 0 : 0;
    } catch { /* KV unavailable, skip */ }

    if (count >= 10) {
      return errorResponse(429, 'RATE_LIMITED', `Auto-reply limited to 10 runs/hour (count=${count})`);
    }

    // Step 1: Fetch recent posts
    const posts = await fetchRecentPosts(pageId, token, postLimit);

    if (posts.length === 0) {
      return jsonResponse({
        success: true,
        dryRun,
        scanned: 0,
        replied: 0,
        skipped: 0,
        errors: [],
        details: [],
        message: 'No posts found on page',
      });
    }

    // Step 2: Fetch comments for each post
    const allComments = [];
    for (const post of posts) {
      try {
        const comments = await fetchPostComments(post.id, token, commentLimit);
        for (const comment of comments) {
          allComments.push({
            postId: post.id,
            postMessage: (post.message || '').substring(0, 100),
            ...comment,
          });
        }
      } catch (err) {
        console.warn(`Skipping post ${post.id}:`, err.message);
      }
    }

    // Step 3: Deduplicate and match keywords
    const details = [];
    const dedupSet = new Set();
    let replied = 0;
    let skipped = 0;
    const errors = [];

    for (const comment of allComments) {
      // Skip if already processed (KV dedup)
      const dedupKey = `fb:autoreply:comment:${comment.id}`;
      let alreadyProcessed = false;
      try {
        const existing = await env.STARVIA_KV?.get(dedupKey);
        if (existing) alreadyProcessed = true;
      } catch { /* KV unavailable */ }
      if (alreadyProcessed) continue;

      // Skip if this is from the page itself
      if (String(comment.from?.id) === String(pageId)) continue;

      // Match keyword
      const match = matchKeyword(comment.message);
      if (!match) {
        skipped++;
        details.push({
          commentId: comment.id,
          postId: comment.postId,
          author: comment.from?.name || 'Unknown',
          commentText: comment.message || '',
          matched: null,
          status: 'skipped',
        });
        continue;
      }

      // Send reply (or dry-run)
      if (dryRun) {
        replied++;
        details.push({
          commentId: comment.id,
          postId: comment.postId,
          author: comment.from?.name || 'Unknown',
          commentText: comment.message || '',
          matched: match.matched,
          replyPreview: match.reply.substring(0, 100) + '...',
          status: 'would_reply',
        });
        continue;
      }

      try {
        await replyToComment(comment.id, match.reply, pageId, token);

        // Mark as processed in KV (24h TTL)
        try {
          await env.STARVIA_KV?.put(dedupKey, new Date().toISOString(), { expirationTtl: 86400 });
        } catch { /* non-critical */ }

        replied++;
        details.push({
          commentId: comment.id,
          postId: comment.postId,
          author: comment.from?.name || 'Unknown',
          commentText: comment.message || '',
          matched: match.matched,
          status: 'replied',
        });
      } catch (err) {
        errors.push({
          commentId: comment.id,
          error: err.message,
        });
        details.push({
          commentId: comment.id,
          postId: comment.postId,
          author: comment.from?.name || 'Unknown',
          commentText: (comment.message || '').substring(0, 60),
          matched: match.matched,
          status: 'error',
          error: err.message,
        });
      }
    }

    // Increment rate limit counter
    try {
      await env.STARVIA_KV?.put(rateKey, String(count + 1), { expirationTtl: 3600 });
    } catch { /* ignore */ }

    // Notify Telegram about auto-reply run
    const summary = { scanned: allComments.length, replied, skipped, errors, details };
    await notifyTelegramAutoReply(env, summary);

    return jsonResponse({
      success: true,
      dryRun,
      scanned: allComments.length,
      replied,
      skipped,
      errors: errors.length,
      errorDetails: errors,
      details,
      postsScanned: posts.length,
      runAt: new Date().toISOString(),
    });
  } catch (err) {
    return errorResponse(500, 'INTERNAL_ERROR', err.message);
  }
}

// ═══════════════════════════════════════════════════════
// 🧪 Test handler: POST /v1/facebook/auto-reply/test
// Shows keyword matching rules without posting anything
// ═══════════════════════════════════════════════════════

export async function facebookAutoReplyTest(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return handleOptions();

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const testText = body.text || '';

  if (testText) {
    // Test single text against keyword matching
    const match = matchKeyword(testText);
    return jsonResponse({
      success: true,
      input: testText,
      matched: match ? match.matched : null,
      reply: match ? match.reply : null,
      hint: match ? 'This comment would trigger an auto-reply' : 'No keyword match — this comment would be skipped',
    });
  }

  // Return all rules for reference
  return jsonResponse({
    success: true,
    rules: KEYWORD_RULES.map(r => ({
      keywords: r.keywords,
      replyPreview: r.reply.substring(0, 80) + '...',
    })),
    totalRules: KEYWORD_RULES.length,
    usage: 'POST with { "text": "some comment" } to test matching, or empty body to list all rules',
  });
}

// ═══════════════════════════════════════════════════════
// 🛡️ Auth wrappers
// ═══════════════════════════════════════════════════════

export const facebookAutoReplyAuth = (context) => withAdminAuth(context, facebookAutoReply);
export const facebookAutoReplyTestAuth = (context) => withAdminAuth(context, facebookAutoReplyTest);
