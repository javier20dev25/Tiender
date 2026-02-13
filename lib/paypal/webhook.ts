// lib/paypal/webhook.ts
import { getAccessToken } from './client.ts'; // Import from the client module

// --- Configuration ---
// These should be available as environment variables where the webhook is deployed (e.g., Supabase Functions)
export async function verifyPayPalWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
  const PAYPAL_API_URL = process.env.PAYPAL_API_URL || (typeof Deno !== 'undefined' && Deno.env.get('PAYPAL_API_URL')) || 'https://api-m.sandbox.paypal.com'; // Default to sandbox
  const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || (typeof Deno !== 'undefined' && Deno.env.get('PAYPAL_WEBHOOK_ID'));

  if (!PAYPAL_API_URL || !PAYPAL_WEBHOOK_ID) {
    console.error('PayPal webhook configuration error: PAYPAL_API_URL or PAYPAL_WEBHOOK_ID not set.');
    throw new Error('PayPal webhook configuration is incomplete.');
  }
  
  const accessToken = await getAccessToken();
  
  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionTime = headers.get('paypal-transmission-time');
  const certUrl = headers.get('paypal-cert-url');
  const authAlgo = headers.get('paypal-auth-algo');
  const transmissionSig = headers.get('paypal-transmission-sig');

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      console.error('Missing required PayPal transmission headers.');
      return false;
  }

  const verificationPayload = {
    transmission_id: transmissionId,
    transmission_time: transmissionTime,
    cert_url: certUrl,
    auth_algo: authAlgo,
    transmission_sig: transmissionSig,
    webhook_id: PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(rawBody),
  };

  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify(verificationPayload),
  });

  if (!response.ok) {
    console.error('PayPal signature verification API error:', response.status, await response.text());
    return false;
  }
  
  const data = await response.json();
  return data.verification_status === 'SUCCESS';
}