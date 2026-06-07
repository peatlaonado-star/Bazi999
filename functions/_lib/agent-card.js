// STARVIA Agent Card (A2A Protocol v0.2.0)
// Ported to Cloudflare Pages Functions — pure JSON, no Node.js deps
// Spec: https://github.com/google/A2A
//
// Skill dispatch (wired 2026-06-07):
//   - birthday_reading  → inline (pure JS, no backend)
//   - daily_fortune     → inline (sun-sign + weekday, no backend)
//   - lottery_results   → handleLotteryResults (KV-backed)
//   - premium_verify    → verifyPremiumPin (KV + JWT)
//   - chat_consultation → handleChat (Workers AI)

import { handleLotteryResults } from './lottery.js';
import { verifyPremiumPin } from './premium.js';
import { handleChat } from './chat.js';

function getAgentCard(origin) {
  return {
    name: 'Starvia',
    description: 'AI-powered Thai astrology consultant. Provides personalized life blueprints, daily fortune, lottery insights, and premium readings. Fluent in Thai cosmic/mu-tee-lu terminology.',
    version: '1.0.0',
    provider: {
      organization: 'Starvia',
      url: 'https://starvia.website',
    },
    skills: [
      {
        id: 'birthday_reading',
        name: 'Birthday Reading',
        description: 'Generate personalized life blueprint from birth date (DD/MM/YYYY)',
        examples: ['ดูดวงคนเกิดวันที่ 15 มกราคม 1990', 'อ่านดวงชะตาจากวันเกิด', 'Generate Thai astrology profile'],
        inputSchema: {
          type: 'object',
          properties: {
            birthDate: { type: 'string', description: 'Birth date in YYYY-MM-DD format', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            birthTime: { type: 'string', description: 'Optional birth time HH:MM', pattern: '^\\d{2}:\\d{2}$' },
            timezone: { type: 'string', description: 'Optional IANA timezone', default: 'Asia/Bangkok' },
          },
          required: ['birthDate'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            reading: { type: 'object', description: 'Personalized astrology reading' },
          },
        },
      },
      {
        id: 'daily_fortune',
        name: 'Daily Fortune',
        description: "Get today's personalized fortune, lucky colors/numbers, and cosmic guidance",
        examples: ['ดวงวันนี้', 'โชคลาภวันนี้', "Today's fortune"],
        inputSchema: {
          type: 'object',
          properties: {
            birthDate: { type: 'string', description: 'Birth date for personalized fortune', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            category: { type: 'string', enum: ['love', 'work', 'money', 'general'], default: 'general' },
          },
          required: ['birthDate'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            fortune: { type: 'object', description: "Today's personalized fortune" },
          },
        },
      },
      {
        id: 'lottery_results',
        name: 'Thai Lottery Results',
        description: 'Get latest Thai lottery results (1st and 16th of each month) with cosmic analysis',
        examples: ['ผลหวยงวดล่าสุด', 'หวย 1 มิถุนายน 2569', 'Latest lottery numbers'],
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Optional date YYYY-MM-DD (defaults to latest)', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            includeAnalysis: { type: 'boolean', default: true, description: 'Include cosmic analysis' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            results: { type: 'object', description: 'Lottery results with analysis' },
          },
        },
      },
      {
        id: 'premium_verify',
        name: 'Premium PIN Verification',
        description: 'Verify a Premium access PIN and return token for unlocking full reading',
        examples: ['ตรวจสอบ PIN STAR-XXXX-XXXX', 'Verify premium access'],
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'Premium PIN (format: STAR-XXXX-XXXX)', pattern: '^STAR-[A-Z0-9]{4}-[A-Z0-9]{4}$' },
          },
          required: ['pin'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            token: { type: 'string', description: 'JWT for premium access' },
            expiresIn: { type: 'number', description: 'Token lifetime in seconds' },
            plan: { type: 'string', description: 'Premium plan' },
          },
        },
      },
      {
        id: 'chat_consultation',
        name: 'AI Chat Consultation',
        description: 'Chat with "Dara" — Thai astrology AI assistant. Falls back to Premium pitch for off-topic or payment questions.',
        examples: ['ดวงคนเกิดวันจันทร์เป็นยังไง', 'ฤกษ์ดีทำบุญ', 'Ask about Thai astrology'],
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'User question in Thai', maxLength: 500 },
            context: { type: 'object', description: 'Optional conversation context' },
          },
          required: ['message'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            reply: { type: 'string', description: 'AI assistant response in Thai' },
          },
        },
      },
    ],
    endpoints: {
      base: 'https://starvia.website',
      agentCard: '/.well-known/agent.json',
      tasks: '/v1/agent/tasks',
      tasksGet: '/v1/agent/tasks/{taskId}',
      tasksCancel: '/v1/agent/tasks/{taskId}:cancel',
    },
    authentication: {
      schemes: ['bearer', 'none'],
      description: 'Most skills work without auth. Premium verify requires JWT.',
    },
    defaultInputModes: ['text', 'text/plain'],
    defaultOutputModes: ['text', 'text/plain', 'application/json'],
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },
    pricing: {
      currency: 'THB',
      plans: [
        { name: 'free', price: 0, features: ['birthday_reading (preview)', 'daily_fortune (preview)'] },
        { name: 'premium_199', price: 199, billingPeriod: 'lifetime', features: ['birthday_reading (full)', 'daily_fortune (full)', 'lottery_results', 'chat_consultation'] },
      ],
    },
    documentation: 'https://starvia.website/agent-docs',
    termsOfService: 'https://starvia.website/terms',
  };
}

