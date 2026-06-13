/**
 * STARVIA Agent Card Worker — Cloudflare Workers
 * Handles: /.well-known/agent.json + /v1/agent/tasks
 * 
 * A2A Protocol: https://a2a-protocol.org/
 */

// ── Agent Card Definition ──

function getAgentCard(env) {
  return {
    name: 'Starvia',
    description: 'AI-powered Thai astrology consultant. Provides personalized life blueprints, daily fortune, lottery insights, and premium readings.',
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
        examples: ['ดูดวงคนเกิดวันที่ 15 มกราคม 1990', 'อ่านดวงชะตาจากวันเกิด'],
        inputSchema: {
          type: 'object',
          properties: {
            birthDate: { type: 'string', description: 'Birth date in YYYY-MM-DD format' },
            birthTime: { type: 'string', description: 'Optional birth time HH:MM' },
          },
          required: ['birthDate'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            reading: { type: 'object' },
          },
        },
      },
      {
        id: 'daily_fortune',
        name: 'Daily Fortune',
        description: "Get today's personalized fortune",
        examples: ['ดวงวันนี้', 'โชคลาภวันนี้'],
        inputSchema: {
          type: 'object',
          properties: {
            birthDate: { type: 'string' },
            category: { type: 'string', enum: ['love', 'work', 'money', 'general'] },
          },
          required: ['birthDate'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            fortune: { type: 'object' },
          },
        },
      },
      {
        id: 'lottery_results',
        name: 'Thai Lottery Results',
        description: 'Get latest Thai lottery results with cosmic analysis',
        examples: ['ผลหวยงวดล่าสุด', 'หวย 1 มิถุนายน 2569'],
        inputSchema: {
          type: 'object',
          properties: {
            date: { type: 'string', description: 'Optional date YYYY-MM-DD' },
          },
        },
        outputSchema: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            results: { type: 'object' },
          },
        },
      },
    ],

    endpoints: {
      base: env?.STARVIA_PUBLIC_URL || 'https://starvia.website',
      agentCard: '/.well-known/agent.json',
      tasks: '/v1/agent/tasks',
    },

    authentication: {
      schemes: ['none'],
      description: 'Most skills work without auth.',
    },

    defaultInputModes: ['text'],
    defaultOutputModes: ['text', 'application/json'],

    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
    },

    pricing: {
      currency: 'THB',
      plans: [
        { name: 'free', price: 0, features: ['birthday_reading (preview)', 'daily_fortune (preview)'] },
        { name: 'premium_199', price: 199, features: ['birthday_reading (full)', 'daily_fortune (full)', 'lottery_results'] },
      ],
    },

    documentation: 'https://starvia.website/agent-docs',
    termsOfService: 'https://starvia.website/terms',
  };
}

// ── Task Handlers ──

const skillHandlers = {
  birthday_reading: async (input) => {
    const date = new Date(input.birthDate);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const birthYear = year + 543;

    const constellations = ['มังกร', 'งู', 'ม้า', 'แพะ', 'ลิง', 'ไก่', 'สุนัข', 'หมู', 'หนู', 'วัว', 'เสือ', 'กระต่าย'];
    const elements = ['ไม้', 'ไม้', 'ไฟ', 'ไฟ', 'ดิน', 'ดิน', 'ทอง', 'ทอง', 'น้ำ', 'น้ำ'];
    const constellation = constellations[day % 12];
    const element = elements[month % 10];

    const reading = {
      birthDate: input.birthDate,
      birthYearBE: birthYear,
      constellation,
      element,
      summary: `คนเกิดวันที่ ${day}/${month}/${birthYear} อยู่ในกลุ่มดาว${constellation} ธาตุ${element}`,
      note: 'สำหรับคำทำนายฉบับเต็ม กรุณาซื้อ Premium 199 บาท',
    };
    return { success: true, reading };
  },

  daily_fortune: async (input) => {
    return {
      success: true,
      fortune: {
        message: 'วันนี้ดวงดีมากค่ะ ดาวศุกร์ส่งพลังเสริมความรัก',
        category: input.category || 'general',
        luckyNumber: 7,
        luckyColor: 'ชมพู',
      },
    };
  },

  lottery_results: async (input) => {
    // Fetch from lottery worker or return mock
    try {
      const res = await fetch('https://starvia-lottery.workers.dev/v1/lottery/results');
      const data = await res.json();
      return { success: data.success, results: data };
    } catch {
      return { success: false, results: { available: false } };
    }
  },
};

// ── Main Handler ──

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // GET /.well-known/agent.json — Agent Card
    if (request.method === 'GET' && url.pathname === '/.well-known/agent.json') {
      const card = getAgentCard(env);
      return jsonResponse(card, corsHeaders);
    }

    // POST /v1/agent/tasks — A2A task send
    if (request.method === 'POST' && url.pathname === '/v1/agent/tasks') {
      try {
        const payload = await request.json();

        // A2A message format
        const skillId = payload?.message?.parts?.[0]?.data?.skillId
          || payload?.params?.skillId
          || payload?.skillId;
        const input = payload?.message?.parts?.[0]?.data?.input
          || payload?.params?.input
          || payload?.input
          || {};

        if (!skillId) {
          return jsonResponse({ success: false, error: 'MISSING_SKILL_ID' }, corsHeaders, 400);
        }

        const handler = skillHandlers[skillId];
        if (!handler) {
          return jsonResponse({
            success: false,
            error: 'SKILL_NOT_FOUND',
            availableSkills: Object.keys(skillHandlers),
          }, corsHeaders, 404);
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

        return jsonResponse(response, corsHeaders);
      } catch (err) {
        return jsonResponse({
          success: false,
          error: 'INTERNAL_ERROR',
          message: err.message,
        }, corsHeaders, 500);
      }
    }

    // 404
    return jsonResponse({ success: false, error: 'NOT_FOUND' }, corsHeaders, 404);
  }
};

// ── Helpers ──

function jsonResponse(data, corsHeaders = {}, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}
