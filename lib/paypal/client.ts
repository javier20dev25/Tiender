// lib/paypal/client.ts
// This module provides a client for interacting with the PayPal API.

// Node.js uses 'process.env', Deno uses 'Deno.env'.
// We'll use a common pattern that should work in both environments if configured correctly.
// For Deno scripts, ensure you run with '--allow-env'. For Node.js, ensure .env is loaded.

// --- Interfaces for PayPal API ---
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
  billing_cycles: unknown[]; // Simplified for this context
  payment_preferences: unknown; // Simplified for this context
}

// --- Configuration ---
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com'; // Default to sandbox

const TIENDER_PRODUCT_NAME = 'Suscripción Tiender';
const TIENDER_PLAN_NAME = 'Plan Full';
const TIENDER_PLAN_PRICE = '9.99';

// --- PayPal API Client Functions ---

export async function getAccessToken(): Promise<string> {
  const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || Deno.env.get('PAYPAL_CLIENT_ID');
  const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || Deno.env.get('PAYPAL_CLIENT_SECRET');

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal Client ID or Secret not configured.');
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get PayPal access token: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return data.access_token;
}

export async function listProducts(accessToken: string): Promise<PayPalProduct[]> {
  const response = await fetch(`${PAYPAL_API_URL}/v1/catalogs/products?page_size=20`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Error listing PayPal products: ${response.status} - ${await response.text()}`);
  return (await response.json() as {products: PayPalProduct[]}).products || []; 
}

export async function createProduct(accessToken: string): Promise<PayPalProduct> {
    console.log(`\n--- Creating PayPal Product "${TIENDER_PRODUCT_NAME}" ---`);
    const response = await fetch(`${PAYPAL_API_URL}/v1/catalogs/products`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${accessToken}`, 
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `PRODUCT-${crypto.randomUUID()}` // Prevent duplicate creation
        },
        body: JSON.stringify({
            name: TIENDER_PRODUCT_NAME,
            description: "Suscripción para acceder a las funcionalidades completas de Tiender.",
            type: "SERVICE",
            category: "SOFTWARE"
        }),
    });
    if (!response.ok) throw new Error(`Error creating PayPal product: ${response.status} - ${await response.text()}`);
    return await response.json() as PayPalProduct; 
}

export async function listPlans(accessToken: string): Promise<PayPalPlan[]> {
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/plans?page_size=20`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Error listing PayPal plans: ${response.status} - ${await response.text()}`);
    return (await response.json() as {plans: PayPalPlan[]}).plans || [];
}

export async function createPlan(accessToken: string, productId: string): Promise<PayPalPlan> {
    console.log(`--- Creating PayPal Plan "${TIENDER_PLAN_NAME}" for product ${productId}... ---`);
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/plans`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `PLAN-${crypto.randomUUID()}`
        },
        body: JSON.stringify({
            product_id: productId,
            name: TIENDER_PLAN_NAME,
            description: "Acceso completo a todas las funcionalidades de Tiender.",
            status: "ACTIVE",
            billing_cycles: [{
                frequency: { interval_unit: "MONTH", interval_count: 1 },
                tenure_type: "REGULAR",
                sequence: 1,
                total_cycles: 0, // 0 means it recurs indefinitely until cancelled
                pricing_scheme: {
                    fixed_price: { value: TIENDER_PLAN_PRICE, currency_code: "USD" }
                }
            }],
            payment_preferences: {
                auto_bill_outstanding: true, 
                setup_fee_failure_action: "CONTINUE", 
            },
        }),
    });
    if (!response.ok) throw new Error(`Error creating PayPal plan: ${response.status} - ${await response.text()}`);
    return await response.json() as PayPalPlan; 
}