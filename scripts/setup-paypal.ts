// scripts/setup-paypal.ts
// Este script se usa para gestionar los productos y planes de suscripción en PayPal.
// Uso:
// 1. Asegúrate de tener un archivo .env con PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET
//    deno run --allow-env --allow-net --allow-read scripts/setup-paypal.ts

import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { getAccessToken, listProducts, createProduct, listPlans, createPlan } from '../lib/paypal/client.ts';

// --- Constantes ---
const TIENDER_PRODUCT_NAME = 'Suscripción Tiender';
const TIENDER_PLAN_NAME = 'Plan Full';

// --- Flujo Principal ---
async function main() {
  try {
    // Cargar variables de entorno para Deno
    await config({ export: true }); 
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('Credenciales de PayPal (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) no configuradas en .env');
    }

    const accessToken = await getAccessToken(); // Usa la función del nuevo cliente

    // 1. Gestionar Producto
    const allProducts = await listProducts(accessToken);
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
        console.log(`
✅ Plan encontrado: "${tienderPlan.name}" (ID: ${tienderPlan.id})`);
    } else {
        console.log(`
🟡 Plan "${TIENDER_PLAN_NAME}" no encontrado. Creándolo...`);
        tienderPlan = await createPlan(accessToken, tienderProduct.id);
        console.log(`✅ Plan creado: "${tienderPlan.name}" (ID: ${tienderPlan.id})`);
    }

    console.log('\n--- Configuración en PayPal Finalizada ---');
    console.log(`ID de Producto: ${tienderProduct.id}`);
    console.log(`ID de Plan: ${tienderPlan.id}`);
    console.log('Estos IDs son los que necesitarás en tu aplicación para crear suscripciones.');

  } catch (error) {
    console.error(`❌ Error: ${(error as Error).message}`);
  }
}

main();
