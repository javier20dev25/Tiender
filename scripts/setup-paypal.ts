// scripts/setup-paypal.ts
// Este script se usa para gestionar los productos y planes de suscripción en PayPal.
// Uso:
// 1. Asegúrate de tener un archivo .env con PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET
//    deno run --allow-env --allow-net --allow-read scripts/setup-paypal.ts

import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';

// --- Configuración ---
const env = await config({ export: true });
const PAYPAL_CLIENT_ID = env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL = 'https://api-m.sandbox.paypal.com';

const TIENDER_PRODUCT_NAME = 'Suscripción Tiender';
const TIENDER_PLAN_NAME = 'Plan Full';
const TIENDER_PLAN_PRICE = '9.99';

// --- Funciones de la API de PayPal ---

async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('Credenciales de PayPal no configuradas en .env');
  }
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) throw new Error(`Error al obtener token de PayPal: ${await response.text()}`);
  return (await response.json()).access_token;
}

async function listProducts(accessToken: string): Promise<any[]> {
  const response = await fetch(`${PAYPAL_API_URL}/v1/catalogs/products?page_size=20`, {
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error(`Error al listar productos: ${await response.text()}`);
  return (await response.json()).products || [];
}

async function createProduct(accessToken: string): Promise<any> {
    console.log(`\n--- Creando producto "${TIENDER_PRODUCT_NAME}"... ---`);
    const response = await fetch(`${PAYPAL_API_URL}/v1/catalogs/products`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${accessToken}`, 
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `PRODUCT-${crypto.randomUUID()}` // Previene creación duplicada
        },
        body: JSON.stringify({
            name: TIENDER_PRODUCT_NAME,
            description: "Suscripción para acceder a las funcionalidades completas de Tiender.",
            type: "SERVICE",
            category: "SOFTWARE"
        }),
    });
    if (!response.ok) throw new Error(`Error al crear producto: ${await response.text()}`);
    return await response.json();
}

async function listPlans(accessToken: string): Promise<any[]> {
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/plans?page_size=20`, {
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(`Error al listar planes: ${await response.text()}`);
    return (await response.json()).plans || [];
}

async function createPlan(accessToken: string, productId: string): Promise<any> {
    console.log(`--- Creando plan "${TIENDER_PLAN_NAME}" para el producto ${productId}... ---`);
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
                total_cycles: 0,
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
    if (!response.ok) throw new Error(`Error al crear plan: ${await response.text()}`);
    return await response.json();
}

// --- Flujo Principal ---
async function main() {
  try {
    const accessToken = await getAccessToken();

    // 1. Gestionar Producto
    let allProducts = await listProducts(accessToken);
    let tienderProduct = allProducts.find(p => p.name === TIENDER_PRODUCT_NAME);
    
    if (tienderProduct) {
        console.log(`✅ Producto encontrado: "${tienderProduct.name}" (ID: ${tienderProduct.id})`);
    } else {
        console.log(`🟡 Producto "${TIENDER_PRODUCT_NAME}" no encontrado. Creándolo...`);
        tienderProduct = await createProduct(accessToken);
        console.log(`✅ Producto creado: "${tienderProduct.name}" (ID: ${tienderProduct.id})`);
    }

    // 2. Gestionar Plan
    const allPlans = await listPlans(accessToken);
    let tienderPlan = allPlans.find(p => p.product_id === tienderProduct.id && p.name === TIENDER_PLAN_NAME);

    if (tienderPlan) {
        console.log(`\n✅ Plan encontrado: "${tienderPlan.name}" (ID: ${tienderPlan.id})`);
    } else {
        console.log(`\n🟡 Plan "${TIENDER_PLAN_NAME}" no encontrado. Creándolo...`);
        tienderPlan = await createPlan(accessToken, tienderProduct.id);
        console.log(`✅ Plan creado: "${tienderPlan.name}" (ID: ${tienderPlan.id})`);
    }

    console.log('\n--- Configuración en PayPal Finalizada ---');
    console.log(`ID de Producto: ${tienderProduct.id}`);
    console.log(`ID de Plan: ${tienderPlan.id}`);
    console.log('Estos IDs son los que necesitarás en tu aplicación para crear suscripciones.');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

main();
