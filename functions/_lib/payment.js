// STARVIA Payment Service — Cloudflare Pages Functions
// Replaces api/payment-service.mjs (Node.js + omise SDK)
// Status: STUB — Omise API keys not yet approved
// When keys arrive: set env vars (OMISE_SECRET_KEY, OMISE_WEBHOOK_SECRET)
// This file is dormant until then.

import { issuePins } from './admin.js';
import { signHS256, extractBearerToken, verifyHS256 } from './jwt.js';

const OMISE_API = 'https://api.omise.co';

function omiseAuthHeader(secretKey) {
  return 'Basic ' + btoa(secretKey + ':');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function isOmiseConfigured(env) {
  return !!(env.OMISE_SECRET_KEY && env.OMISE_WEBHOOK_SECRET);
}

// ── POST /v1/payment/create ──
// Body: { amount?: 199, plan?: "premium_199" }
// Returns: { source: { id, qr_code_url }, charge: { id } }
export async function createPayment(context) {
  const { env } = context;
  if (!isOmiseConfigured(env)) {
    return json({
      success: false,
      error: 'PAYMENT_NOT_CONFIGURED',
      message: 'ระบบชำระเงินยังไม่พร้อมใช้งาน (รอ Omise อนุมัติ)',
      stage: 'awaiting_omise_approval',
    }, 503);
  }
  // TODO: when keys arrive, create Omise source for PromptPay + charge
  // Body: POST /v1/sources { type: "promptpay", amount, currency: "THB" }
  // Then POST /v1/charges { source: <source_id>, amount, currency, return_uri }
  return json({ success: false, error: 'NOT_IMPLEMENTED_YET' }, 501);
}

// ── POST /v1/payment/webhook ──
// Omise sends charge.complete / charge.failed events
// On charge.complete → auto-generate Premium PIN and email to user
export async function paymentWebhook(context) {
  const { request, env } = context;
  if (!isOmiseConfigured(env)) {
    return json({ success: false, error: 'PAYMENT_NOT_CONFIGURED' }, 503);
  }
  // TODO: when keys arrive:
  // 1. Verify webhook signature using env.OMISE_WEBHOOK_SECRET
  // 2. Parse event (charge.complete → mark paid → issue PIN → return to client)
  return json({ success: false, error: 'NOT_IMPLEMENTED_YET' }, 501);
}

// ── POST /v1/payment/verify { pin: "STAR-XXXX-XXXX" } ──
// For manual payment flow (admin-issued PIN) — this already works via premium verify
// We expose it here too as a convenience
export async function verifyPayment(context) {
  // Reuse premium verify
  const { verifyPremiumPin } = await import('./premium.js');
  return verifyPremiumPin(context);
}

// ── GET /v1/payment/status/:chargeId ──
export async function paymentStatus(context) {
  const { env, params } = context;
  if (!isOmiseConfigured(env)) {
    return json({ success: false, error: 'PAYMENT_NOT_CONFIGURED' }, 503);
  }
  // TODO: when keys arrive, GET /v1/charges/{id} with basic auth
  return json({ success: false, error: 'NOT_IMPLEMENTED_YET' }, 501);
}
