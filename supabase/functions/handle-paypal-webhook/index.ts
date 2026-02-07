// supabase/functions/handle-paypal-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyPayPalWebhookSignature } from '../../../lib/paypal/webhook.ts';
import { processWebhookEvent, PlanMap } from './logic.ts'; // Import from logic file

console.log('Función "handle-paypal-webhook" iniciada.');

// This map is now defined in the Deno environment
const PAYPAL_PLAN_MAP: PlanMap = {
  [Deno.env.get('PAYPAL_PLAN_ID_STANDARD')!]: 'standard',
  [Deno.env.get('PAYPAL_PLAN_ID_FULL')!]: 'full',
};

// --- Servidor Principal ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    if (!await verifyPayPalWebhookSignature(req.headers, rawBody)) {
      return new Response(JSON.stringify({ error: 'Fallo en la verificación' }), { status: 403, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Llama a la lógica exportable, pasando el plan map
    await processWebhookEvent(event, supabaseAdmin, PAYPAL_PLAN_MAP);

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error fatal en el webhook de PayPal:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
