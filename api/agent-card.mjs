// Starvia Agent Card (A2A Protocol)
// ทำให้ Starvia เป็น AI Agent ที่ agent อื่นเรียกใช้ได้
// Spec: https://github.com/google/A2A (Agent-to-Agent Protocol)

import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Agent Card Definition ──
// ตาม A2A Protocol: https://a2a-protocol.org/
function getAgentCard() {
  return {
    // Identity
    name: 'Starvia',
    description: 'AI-powered Thai astrology consultant. Provides personalized life blueprints, daily fortune, lottery insights, and premium readings. Fluent in Thai cosmic/mu-tee-lu terminology.',
    version: '1.0.0',

    // Provider
    provider: {
      organization: 'Starvia',
      url: 'https://starvia.website',
    },

    // Capabilities — สิ่งที่ agent นี้ทำได้
    skills: [
      {
        id: 'birthday_reading',
        name: 'Birthday Reading',
        description: 'Generate personalized life blueprint from birth date (DD/MM/YYYY)',
        examples: [
          'ดูดวงคนเกิดวันที่ 15 มกราคม 1990',
          'อ่านดวงชะตาจากวันเกิด',
          'Generate Thai astrology profile',
        ],
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
        description: 'Get today\'s personalized fortune, lucky colors/numbers, and cosmic guidance',
        examples: [
          'ดวงวันนี้',
          'โชคลาภวันนี้',
          'Today\'s fortune',
        ],
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
            fortune: { type: 'object', description: 'Today\'s personalized fortune' },
          },
        },
      },
      {
        id: 'lottery_results',
        name: 'Thai Lottery Results',
        description: 'Get latest Thai lottery results (1st and 16th of each month) with cosmic analysis',
        examples: [
          'ผลหวยงวดล่าสุด',
          'หวย 1 มิถุนายน 2569',
          'Latest lottery numbers',
        ],
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
        examples: [
          'ตรวจสอบ PIN STAR-XXXX-XXXX',
          'Verify premium access',
        ],
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
        description: 'Chat with "Dara" — Thai astrology AI assistant. Answers questions about destiny, planets, cosmic energy. Falls back to Premium pitch for off-topic or payment questions.',
        examples: [
          'ดวงคนเกิดวันจันทร์เป็นยังไง',
          'ฤกษ์ดีทำบุญ',
          'Ask about Thai astrology',
        ],
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

    // Endpoints — URLs สำหรับเรียกใช้
    endpoints: {
      base: process.env.STARVIA_PUBLIC_URL || 'http://localhost:8787',
      agentCard: '/.well-known/agent.json',
      tasks: '/v1/agent/tasks',
      tasksGet: '/v1/agent/tasks/{taskId}',
      tasksCancel: '/v1/agent/tasks/{taskId}:cancel',
    },

    // Authentication
    authentication: {
      schemes: ['bearer', 'none'],
      description: 'Most skills work without auth. Premium verify requires JWT.',
      credentials: process.env.STARVIA_AGENT_TOKEN || null,
    },

    // Supported content types
    defaultInputModes: ['text', 'text/plain'],
    defaultOutputModes: ['text', 'text/plain', 'application/json'],

    // Streaming support
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },

    // Pricing (optional)
    pricing: {
      currency: 'THB',
      plans: [
        { name: 'free', price: 0, features: ['birthday_reading (preview)', 'daily_fortune (preview)'] },
        { name: 'premium_199', price: 199, billingPeriod: 'lifetime', features: ['birthday_reading (full)', 'daily_fortune (full)', 'lottery_results', 'chat_consultation'] },
      ],
    },

    // Documentation
    documentation: 'https://starvia.website/agent-docs',

    // Terms
    termsOfService: 'https://starvia.website/terms',
  };
}

