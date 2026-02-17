// supabase/functions/sync-paypal-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getAccessToken } from '../_shared/paypal.ts';

console.log('Función "sync-paypal-subscription" iniciada.');

// --- Types, Enums, and Mappers ---
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled';

function mapPayPalStatusToEnum(paypalStatus: string): SubscriptionStatus | null {
  const status = paypalStatus.toLowerCase();
  switch (status) {
    case 'active':
      return 'active';
    case 'suspended':
      return 'past_due';
    case 'cancelled':
      return 'canceled';
    default:
      return null;
  }
}

// --- SERVIDOR PRINCIPAL ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Usuario no autenticado.');
    }

    const { data: subscription, error: dbError } = await supabaseClient
      .from('subscriptions')
      .select('provider_subscription_id, status')
      .eq('user_id', user.id)
      .single();

    if (dbError || !subscription) {
      return new Response(JSON.stringify({ status: 'no_subscription_found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = await getAccessToken();
    const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL')!;
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscription.provider_subscription_id}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Error al consultar la suscripción en PayPal. Código: ${response.status}`);
    }

    const paypalSub = await response.json();
    const mappedPaypalStatus = mapPayPalStatusToEnum(paypalSub.status);
    const dbStatus = subscription.status;

    if (!mappedPaypalStatus) {
      console.warn(`Estado de PayPal no manejado ('${paypalSub.status}') recibido para la subscripción ${subscription.provider_subscription_id}. No se tomarán acciones.`);
      return new Response(JSON.stringify({ status: 'in_sync', current_status: dbStatus, message: 'Unhandled PayPal status ignored.' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (mappedPaypalStatus !== dbStatus) {
      console.log(`Desincronización detectada para ${subscription.provider_subscription_id}: BD='${dbStatus}', PayPal='${mappedPaypalStatus}'. Actualizando...`);

      const { error: updateError } = await supabaseClient
        .from('subscriptions')
        .update({ status: mappedPaypalStatus })
        .eq('provider_subscription_id', subscription.provider_subscription_id);

      if (updateError) {
        throw new Error(`Error al actualizar el estado de la suscripción en la BD: ${updateError.message}`);
      }

      return new Response(JSON.stringify({ status: 'reconciled', old_status: dbStatus, new_status: mappedPaypalStatus }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ status: 'in_sync', current_status: dbStatus }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error fatal en sync-paypal-subscription:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