// Skill handlers — birthday reading is the only one with real logic
// (lottery/chat/premium proxy to other endpoints; Pages Functions can call self)

const constellations = ['มังกร', 'งู', 'ม้า', 'แพะ', 'ลิว', 'ไก่', 'สุนัข', 'หมู', 'หนู', 'วัว', 'เสือ', 'กระต่าย'];
const elements = ['ไม้', 'ไม้', 'ไฟ', 'ไฟ', 'ดิน', 'ดิน', 'ทอง', 'ทอง', 'น้ำ', 'น้ำ'];

function handleBirthdayReading(input) {
  const date = new Date(input.birthDate);
  if (isNaN(date.getTime())) {
    return { success: false, error: 'INVALID_DATE' };
  }
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const birthYearBE = year + 543;
  const constellation = constellations[day % 12];
  const element = elements[month % 10];

  return {
    success: true,
    reading: {
      birthDate: input.birthDate,
      birthYearBE,
      constellation,
      element,
      summary: `คนเกิดวันที่ ${day}/${month}/${birthYearBE} อยู่ในกลุ่มดาว${constellation} ธาตุ${element} ตามปีนักษัตรไทย`,
      note: 'สำหรับคำทำนายฉบับเต็ม (คัมภีร์ 6 ด้าน + กราฟชีวิต) กรุณาซื้อ Premium 199 บาท',
      premiumUnlockPin: null,
    },
  };
}

// Daily fortune — pure JS, deterministic from birth date + today
// Returns a short personalized snippet per category
const dailyMessages = {
  love: {
    good: '💕 พลังดาวเสริมความสัมพันธ์ — วันนี้เหมาะบอกรักหรือคืนดี',
    mid: '🌸 ความรักนิ่ง — ใช้เวลาเข้าใจกันมากกว่าเร่งหาคำตอบ',
    bad: '🌧️ ระวังคำพูด — ใจเย็นก่อนตอบโพสต์/แชทวันนี้',
  },
  work: {
    good: '🚀 พลังงานการงานพีค — ลุยโปรเจกต์ใหม่ได้เลย',
    mid: '🛠️ การงานนิ่ง — เน้นงานประจำให้สำเร็จก่อน',
    bad: '⚠️ วันนี้ควรหลีกเลี่ยงการตัดสินใจใหญ่ เก็บไว้พรุ่งนี้',
  },
  money: {
    good: '💰 โชคลาภดี — เหมาะลงทุน/เริ่มธุรกิจเล็กๆ',
    mid: '💵 การเงินนิ่ง — เก็บออมดีกว่าใช้จ่ายฟุ่มเฟือย',
    bad: '🛑 ระวังการใช้จ่าย — วันนี้ควรพกแต่จำเป็น',
  },
  general: {
    good: '✨ ดวงเปิด — จักรวาลเปิดทางให้ทุกเรื่อง',
    mid: '🌙 พลังงานสมดุล — รักษาจังหวะปกติ',
    bad: '🌑 วันพักใจ — ลดกิจกรรมหนัก ดูแลตัวเอง',
  },
};

