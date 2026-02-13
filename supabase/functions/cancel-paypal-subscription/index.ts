// supabase/functions/cancel-paypal-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import { corsHeaders } from '../_shared/cors.ts';
import { getAccessToken } from '../../../lib/paypal/client.ts';

console.log('Función "cancel-paypal-subscription" iniciada.');

serve(async (req) => {
  // Manejo de la solicitud pre-vuelo OPTIONS para CORS.
  // Es un requisito para que los navegadores permitan llamadas desde el frontend.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Autenticar al usuario a partir del token de autorización que envía el frontend.
    // Se crea un cliente de Supabase en el contexto de este usuario.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Obtenemos los datos del usuario. Si no hay usuario, es un token inválido o expirado.
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado.');
    }

    // 2. Encontrar la suscripción activa del usuario en nuestra base de datos.
    console.log(`Buscando suscripción para el usuario: ${user.id}`);
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('provider_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['active', 'suspended']) // Una suscripción puede estar activa o suspendida por fallos de pago.
      .single();

    if (subError || !subscription) {
       throw new Error('No se encontró una suscripción activa para cancelar.');
    }

    const subscriptionId = subscription.provider_subscription_id;
    console.log(`Suscripción encontrada: ${subscriptionId}. Procediendo a cancelar en PayPal.`);

    // 3. Llamar a la API de PayPal para solicitar la cancelación.
    const accessToken = await getAccessToken();
    const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL')!;
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=minimal' // No necesitamos que nos devuelva el objeto completo.
      },
      body: JSON.stringify({ reason: 'Cancelado por el usuario desde la aplicación.' })
    });

    // La API de PayPal devuelve 204 No Content en caso de éxito, lo cual es estándar para este tipo de operación.
    if (response.status !== 204) {
       const errorBody = await response.text();
       console.error(`Error de PayPal API: ${response.status}`, errorBody);
       throw new Error(`Error al solicitar la cancelación en PayPal. Código: ${response.status}`);
    }

    console.log(`Solicitud de cancelación para ${subscriptionId} enviada exitosamente a PayPal.`);
    
    // 4. Devolver éxito. La actualización del estado en nuestra BD se delega al webhook
    // 'BILLING.SUBSCRIPTION.CANCELLED', que se activará como resultado de esta llamada.
    return new Response(JSON.stringify({ success: true, message: 'Solicitud de cancelación enviada correctamente.' }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error fatal en cancel-paypal-subscription:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
