// supabase/functions/cancel-paypal-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getAccessToken } from '../../lib/paypal/client.ts';

console.log('Función "cancel-paypal-subscription" iniciada.');

const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL')!; // Ya configurado como Live o Sandbox

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log(`Petición de cancelación para el usuario: ${user.id}`);

    // 2. Encontrar la suscripción activa del usuario en nuestra BD
    const { data: activeSubscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('provider_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing']) // Buscamos suscripciones activas o en prueba
      .single();

    if (subError || !activeSubscription) {
      throw new Error(`No se encontró una suscripción activa para el usuario ${user.id}.`);
    }
    
    const subscriptionId = activeSubscription.provider_subscription_id;
    console.log(`Suscripción activa encontrada: ${subscriptionId}`);

    // 3. Obtener token de acceso de PayPal
    const accessToken = await getAccessToken();

    // 4. Enviar la petición de cancelación a PayPal
    const reason = 'Cancelado por el usuario desde el dashboard de la aplicación.';
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason }),
    });

    // PayPal devuelve un 204 No Content si la cancelación es exitosa
    if (response.status !== 204) {
      const errorDetails = await response.json();
      console.error('Error al cancelar la suscripción en PayPal:', errorDetails);
      throw new Error(`PayPal no pudo cancelar la suscripción. Detalles: ${JSON.stringify(errorDetails)}`);
    }

    console.log(`Orden de cancelación para la suscripción ${subscriptionId} enviada a PayPal exitosamente.`);
    // Nota: El estado en nuestra BD se actualizará a 'cancelled' cuando recibamos
    // el webhook 'BILLING.SUBSCRIPTION.CANCELLED' de PayPal. Esta función solo inicia el proceso.

    return new Response(JSON.stringify({ success: true, message: 'La solicitud de cancelación ha sido procesada.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fatal en cancel-paypal-subscription:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
