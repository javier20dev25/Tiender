// supabase/functions/create-paypal-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

console.log('Función "create-paypal-subscription" iniciada.');

// Necesitarás estas variables de entorno en tu proyecto de Supabase
// PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_PLAN_ID
// PAYPAL_API_URL (ej: https://api-m.sandbox.paypal.com)

/**
 * Obtiene un token de acceso de la API de PayPal.
 */
async function getPayPalAccessToken() {
  const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
  const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL');

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_API_URL) {
    throw new Error('Faltan las credenciales de PayPal o la URL de la API como variables de entorno.');
  }

  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('No se pudo obtener el token de acceso de PayPal.');
  }

  const data = await response.json();
  return data.access_token;
}

serve(async (req) => {
  // Manejar la solicitud pre-vuelo (pre-flight) de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Crear un cliente de Supabase para obtener el usuario autenticado
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

    // 2. Obtener el token de acceso de PayPal
    const accessToken = await getPayPalAccessToken();
    const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL');
    const PAYPAL_PLAN_ID = Deno.env.get('PAYPAL_PLAN_ID');

    if (!PAYPAL_PLAN_ID) {
      throw new Error('Falta la variable de entorno PAYPAL_PLAN_ID.');
    }

    // 3. Crear la suscripción en PayPal
    const subscriptionResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: PAYPAL_PLAN_ID,
        subscriber: {
          name: {
            given_name: user.email?.split('@')[0] || 'Usuario', // Usar el email como nombre por defecto
            surname: 'Tiender'
          },
          email_address: user.email,
        },
        // URLs a las que PayPal redirigirá al usuario después de la aprobación o cancelación
        application_context: {
          return_url: `${Deno.env.get('SUPABASE_URL')}/dashboard?paypal=success`,
          cancel_url: `${Deno.env.get('SUPABASE_URL')}/dashboard?paypal=cancel`,
        },
      }),
    });

    if (!subscriptionResponse.ok) {
        const errorDetails = await subscriptionResponse.json();
        console.error('Error al crear la suscripción en PayPal:', errorDetails);
        throw new Error('No se pudo crear la suscripción en PayPal.');
    }

    const subscriptionData = await subscriptionResponse.json();

    // 4. Encontrar el enlace de aprobación y enviarlo al frontend
    const approveUrl = subscriptionData.links.find(link => link.rel === 'approve')?.href;

    if (!approveUrl) {
      throw new Error('No se encontró el enlace de aprobación en la respuesta de PayPal.');
    }
    
    return new Response(JSON.stringify({ approve_url: approveUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
