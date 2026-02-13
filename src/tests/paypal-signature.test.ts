// src/tests/paypal-signature.test.ts
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { verifyPayPalWebhookSignature } from '../../lib/paypal/webhook';
import * as client from '../../lib/paypal/client';

// Mock the entire client module
vi.mock('../../lib/paypal/client');

// --- Test Setup ---
const MOCK_ACCESS_TOKEN = 'A21AAIosA21AAIos';
const MOCK_WEBHOOK_ID = 'wh-12345';
const MOCK_API_URL = 'https://api.sandbox.paypal.com';

const getMockHeaders = () => new Map([
  ['paypal-transmission-id', 'trans-id-123'],
  ['paypal-transmission-time', new Date().toISOString()],
  ['paypal-cert-url', 'https://api.sandbox.paypal.com/v1/notifications/certs/cert-url'],
  ['paypal-auth-algo', 'SHA256withRSA'],
  ['paypal-transmission-sig', 'dummy-signature'],
]);

const mockRawBody = JSON.stringify({ id: 'evt-1', event_type: 'TEST_EVENT' });

describe('verifyPayPalWebhookSignature', () => {
  let mockedGetAccessToken: Mock;
  let mockedFetch: Mock;

  beforeEach(() => {
    // 1. Mock getAccessToken
    mockedGetAccessToken = vi.mocked(client.getAccessToken).mockResolvedValue(MOCK_ACCESS_TOKEN);

    // 2. Mock global fetch
    mockedFetch = vi.fn();
    vi.stubGlobal('fetch', mockedFetch);
    
    // 3. Stub environment variables
    vi.stubEnv('PAYPAL_API_URL', MOCK_API_URL);
    vi.stubEnv('PAYPAL_WEBHOOK_ID', MOCK_WEBHOOK_ID);
  });

  afterEach(() => {
    // Restore all mocks to their original state
    vi.restoreAllMocks();
  });

  // --- Test Cases ---

  it('debería devolver true para una firma válida (HAPPY PATH)', async () => {
    mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify({ verification_status: 'SUCCESS' }), { status: 200 }));
    
    const headers = new Headers(Object.fromEntries(getMockHeaders()));
    const result = await verifyPayPalWebhookSignature(headers, mockRawBody);

    expect(result).toBe(true);
    expect(mockedGetAccessToken).toHaveBeenCalledOnce();
    expect(mockedFetch).toHaveBeenCalledOnce();
    expect(mockedFetch).toHaveBeenCalledWith(
      `${MOCK_API_URL}/v1/notifications/verify-webhook-signature`,
      expect.objectContaining({
        method: 'POST',
        body: expect.any(String),
      })
    );
  });

  it('debería devolver false si PayPal responde con "FAILURE"', async () => {
    mockedFetch.mockResolvedValueOnce(new Response(JSON.stringify({ verification_status: 'FAILURE' }), { status: 200 }));

    const headers = new Headers(Object.fromEntries(getMockHeaders()));
    const result = await verifyPayPalWebhookSignature(headers, mockRawBody);

    expect(result).toBe(false);
  });
  
  it('debería devolver false si la llamada a la API de PayPal falla', async () => {
    mockedFetch.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

    const headers = new Headers(Object.fromEntries(getMockHeaders()));
    const result = await verifyPayPalWebhookSignature(headers, mockRawBody);

    expect(result).toBe(false);
  });

  it.each([
    'paypal-transmission-id',
    'paypal-transmission-time',
    'paypal-cert-url',
    'paypal-auth-algo',
    'paypal-transmission-sig',
  ])('debería devolver false si falta la cabecera "%s"', async (headerToRemove) => {
    const mockHeadersMap = getMockHeaders();
    mockHeadersMap.delete(headerToRemove);
    const headers = new Headers(Object.fromEntries(mockHeadersMap));
    
    const result = await verifyPayPalWebhookSignature(headers, mockRawBody);

    expect(result).toBe(false);
    // Fetch should not be called if headers are missing
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('debería lanzar un error si PAYPAL_WEBHOOK_ID no está configurado', async () => {
    vi.stubEnv('PAYPAL_WEBHOOK_ID', ''); // Unset the env var

    const headers = new Headers(Object.fromEntries(getMockHeaders()));

    await expect(verifyPayPalWebhookSignature(headers, mockRawBody))
      .rejects
      .toThrow('PayPal webhook configuration is incomplete.');
    
    expect(mockedFetch).not.toHaveBeenCalled();
  });
});
