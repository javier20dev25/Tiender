// supabase/functions/create-paypal-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getAccessToken } from '../_shared/paypal.ts';

console.log('Función "create-paypal-subscription" iniciada.');

// --- Configuración ---
const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com';

// --- Interfaces ---
interface SubscriptionRequestBody {
  planType: 'standard' | 'full'; // Esperamos el tipo de plan elegido por el usuario
}

// --- SERVIDOR PRINCIPAL ---
serve(async (req) => {
  // Manejar la solicitud pre-vuelo (pre-flight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });
  }

  try {
    // 1. Obtener el usuario autenticado
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuario no autenticado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // 2. Obtener el planType del cuerpo de la solicitud
    const { planType }: SubscriptionRequestBody = await req.json();
    if (!planType || !['standard', 'full'].includes(planType)) {
      return new Response(JSON.stringify({ error: 'planType inválido. Debe ser "standard" o "full".' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. Obtener el token de acceso de PayPal
    const accessToken = await getAccessToken();

    // 4. Determinar el PAYPAL_PLAN_ID correcto basado en el planType
    let PAYPAL_PLAN_ID: string;
    if (planType === 'standard') {
      PAYPAL_PLAN_ID = Deno.env.get('PAYPAL_PLAN_ID_STANDARD');
    } else { // planType === 'full'
      PAYPAL_PLAN_ID = Deno.env.get('PAYPAL_PLAN_ID_FULL');
    }

    if (!PAYPAL_PLAN_ID) {
      throw new Error(`Falta la variable de entorno para el plan PayPal '${planType}': PAYPAL_PLAN_ID_${planType.toUpperCase()}.`);
    }
    console.log(`Usando PayPal Plan ID: ${PAYPAL_PLAN_ID} para el plan: ${planType}`);

    // 5. Configurar URLs de retorno y cancelación (idealmente dinámicas)
    const returnUrl = `${Deno.env.get('APP_FRONTEND_URL') || 'http://localhost:5173'}/dashboard?paypal=success`;
    const cancelUrl = `${Deno.env.get('APP_FRONTEND_URL') || 'http://localhost:5173'}/dashboard?paypal=cancel`;

    // 6. Crear la suscripción en PayPal
    const subscriptionResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: PAYPAL_PLAN_ID, // Usar el ID de plan correcto
        subscriber: {
          name: {
            given_name: user.email?.split('@')[0] || 'Usuario',
            surname: 'Tiender'
          },
          email_address: user.email,
        },
        application_context: {
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
      const errorDetails = await subscriptionResponse.json();
      console.error(`Error al crear la suscripción en PayPal para el plan ${planType} (ID: ${PAYPAL_PLAN_ID}):`, errorDetails);
      throw new Error(`No se pudo crear la suscripción en PayPal. Detalles: ${JSON.stringify(errorDetails)}`);
    }

    const subscriptionData = await subscriptionResponse.json();

    // 7. Encontrar el enlace de aprobación y enviarlo al frontend
    const approveUrl = subscriptionData.links.find((link: { rel: string }) => link.rel === 'approve')?.href;

    if (!approveUrl) {
      throw new Error('No se encontró el enlace de aprobación en la respuesta de PayPal.');
    }

    return new Response(JSON.stringify({ approvalUrl: approveUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error fatal en create-paypal-subscription:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
