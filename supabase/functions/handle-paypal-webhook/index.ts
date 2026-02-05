// supabase/functions/handle-paypal-webhook/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifyPayPalWebhookSignature } from '../../../lib/paypal/webhook.ts'; // Import from the new webhook module

console.log('Función "handle-paypal-webhook" iniciada.');

// --- INTERFACES PARA EL WEBHOOK DE PAYPAL ---
interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string; // ID de la suscripción
    status: string;
    status_update_time?: string;
    plan_id?: string; // ID del plan de PayPal asociado a la suscripción
    subscriber?: {
      email_address?: string;
    };
    billing_info?: {
      next_billing_time?: string; 
      last_payment?: {
        time: string;
      };
    };
    // Puede contener más campos dependiendo del evento
  };
}

// --- Mapeo de PayPal Plan ID a nuestro planType interno ---
const PAYPAL_PLAN_MAP: { [key: string]: 'standard' | 'full' } = {
  [Deno.env.get('PAYPAL_PLAN_ID_STANDARD')!]: 'standard',
  [Deno.env.get('PAYPAL_PLAN_ID_FULL')!]: 'full',
};

// --- FUNCIONES AUXILIARES ---
// Función para obtener el user_id por email (asegurarse que el RPC exista en Supabase)
async function getUserIdByEmail(supabase: SupabaseClient, email: string): Promise<string> {
    const { data: userId, error: rpcError } = await supabase.rpc('get_user_id_by_email', { user_email: email });
    if (rpcError || !userId) {
        throw new Error(`No se pudo encontrar el usuario para el email ${email}: ${rpcError?.message || 'RPC no devolvió usuario'}`);
    }
    return userId;
}

// Función para obtener el store_id por user_id
async function getStoreIdByUserId(supabase: SupabaseClient, userId: string): Promise<string> {
    const { data: store, error: storeSelectError } = await supabase
      .from('stores')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (storeSelectError || !store) {
        throw new Error(`No se pudo encontrar la tienda para el usuario ${userId}: ${storeSelectError?.message || 'Tienda no encontrada'}`);
    }
    return store.id;
}

