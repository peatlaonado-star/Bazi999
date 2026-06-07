// A2A Skill Dispatch — wired 2026-06-07
// Tests the 5 agent card skills (birthday_reading, daily_fortune,
// lottery_results, premium_verify, chat_consultation) and error paths.

import { describe, expect, it } from 'vitest';
import { getAgentCard, handleAgentRequest } from '../functions/_lib/agent-card.js';

function makeContext({ method = 'POST', body = null, path = 'tasks' } = {}) {
  const url = 'https://test.local/v1/agent/tasks';
  const init = { method, headers: { 'content-type': 'application/json' } };
  if (body !== null) init.body = typeof body === 'string' ? body : JSON.stringify(body);
  const request = new Request(url, init);
  return {
    request,
    env: { STARVIA_KV: null, AI: null, STARVIA_JWT_SECRET: 'test-secret-32-chars-xxxxxxxxxxx' },
    params: { path },
  };
}

async function callSkill(skillId, input) {
  const ctx = makeContext({ body: { skillId, input } });
  const resp = await handleAgentRequest(ctx);
  return { status: resp.status, body: await resp.json() };
}

describe('A2A Agent Card', () => {
  it('exposes exactly 5 skills with the expected ids', () => {
    const card = getAgentCard('https://test.local');
    expect(card.skills.map(s => s.id)).toEqual([
      'birthday_reading', 'daily_fortune', 'lottery_results', 'premium_verify', 'chat_consultation',
    ]);
    expect(card.endpoints.tasks).toBe('/v1/agent/tasks');
    expect(card.endpoints.agentCard).toBe('/.well-known/agent.json');
  });
});

describe('A2A Skill: birthday_reading', () => {
  it('returns a Thai-language summary for a valid birth date', async () => {
    const r = await callSkill('birthday_reading', { birthDate: '1990-01-15' });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.result.success).toBe(true);
    expect(r.body.result.reading).toBeDefined();
    expect(r.body.result.reading.summary).toMatch(/คนเกิดวันที่ 15\/1\/2533/);
    expect(r.body.result.reading.birthYearBE).toBe(2533);
    expect(r.body.result.reading.element).toBeDefined();
    expect(r.body.result.reading.constellation).toBeDefined();
  });

  it('rejects an invalid date with INVALID_DATE', async () => {
    const r = await callSkill('birthday_reading', { birthDate: 'not-a-date' });
    expect(r.body.result.error).toBe('INVALID_DATE');
  });
});

describe('A2A Skill: daily_fortune', () => {
  it('returns a fortune for the love category with a valid tone', async () => {
    const r = await callSkill('daily_fortune', { birthDate: '1990-01-15', category: 'love' });
    expect(r.status).toBe(200);
    expect(r.body.result.success).toBe(true);
    expect(r.body.result.fortune.category).toBe('love');
    expect(['good', 'mid', 'bad']).toContain(r.body.result.fortune.tone);
    expect(r.body.result.fortune.message).toBeTruthy();
    expect(Array.isArray(r.body.result.fortune.luckyNumbers)).toBe(true);
    expect(r.body.result.fortune.luckyNumbers.length).toBeGreaterThan(0);
  });

  it('defaults to general category for an unknown one', async () => {
    const r = await callSkill('daily_fortune', { birthDate: '1990-01-15', category: 'bagua' });
    expect(r.body.result.fortune.category).toBe('general');
  });

  it('rejects an invalid date with INVALID_DATE', async () => {
    const r = await callSkill('daily_fortune', { birthDate: 'garbage' });
    expect(r.body.result.error).toBe('INVALID_DATE');
  });
});

describe('A2A Skill: lottery_results', () => {
  it('returns a wrapped A2A envelope with a result object', async () => {
    const r = await callSkill('lottery_results', {});
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);
    expect(r.body.taskId).toMatch(/^task-\d+-[a-z0-9]+$/);
    expect(typeof r.body.result).toBe('object');
    // In test env KV is not bound → handler returns { success:false, error:'KV_NOT_BOUND' }
    // In production with KV bound → handler returns { available:true, firstPrize:... }
    expect(r.body.result).toHaveProperty('success');
  });
});

describe('A2A Skill: premium_verify', () => {
  it('returns PIN_REQUIRED when no pin is supplied', async () => {
    const r = await callSkill('premium_verify', {});
    expect(r.body.result.error).toBe('PIN_REQUIRED');
  });

  it('returns a token or error when a pin is supplied', async () => {
    const r = await callSkill('premium_verify', { pin: 'STAR-TEST-1234' });
    expect(r.status).toBe(200);
    expect(r.body.result.token || r.body.result.error).toBeDefined();
  });
});

describe('A2A Skill: chat_consultation', () => {
  it('returns MESSAGE_REQUIRED when no message is supplied', async () => {
    const r = await callSkill('chat_consultation', {});
    expect(r.body.result.error).toBe('MESSAGE_REQUIRED');
  });

  it('returns a reply or graceful error when a message is supplied', async () => {
    const r = await callSkill('chat_consultation', { message: 'ดวงวันนี้เป็นยังไง' });
    expect(r.status).toBe(200);
    expect(r.body.result.reply || r.body.result.error).toBeDefined();
  });
});

describe('A2A Error Paths', () => {
  it('returns UNKNOWN_SKILL with the list of available skills', async () => {
    const r = await callSkill('totally_made_up', {});
    expect(r.body.result.error).toBe('UNKNOWN_SKILL');
    expect(r.body.result.skillId).toBe('totally_made_up');
    expect(r.body.result.available).toHaveLength(5);
  });

  it('returns 400 INVALID_JSON for malformed body', async () => {
    const ctx = makeContext({ body: 'not-json' });
    const resp = await handleAgentRequest(ctx);
    expect(resp.status).toBe(400);
    expect((await resp.json()).error).toBe('INVALID_JSON');
  });

  it('returns 404 TASK_NOT_FOUND for GET /v1/agent/tasks/:taskId', async () => {
    const ctx = makeContext({ method: 'GET', path: 'tasks/abc123' });
    const resp = await handleAgentRequest(ctx);
    expect(resp.status).toBe(404);
    expect((await resp.json()).error).toBe('TASK_NOT_FOUND');
  });
});
