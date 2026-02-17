// supabase/functions/_shared/paypal.ts

export interface PayPalProduct {
    id: string;
    name: string;
    description?: string;
    type: string;
    category: string;
}

export interface PayPalPlan {
    id: string;
    product_id: string;
    name: string;
    description: string;
    status: string;
}

export async function getAccessToken(): Promise<string> {
    const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com';
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error('PayPal Client ID or Secret not configured in environment variables.');
    }

    // Use btoa for base64 encoding in Deno
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);

    const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get PayPal access token: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    return data.access_token;
}

export async function verifyPayPalWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
    const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com';
    const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID');

    if (!PAYPAL_WEBHOOK_ID) {
        console.error('PAYPAL_WEBHOOK_ID not set.');
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
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(verificationPayload),
    });

    if (!response.ok) {
        console.error('PayPal signature verification API error:', response.status, await response.text());
        return false;
    }

    const data = await response.json();
    return data.verification_status === 'SUCCESS';
}