// --- SERVIDOR PRINCIPAL ---
serve(async (req) => {
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
    const rawBody = await req.text();
    // Verificar la firma del webhook
    if (!await verifyPayPalWebhookSignature(req.headers, rawBody)) {
      console.warn('Fallo en la verificación del webhook de PayPal.');
      return new Response(JSON.stringify({ error: 'Fallo en la verificación' }), { status: 403, headers: corsHeaders });
    }

    console.log('✅ Webhook de PayPal verificado.');
    const event = JSON.parse(rawBody) as PayPalWebhookEvent;
    
    // --- LÓGICA DE NEGOCIO ---
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const subscriptionId = event.resource.id;
    const planId = event.resource.plan_id;
    const standardPlanId = Deno.env.get('PAYPAL_PLAN_ID_STANDARD');

    // --- Procesar eventos de ACTIVACIÓN ---
    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      console.log(`Evento BILLING.SUBSCRIPTION.ACTIVATED recibido para suscripción ${subscriptionId}.`);

      const subscriberEmail = event.resource.subscriber?.email_address;
      if (!subscriberEmail) throw new Error('El evento no contiene el email del suscriptor.');

      const userId = await getUserIdByEmail(supabaseAdmin, subscriberEmail);
      const storeId = await getStoreIdByUserId(supabaseAdmin, userId);
      
      const planType = PAYPAL_PLAN_MAP[planId!] || 'standard';
      const currentPeriodEnd = event.resource.billing_info?.next_billing_time;
      
      let subscriptionStatus = 'active';
      let trialEndsAt: string | null = null;

      // Lógica de prueba para TODOS los planes
      console.log(`Aplicando lógica de período de prueba de 7 días para el plan '${planType}'.`);
      subscriptionStatus = 'trialing';
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);
      trialEndsAt = trialEndDate.toISOString();
      
      const productLimit = planType === 'full' ? 60 : 30;

      // Actualizar la tienda con la fecha de fin de prueba y el límite de productos
      const { error: storeUpdateError } = await supabaseAdmin
        .from('stores')
        .update({ 
          plan_type: planType, 
          trial_ends_at: trialEndsAt,
          product_limit: productLimit
        })
        .eq('user_id', userId);

      if (storeUpdateError) throw new Error(`Error al actualizar la tienda con el fin de prueba: ${storeUpdateError.message}`);
      console.log(`Tienda del usuario ${userId} actualizada a plan '${planType}' en modo trial (límite: ${productLimit} prod), finaliza en: ${trialEndsAt}.`);

      // Registrar/Actualizar la suscripción en nuestra tabla
      await supabaseAdmin.from('subscriptions').upsert([
        {
          user_id: userId,
          store_id: storeId,
          provider: 'paypal',
          provider_subscription_id: subscriptionId,
          provider_plan_id: planId,
          status: subscriptionStatus, // 'trialing' o 'active' según la lógica
          current_period_end: currentPeriodEnd,
        }
      ], { onConflict: 'provider_subscription_id' });
      console.log(`Suscripción ${subscriptionId} registrada/actualizada como ${subscriptionStatus} para el usuario ${userId}.`);
    }
    
    // --- Procesar eventos de CANCELACIÓN ---
    else if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      console.log(`Evento BILLING.SUBSCRIPTION.CANCELLED recibido para suscripción ${subscriptionId}.`);

      const subscriberEmail = event.resource.subscriber?.email_address;
      if (!subscriberEmail) throw new Error('El evento no contiene el email del suscriptor.');
      
      const userId = await getUserIdByEmail(supabaseAdmin, subscriberEmail);

      // Actualizar el estado de la suscripción
      await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: event.resource.status_update_time })
        .eq('provider_subscription_id', subscriptionId);
      console.log(`Suscripción ${subscriptionId} marcada como CANCELLED para el usuario ${userId}.`);

      // La lógica para revocar el acceso (ej. cambiar plan_type en 'stores') debe considerar si el usuario
      // debe mantener el acceso hasta el final del período pagado/de prueba.
      // Por ahora, lo dejamos como está, el acceso se revoca al final del período.
    }
    
    // --- Procesar eventos de ACTUALIZACIÓN (Upgrade/Downgrade) ---
    else if (event.event_type === 'BILLING.SUBSCRIPTION.UPDATED') {
      console.log(`Evento BILLING.SUBSCRIPTION.UPDATED recibido para suscripción ${subscriptionId}.`);

      const subscriberEmail = event.resource.subscriber?.email_address;
      if (!subscriberEmail) throw new Error('El evento no contiene el email del suscriptor.');

      const userId = await getUserIdByEmail(supabaseAdmin, subscriberEmail);
      const newPlanId = event.resource.plan_id;
      const newPlanType = PAYPAL_PLAN_MAP[newPlanId!] || null;
      const currentPeriodEnd = event.resource.billing_info?.next_billing_time;
      
      if (!newPlanType) {
        console.warn(`El nuevo PayPal Plan ID ${newPlanId} no tiene un mapeo conocido. No se actualizará el planType de la tienda.`);
      }

      // Actualizar nuestra BD con el nuevo plan
      await supabaseAdmin
        .from('subscriptions')
        .update({
          provider_plan_id: newPlanId,
          status: event.resource.status.toLowerCase(), // ej. 'ACTIVE' -> 'active'
          current_period_end: currentPeriodEnd,
        })
        .eq('provider_subscription_id', subscriptionId);
      console.log(`Suscripción ${subscriptionId} actualizada en BD para el usuario ${userId}.`);

      // Actualizar el plan_type en la tienda para reflejar el acceso a características de inmediato
      if (newPlanType) {
        const { error: storeUpdateError } = await supabaseAdmin
          .from('stores')
          .update({ plan_type: newPlanType })
          .eq('user_id', userId);
        if (storeUpdateError) throw new Error(`Error al actualizar plan de tienda a ${newPlanType}: ${storeUpdateError.message}`);
        console.log(`Plan de tienda del usuario ${userId} actualizado a '${newPlanType}'.`);
      }
    }
    
    // --- Ignorar otros eventos ---
    else {
      console.log(`Evento recibido '${event.event_type}' para suscripción ${subscriptionId}. No se requiere acción específica.`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error fatal en el webhook de PayPal:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});