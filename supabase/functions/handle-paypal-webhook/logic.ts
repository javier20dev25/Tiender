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
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: event.resource.status_update_time })
      .eq('provider_subscription_id', subscriptionId);
    if (error) throw error;
  } else if (event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      console.log(`Procesando SUSPENDED para subscripción ${subscriptionId}`);
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'suspended' })
        .eq('provider_subscription_id', subscriptionId);
      if (error) throw error;
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
