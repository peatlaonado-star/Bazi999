/**
 * STARVIA Payment Service — Omise PromptPay Integration
 *
 * Flow:
 * 1. Frontend POST /v1/payment/create → creates Omise source + charge
 * 2. Backend returns QR code URL
 * 3. User scans QR and pays
 * 4. Omise sends webhook to /v1/payment/webhook
 * 5. Backend auto-generates premium PIN and returns to frontend
 */

import crypto from 'node:crypto';

// ── Omise Client (lazy init) ──
let omiseClient = null;
let omiseModule = null;
let _omiseOverride = null; // For testing

export function _setOmiseClientOverride(client) {
  _omiseOverride = client;
}

async function loadOmiseModule() {
  if (!omiseModule) {
    omiseModule = await import('omise');
  }
  return omiseModule.default || omiseModule;
}

async function getOmiseClient() {
  if (_omiseOverride) return _omiseOverride;
  if (omiseClient) return omiseClient;

  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('OMISE_SECRET_KEY is not set');
  }

  const omise = await loadOmiseModule();
  omiseClient = omise({ secretKey });
  return omiseClient;
}

// ── Config ──
const PAYMENT_CONFIG = {
  amount: 19900, // 199.00 THB in satangs
  currency: 'THB',
  plan: 'premium_199',
  description: 'STARVIA Premium ดูดวงส่วนตัว 1 เดือน',
};

// ── In-memory payment tracking (replace with DB in production) ──
const pendingPayments = new Map(); // chargeId → { email, createdAt, status }
const completedPayments = new Map(); // chargeId → { email, completedAt, pin }

// ── Create Payment ──
export async function createPayment(input = {}) {
  const { email, returnUrl } = input;

  if (!email) {
    return {
      success: false,
      error: 'EMAIL_REQUIRED',
      message: 'กรุณากรอกอีเมล',
    };
  }

  try {
    const omise = await getOmiseClient();

    // Step 1: Create PromptPay source
    const source = await omise.sources.create({
      type: 'promptpay',
      amount: PAYMENT_CONFIG.amount,
      currency: PAYMENT_CONFIG.currency,
    });

    // Step 2: Create charge with source
    const charge = await omise.charges.create({
      amount: PAYMENT_CONFIG.amount,
      currency: PAYMENT_CONFIG.currency,
      source: source.id,
      description: PAYMENT_CONFIG.description,
      metadata: {
        email,
        plan: PAYMENT_CONFIG.plan,
        product: 'starvia_premium',
      },
      return_uri: returnUrl || `https://starvia.website/payment-success`,
    });

    // Track pending payment
    pendingPayments.set(charge.id, {
      email,
      sourceId: source.id,
      chargeId: charge.id,
      createdAt: new Date().toISOString(),
      status: 'pending',
    });

    // Get QR code URL from source
    const qrUrl = source.scannable_code
      ? source.scannable_code.image.download_uri
      : null;

    return {
      success: true,
      chargeId: charge.id,
      sourceId: source.id,
      qrUrl,
      amount: PAYMENT_CONFIG.amount / 100,
      currency: PAYMENT_CONFIG.currency,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
    };
  } catch (error) {
    console.error('[Payment] Create error:', error.message);
    return {
      success: false,
      error: 'PAYMENT_CREATE_FAILED',
      message: 'ไม่สามารถสร้างรายการชำระเงินได้',
      details: error.message,
    };
  }
}

// ── Check Payment Status ──
export async function checkPaymentStatus(chargeId) {
  if (!chargeId) {
    return {
      success: false,
      error: 'CHARGE_ID_REQUIRED',
      message: 'ต้องระบุ charge ID',
    };
  }

  try {
    const omise = await getOmiseClient();
    const charge = await omise.charges.retrieve(chargeId);

    const isPaid = charge.status === 'successful' || charge.paid;
    const pending = pendingPayments.get(chargeId);

    if (isPaid && pending && pending.status !== 'completed') {
      // Auto-generate premium PIN
      const pin = generatePremiumPin();
      pending.status = 'completed';
      pending.completedAt = new Date().toISOString();
      pending.pin = pin;

      completedPayments.set(chargeId, {
        email: pending.email,
        completedAt: pending.completedAt,
        pin,
        chargeId,
      });

      return {
        success: true,
        status: 'paid',
        pin,
        message: 'ชำระเงินสำเร็จ! รหัส Premium ของคุณคือ:',
      };
    }

    return {
      success: true,
      status: charge.status,
      paid: isPaid,
      amount: charge.amount / 100,
      created: new Date(charge.created * 1000).toISOString(),
    };
  } catch (error) {
    console.error('[Payment] Status check error:', error.message);
    return {
      success: false,
      error: 'STATUS_CHECK_FAILED',
      message: 'ไม่สามารถตรวจสอบสถานะได้',
    };
  }
}