// ── Task Handlers ──
// แต่ละ skill มี handler ที่รับ input → return output
const skillHandlers = {
  birthday_reading: async (input) => {
    // Generate basic reading from birth date (preview — full version requires Premium)
    const date = new Date(input.birthDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const birthYear = year + 543; // Buddhist Era

    // Simple Thai astrology summary (12 constellations + elements)
    const constellations = ['มังกร', 'งู', 'ม้า', 'แพะ', 'ลิง', 'ไก่', 'สุนัข', 'หมู', 'หนู', 'วัว', 'เสือ', 'กระต่าย'];
    const elements = ['ไม้', 'ไม้', 'ไฟ', 'ไฟ', 'ดิน', 'ดิน', 'ทอง', 'ทอง', 'น้ำ', 'น้ำ'];
    const constellation = constellations[day % 12];
    const element = elements[month % 10];

    const reading = {
      birthDate: input.birthDate,
      birthYearBE: birthYear,
      constellation,
      element,
      summary: `คนเกิดวันที่ ${day}/${month}/${birthYear} อยู่ในกลุ่มดาว${constellation} ธาตุ${element} ตามปีนักษัตรไทย`,
      note: 'สำหรับคำทำนายฉบับเต็ม (คัมภีร์ 6 ด้าน + กราฟชีวิต) กรุณาซื้อ Premium 199 บาท',
      premiumUnlockPin: null,
    };
    return { success: true, reading };
  },

  daily_fortune: async (input) => {
    // Use chat endpoint with personalized prompt (Ollama may be disabled in prod)
    const prompt = `ดวง${input.category === 'love' ? 'ความรัก' : input.category === 'work' ? 'การงาน' : input.category === 'money' ? 'การเงิน' : 'ทั่วไป'}วันนี้ของคนเกิด ${input.birthDate}`;
    const res = await fetch(`${process.env.STARVIA_API_BASE || 'http://localhost:8787'}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
    });
    const data = await res.json();
    return { success: data.success, fortune: { message: data.reply, category: input.category } };
  },

  lottery_results: async (input) => {
    // Lottery handler doesn't parse query strings, so call without date
    // (returns latest results by default)
    const res = await fetch(`${process.env.STARVIA_API_BASE || 'http://localhost:8787'}/v1/lottery/results`);
    const data = await res.json();
    // If specific date requested, try to filter
    if (input.date && data.results) {
      return { success: data.success, results: { ...data, requestedDate: input.date, available: data.date === input.date } };
    }
    return { success: data.success, results: data };
  },

  premium_verify: async (input) => {
    const res = await fetch(`${process.env.STARVIA_API_BASE || 'http://localhost:8787'}/v1/premium/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: input.pin }),
    });
    return await res.json();
  },

  chat_consultation: async (input) => {
    const res = await fetch(`${process.env.STARVIA_API_BASE || 'http://localhost:8787'}/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.message }),
    });
    const data = await res.json();
    return { success: data.success, reply: data.reply };
  },
};

// ── A2A Request Handler ──
// รับ request แบบ A2A (task send) แล้ว route ไป handler ที่ตรงกัน
async function handleAgentRequest(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // GET /.well-known/agent.json — return Agent Card
  if (req.method === 'GET') {
    const card = getAgentCard();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(card, null, 2));
  }

  // POST /v1/agent/tasks — A2A task send
  if (req.method === 'POST' && req.url === '/v1/agent/tasks') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);

        // A2A message format
        const skillId = payload?.message?.parts?.[0]?.data?.skillId
          || payload?.params?.skillId
          || payload?.skillId;
        const input = payload?.message?.parts?.[0]?.data?.input
          || payload?.params?.input
          || payload?.input
          || {};

        if (!skillId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'MISSING_SKILL_ID' }));
        }

        const handler = skillHandlers[skillId];
        if (!handler) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'SKILL_NOT_FOUND', availableSkills: Object.keys(skillHandlers) }));
        }

        const result = await handler(input);

        // A2A response format
        const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const response = {
          jsonrpc: '2.0',
          id: payload.id || taskId,
          result: {
            id: taskId,
            status: { state: result.success ? 'completed' : 'failed' },
            artifacts: [
              {
                parts: [
                  {
                    type: 'application/json',
                    data: result,
                  },
                ],
              },
            ],
            metadata: {
              skillId,
              timestamp: new Date().toISOString(),
            },
          },
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'INTERNAL_ERROR', message: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: false, error: 'NOT_FOUND' }));
}

export { getAgentCard, handleAgentRequest, skillHandlers };
