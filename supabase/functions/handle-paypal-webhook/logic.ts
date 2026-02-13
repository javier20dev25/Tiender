// supabase/functions/handle-paypal-webhook/logic.ts
import type { SupabaseClient } from '@supabase/supabase-js';

// --- Types, Enums, and Mappers ---
// Define our strict subscription status ENUM, mirroring the database
type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled';

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    status: string; // e.g., 'ACTIVE', 'CANCELLED'
    status_update_time?: string;
    plan_id?: string;
    subscriber?: { email_address?: string; };
    billing_info?: { next_billing_time?: string; };
  };
}

export type PlanMap = { [key: string]: 'standard' | 'full' };

/**
 * Safely maps PayPal's subscription status strings to our internal ENUM.
 * @param paypalStatus The status string from PayPal's webhook resource (e.g., "ACTIVE").
 * @returns Our corresponding SubscriptionStatus ENUM value, or null if unhandled.
 */
function mapPayPalStatusToEnum(paypalStatus: string): SubscriptionStatus | null {
  const status = paypalStatus.toLowerCase();
  switch (status) {
    case 'active':
      return 'active';
    case 'suspended':
      return 'past_due'; // PayPal's 'suspended' maps to our 'past_due'
    case 'cancelled':
      return 'canceled';
    default:
      return null; // Ignore other statuses like 'inactive', 'approval_pending'
  }
}

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
  const eventStatus = mapPayPalStatusToEnum(event.resource.status);

  if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    console.log(`Procesando CANCELLED para subscripción ${subscriptionId}`);

    const { data: currentSub, error: selectError } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('provider_subscription_id', subscriptionId)
      .single();
      
    if (selectError) throw selectError;

    if (currentSub?.status !== 'canceled') {
        const { error } = await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' }) // Use our strict ENUM value
          .eq('provider_subscription_id', subscriptionId);
        if (error) throw error;
    } else {
        console.log(`Idempotency check: La subscripción ${subscriptionId} ya está cancelada. No se necesita acción.`);
    }

  } else if (event.event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      console.log(`Procesando SUSPENDED para subscripción ${subscriptionId}`);
      // Map 'suspended' to our internal 'past_due' state
      const { error } = await supabaseAdmin
        .from('subscriptions')
        .update({ status: 'past_due' })
        .eq('provider_subscription_id', subscriptionId);
      if (error) throw error;

  } else if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
    console.log(`Procesando ACTIVATED para subscripción ${subscriptionId}`);
    const planType = planMap[planId!] || null;
    if (!planType) {
      throw new Error(`Plan ID ${planId} no encontrado en el plan map.`);
    }

    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        provider_subscription_id: subscriptionId,
        user_id: userId,
        status: 'active', // Use our strict ENUM value
        provider_plan_id: planId,
        current_period_end: event.resource.billing_info?.next_billing_time,
      }, { onConflict: 'provider_subscription_id' });

    if (subError) throw subError;

    const { error: storeError } = await supabaseAdmin
      .from('stores')
      .update({ plan_type: planType, trial_ends_at: null })
      .eq('user_id', userId);

    if (storeError) throw storeError;

  } else if (event.event_type === 'BILLING.SUBSCRIPTION.UPDATED') {
    console.log(`Procesando UPDATED para subscripción ${subscriptionId}`);
    
    // Only update the status if we have a valid mapping
    if (eventStatus) {
      const newPlanType = planMap[planId!] || null;
      
      const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          provider_plan_id: planId,
          status: eventStatus, // Use the safely mapped status
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
    } else {
      console.log(`Ignorando actualización de estado para estado de PayPal no manejado: ${event.resource.status}`);
    }
  }
}
