/**
 * Tests for STARVIA Payment Service (Omise integration)
 */
import { describe, it, expect, vi } from 'vitest';

// Set env vars before import
process.env.OMISE_SECRET_KEY = 'skey_test_fake';
process.env.OMISE_WEBHOOK_SECRET = 'whsec_test_fake';

const {
  createPayment, checkPaymentStatus, handleWebhook, getPaymentHistory, _setOmiseClientOverride
} = await import('../api/payment-service.mjs');

// Mock omise client
const mockOmiseClient = {
  sources: {
    create: vi.fn().mockResolvedValue({
      id: 'src_test_123',
      type: 'promptpay',
      scannable_code: {
        image: { download_uri: 'https://example.com/qr.png' }
      }
    })
  },
  charges: {
    create: vi.fn().mockResolvedValue({
      id: 'chrg_test_456',
      status: 'pending',
      paid: false,
      amount: 19900,
      currency: 'THB',
      created: Math.floor(Date.now() / 1000)
    }),
    retrieve: vi.fn().mockResolvedValue({
      id: 'chrg_test_456',
      status: 'successful',
      paid: true,
      amount: 19900,
      currency: 'THB',
      created: Math.floor(Date.now() / 1000)
    })
  }
};

// Inject mock before tests
_setOmiseClientOverride(mockOmiseClient);

describe('Payment Service', () => {
  describe('createPayment', () => {
    it('returns error if email missing', async () => {
      const result = await createPayment({});
      expect(result.success).toBe(false);
      expect(result.error).toBe('EMAIL_REQUIRED');
    });

    it('creates payment with valid email', async () => {
      const result = await createPayment({ email: 'test@example.com' });
      expect(result.success).toBe(true);
      expect(result.chargeId).toBeDefined();
      expect(result.qrUrl).toBe('https://example.com/qr.png');
      expect(result.amount).toBe(199);
      expect(result.currency).toBe('THB');
    });

    it('returns custom returnUrl', async () => {
      const result = await createPayment({
        email: 'test@example.com',
        returnUrl: 'https://custom.com/ok'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('checkPaymentStatus', () => {
    it('returns error without chargeId', async () => {
      const result = await checkPaymentStatus(null);
      expect(result.success).toBe(false);
      expect(result.error).toBe('CHARGE_ID_REQUIRED');
    });

    it('returns paid status for successful charge', async () => {
      // First create a pending payment
      await createPayment({ email: 'test2@example.com' });

      // Then check status (mock returns successful)
      const result = await checkPaymentStatus('chrg_test_456');
      expect(result.success).toBe(true);
      expect(result.status).toBe('paid');
      expect(result.pin).toBeDefined();
      expect(result.pin).toMatch(/^STAR-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });
  });

  describe('handleWebhook', () => {
    it('rejects invalid signature', async () => {
      const result = await handleWebhook(
        JSON.stringify({ key: 'charge.complete', data: { id: 'chrg_test', status: 'successful' } }),
        { 'x-omise-signature': 'invalid' }
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_SIGNATURE');
    });

    it('handles valid webhook event', async () => {
      const body = JSON.stringify({
        key: 'charge.complete',
        data: { id: 'chrg_test', status: 'successful' }
      });

      const crypto = await import('node:crypto');
      const signature = crypto.createHmac('sha256', 'whsec_test_fake')
        .update(body)
        .digest('hex');

      const result = await handleWebhook(body, { 'x-omise-signature': signature });
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });
  });

  describe('getPaymentHistory', () => {
    it('returns array of completed payments', () => {
      const history = getPaymentHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
