// supabase/functions/handle-paypal-webhook/logic.ts
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Interfaces, Maps, y Helpers ---
export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string;
    status_update_time?: string;
    plan_id?: string;
    subscriber?: { email_address?: string; };
    billing_info?: { next_billing_time?: string; };
  };
}

export type PlanMap = { [key: string]: 'standard' | 'full' };

async function getUserIdByEmail(supabase: SupabaseClient, email: string): Promise<string> {
    const { data: userId, error } = await supabase.rpc('get_user_id_by_email', { user_email: email });
    if (error || !userId) throw new Error(`Usuario no encontrado para el email ${email}: ${error?.message}`);
    return userId;
}

// --- Lógica Principal Exportable para Testing ---
export async function processWebhookEvent(
  event: PayPalWebhookEvent,
  supabaseAdmin: SupabaseClient,
  planMap: PlanMap
) {
  const subscriptionId = event.resource.id;
  const planId = event.resource.plan_id;
  const subscriberEmail = event.resource.subscriber?.email_address;

  if (!subscriberEmail) {
    throw new Error('El evento no contiene el email del suscriptor.');
  }

  const userId = await getUserIdByEmail(supabaseAdmin, subscriberEmail);

  if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    console.log(`Procesando CANCELLED para subscripción ${subscriptionId}`);

    // IDEMPOTENCY CHECK
    const { data: currentSub, error: selectError } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('provider_subscription_id', subscriptionId)
      .single();
      
    if (selectError) throw selectError;

    // Only update if the status is not already 'cancelled'
    if (currentSub?.status !== 'cancelled') {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'cancelled', cancelled_at: event.resource.status_update_time })
          .eq('provider_subscription_id', subscriptionId);
        if (error) throw error;
    } else {
        console.log(`Idempotency check: La subscripción ${subscriptionId} ya está cancelada. No se necesita acción.`);
    }
  } else if (event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      console.log(`Procesando SUSPENDED para subscripción ${subscriptionId}`);
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'suspended' })
        .eq('provider_subscription_id', subscriptionId);
      if (error) throw error;
  } else if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    // Evento: La suscripción ha sido activada por el usuario.
    // Acción: Crear el registro de la suscripción, marcarla como 'active' y 
    //         actualizar la tienda del usuario para concederle acceso a las funciones pagas.
    console.log(`Procesando ACTIVATED para subscripción ${subscriptionId}`);
    const planType = planMap[planId!] || null;
    if (!planType) {
      throw new Error(`Plan ID ${planId} no encontrado en el plan map.`);
    }

    // 1. Usamos 'upsert' en la tabla 'subscriptions' para crear o actualizar el registro.
    // Esto previene duplicados si el webhook se recibe más de una vez (idempotencia).
    // El 'provider_subscription_id' de PayPal es nuestro identificador único.
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        provider_subscription_id: subscriptionId,
        user_id: userId,
        status: 'active',
        provider_plan_id: planId,
        current_period_end: event.resource.billing_info?.next_billing_time,
      }, { onConflict: 'provider_subscription_id' });

    if (subError) throw subError;

    // 2. Actualizamos la tabla 'stores' para reflejar el plan activo del usuario.
    // Esto finaliza el período de prueba (si lo hubiera) y asigna el tipo de plan correcto.
    const { error: storeError } = await supabaseAdmin
      .from('stores')
      .update({ plan_type: planType, trial_ends_at: null })
      .eq('user_id', userId);

    if (storeError) throw storeError;

  } else if (event.event_type === 'BILLING.SUBSCRIPTION.UPDATED') {
    console.log(`Procesando UPDATED para subscripción ${subscriptionId}`);
    const newPlanType = planMap[planId!] || null;
    
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        provider_plan_id: planId,
        status: event.resource.status.toLowerCase(),
        current_period_end: event.resource.billing_info?.next_billing_time,
      })
      .eq('provider_subscription_id', subscriptionId);
    if (subError) throw subError;

    if (newPlanType) {
      const { error: storeError } = await supabaseAdmin
        .from('stores')
        .update({ plan_type: newPlanType })
        .eq('user_id', userId);
      if (storeError) throw storeError;
    }
  }
}