function handleDailyFortune(input) {
  const date = new Date(input.birthDate);
  if (isNaN(date.getTime())) {
    return { success: false, error: 'INVALID_DATE' };
  }
  const category = ['love', 'work', 'money', 'general'].includes(input.category) ? input.category : 'general';
  // Deterministic bucket from (birth day-of-year + today's day-of-year) modulo 3
  const birthDoy = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const todayDoy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const bucket = (birthDoy + todayDoy) % 3; // 0=good, 1=mid, 2=bad
  const tone = ['good', 'mid', 'bad'][bucket];
  const element = elements[(date.getMonth() + 1) % 10];
  const constellation = constellations[date.getDate() % 12];
  const luckyNumbers = [(date.getDate() % 9) + 1, (todayDoy % 9) + 1, ((birthDoy + todayDoy) % 9) + 1];

  return {
    success: true,
    fortune: {
      date: new Date().toISOString().slice(0, 10),
      category,
      tone,
      message: dailyMessages[category][tone],
      element,
      constellation,
      luckyNumbers: Array.from(new Set(luckyNumbers)).slice(0, 3),
      note: 'สำหรับคำทำนายฉบับเต็ม (รายสัปดาห์ + ช่วงเวลาดี-ร้าย) กรุณาซื้อ Premium 199 บาท',
    },
  };
}

// Internal dispatch helper — invoke another _lib handler with a synthetic body
// Used so the A2A layer can call /v1/* endpoints without an HTTP round-trip
async function dispatchHandler(context, handler, body) {
  const syntheticRequest = new Request(context.request.url, {
    method: context.request.method,
    headers: context.request.headers,
    body: body !== undefined ? JSON.stringify(body) : null,
  });
  return handler({ ...context, request: syntheticRequest });
}

export async function handleAgentRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const rawPath = params?.path;
  const path = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath ?? '');

  // GET /.well-known/agent.json handled by separate file
  // POST /v1/agent/tasks — A2A task send
  if (request.method === 'POST' && (path === '' || path === 'tasks')) {
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: 'INVALID_JSON' }, 400);
    }

    // A2A protocol v0.2.0 wraps params: { id, params: { skillId, input } }
    // Also accept top-level { skillId, input } for simple clients
    const params = (body && typeof body.params === 'object' && body.params) || body || {};
    const skillId = params.skillId || params.skill_id || body.skillId || body.skill_id;
    const input = (params.input && typeof params.input === 'object')
      ? params.input
      : (body.input && typeof body.input === 'object'
          ? body.input
          : (body.message ? { message: body.message } : {}));
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (skillId === 'birthday_reading') {
      const result = handleBirthdayReading(input);
      return json({ success: true, taskId, status: 'completed', result });
    }

    if (skillId === 'daily_fortune') {
      const result = handleDailyFortune(input);
      return json({ success: true, taskId, status: 'completed', result });
    }

    // lottery_results — proxy to handleLotteryResults, wrap A2A envelope around response
    if (skillId === 'lottery_results') {
      const innerResp = await handleLotteryResults(context);
      const inner = await innerResp.json();
      return json({ success: true, taskId, status: 'completed', result: inner });
    }

    // premium_verify — needs { pin } in body
    if (skillId === 'premium_verify') {
      if (!input.pin) {
        return json({
          success: true, taskId, status: 'completed',
          result: { success: false, error: 'PIN_REQUIRED', message: 'ต้องระบุ pin (รูปแบบ STAR-XXXX-XXXX)' },
        });
      }
      const innerResp = await dispatchHandler(context, verifyPremiumPin, { pin: input.pin });
      const inner = await innerResp.json();
      return json({ success: true, taskId, status: 'completed', result: inner });
    }

    // chat_consultation — needs { message } in body
    if (skillId === 'chat_consultation') {
      if (!input.message) {
        return json({
          success: true, taskId, status: 'completed',
          result: { success: false, error: 'MESSAGE_REQUIRED', message: 'ต้องระบุ message (คำถามภาษาไทย)' },
        });
      }
      const innerResp = await dispatchHandler(context, handleChat, { message: input.message });
      const inner = await innerResp.json();
      return json({ success: true, taskId, status: 'completed', result: inner });
    }

    // Unknown skill — return clear error instead of generic proxy stub
    return json({
      success: true, taskId, status: 'completed',
      result: { success: false, error: 'UNKNOWN_SKILL', skillId, available: ['birthday_reading','daily_fortune','lottery_results','premium_verify','chat_consultation'] },
    });
  }

  // GET /v1/agent/tasks/:taskId
  const taskMatch = path.match(/^tasks\/(.+)$/);
  if (request.method === 'GET' && taskMatch) {
    return json({ success: false, error: 'TASK_NOT_FOUND' }, 404);
  }

  return json({ success: false, error: 'NOT_FOUND' }, 404);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export { getAgentCard };
