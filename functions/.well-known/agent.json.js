// GET /.well-known/agent.json — A2A Agent Card
import { getAgentCard } from '../_lib/agent-card.js';

export function onRequest(context) {
  const card = getAgentCard();
  return new Response(JSON.stringify(card, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
