// supabase/functions/revise-paypal-subscription/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { getAccessToken } from '../../lib/paypal/client.ts'; // Importar utilidad para token

console.log('Función "revise-paypal-subscription" iniciada.');

// --- Configuración ---
const PAYPAL_API_URL = Deno.env.get('PAYPAL_API_URL') || 'https://api-m.sandbox.paypal.com';

// --- Interfaces ---
interface ReviseSubscriptionRequestBody {
  planType: 'standard' | 'full'; // El plan deseado por el usuario
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
    // 1. Crear un cliente de Supabase para obtener el usuario autenticado y sus datos
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
    const { planType }: ReviseSubscriptionRequestBody = await req.json();
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
    console.log(`Revisando suscripción para usar PayPal Plan ID: ${PAYPAL_PLAN_ID} para el plan: ${planType}`);

    // 5. Obtener la suscripción actual del usuario desde nuestra BD
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active') // Asumimos que buscamos la suscripción activa
      .single();

    if (subError || !subscription) {
      throw new Error(`No se encontró una suscripción activa para el usuario. ${subError?.message || ''}`);
    }

    // 6. Revisar la suscripción en PayPal
    const subscriptionResponse = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscription.provider_subscription_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `REVISE-${crypto.randomUUID()}`, // Unique request ID
      },
      body: JSON.stringify([
        {
          op: 'replace',
          path: '/plan_id',
          value: PAYPAL_PLAN_ID,
        },
        // PayPal puede requerir otros campos, pero 'plan_id' es el principal para cambiar el plan.
        // Si hay cambios en billing_cycles o auto_bill_outstanding, deberían especificarse aquí.
      ]),
    });

    if (!subscriptionResponse.ok) {
        const errorDetails = await subscriptionResponse.json();
        console.error(`Error al revisar la suscripción ${subscription.provider_subscription_id} en PayPal:`, errorDetails);
        throw new Error(`No se pudo revisar la suscripción en PayPal. Detalles: ${JSON.stringify(errorDetails)}`);
    }

    // La respuesta de PATCH puede variar, pero si la llamada es exitosa, procedemos a actualizar nuestra BD.
    // Nota: PayPal puede tomar tiempo para aplicar el cambio de facturación, pero nosotros aplicaremos el cambio de features inmediatamente.

    // 7. Actualizar nuestra BD con el nuevo plan y el nuevo ID de plan de PayPal si cambia
    const { error: updateDbError } = await supabaseClient
      .from('stores')
      .update({ plan_type: planType })
      .eq('user_id', user.id);

    if (updateDbError) {
      console.error(`Error al actualizar la tienda del usuario ${user.id} a ${planType}:`, updateDbError);
      throw new Error(`Error al actualizar el plan en nuestra base de datos: ${updateDbError.message}`);
    }

    // Si el plan de PayPal tiene un ID diferente o necesitamos registrar el cambio en la tabla 'subscriptions'
    // (Ej: si el plan de PayPal cambia su ID, o si queremos historizar los cambios)
    // En este ejemplo, actualizamos el plan_id en 'subscriptions' para reflejar el nuevo plan de PayPal
    const { error: updateSubError } = await supabaseClient
      .from('subscriptions')
      .update({
        provider_plan_id: PAYPAL_PLAN_ID, // Actualizar al nuevo plan ID de PayPal
        plan_type: planType, // Actualizar nuestro planType interno también
        // NOTA: El 'current_period_end' o 'next_billing_at' debería ser gestionado por PayPal y
        // eventualmente actualizado via webhook (BILLING.SUBSCRIPTION.UPDATED),
        // pero aquí aplicamos el cambio de features inmediatamente.
      })
      .eq('user_id', user.id)
      .eq('provider_subscription_id', subscription.provider_subscription_id);

    if (updateSubError) {
        console.error(`Error al actualizar la suscripción ${subscription.provider_subscription_id} en nuestra BD:`, updateSubError);
        // Considerar si esto es un error crítico o si solo registramos el log
    }
    
    console.log(`Suscripción ${subscription.provider_subscription_id} para el usuario ${user.id} actualizada al plan ${planType}.`);

    return new Response(JSON.stringify({ success: true, message: `Suscripción actualizada a ${planType}.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error fatal en revise-paypal-subscription:', (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