// ── Webhook Handler ──
export async function handleWebhook(body, headers) {
  // Verify webhook signature (Omise uses webhook secret)
  const webhookSecret = process.env.OMISE_WEBHOOK_SECRET;

  if (webhookSecret) {
    const signature = headers['x-omise-signature'] || '';
    const expectedSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSig) {
      console.error('[Payment] Webhook signature mismatch');
      return {
        success: false,
        error: 'INVALID_SIGNATURE',
        status: 401,
      };
    }
  }

  const event = typeof body === 'string' ? JSON.parse(body) : body;

  if (!event || !event.data) {
    return { success: false, error: 'INVALID_WEBHOOK', status: 400 };
  }

  const { data } = event;
  const eventType = event.key;

  console.log(`[Payment] Webhook received: ${eventType}`, data.id);

  // Handle charge.complete event
  if (eventType === 'charge.complete' && data.status === 'successful') {
    const chargeId = data.id;
    const pending = pendingPayments.get(chargeId);

    if (pending && pending.status !== 'completed') {
      const pin = generatePremiumPin();
      pending.status = 'completed';
      pending.completedAt = new Date().toISOString();
      pending.pin = pin;

      completedPayments.set(chargeId, {
        email: pending.email,
        completedAt: pending.completedAt,
        pin,
        chargeId,
      });

      console.log(`[Payment] Auto-unlocked premium for ${pending.email}, PIN: ${pin}`);

      return {
        success: true,
        status: 200,
        message: 'Payment processed, premium unlocked',
        pin,
      };
    }
  }

  return { success: true, status: 200, message: 'Webhook received' };
}

// ── Get Payment History (for admin) ──
export function getPaymentHistory() {
  const history = [];
  for (const [chargeId, data] of completedPayments) {
    history.push({
      chargeId,
      email: data.email,
      completedAt: data.completedAt,
      pin: data.pin,
    });
  }
  return history.sort((a, b) =>
    new Date(b.completedAt) - new Date(a.completedAt)
  );
}

// ── Generate Premium PIN ──
function generatePremiumPin() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 for clarity
  let pin = 'STAR-';
  for (let i = 0; i < 8; i++) {
    if (i === 4) pin += '-';
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

// ── HTTP Handler ──
export function createPaymentHandler(config = {}) {
  return async function paymentHandler(req, res) {
    const url = req.url || '/';

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /v1/payment/create
    if (req.method === 'POST' && url === '/v1/payment/create') {
      try {
        const body = await readJsonBody(req);
        const result = await createPayment(body);
        writeJson(res, result.success ? 200 : 400, result);
      } catch (err) {
        writeJson(res, 500, {
          success: false,
          error: 'INTERNAL_ERROR',
          message: 'เกิดข้อผิดพลาด',
        });
      }
      return;
    }

    // GET /v1/payment/status/:chargeId
    if (req.method === 'GET' && url.startsWith('/v1/payment/status/')) {
      const chargeId = url.split('/v1/payment/status/')[1];
      const result = await checkPaymentStatus(chargeId);
      writeJson(res, result.success ? 200 : 400, result);
      return;
    }

    // POST /v1/payment/webhook
    if (req.method === 'POST' && url === '/v1/payment/webhook') {
      try {
        const body = await readJsonBody(req);
        const result = await handleWebhook(body, req.headers);
        writeJson(res, result.status || 200, result);
      } catch (err) {
        writeJson(res, 500, { success: false, error: 'Webhook error' });
      }
      return;
    }

    // GET /v1/payment/history (admin only)
    if (req.method === 'GET' && url === '/v1/payment/history') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        writeJson(res, 401, { success: false, error: 'Unauthorized' });
        return;
      }
      const history = getPaymentHistory();
      writeJson(res, 200, { success: true, payments: history });
      return;
    }

    // Not handled
    return false;
  };
}

// ── Helpers ──
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function writeJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
