// supabase/functions/verify-otp-and-activate/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// --- INTERFACES Y TIPOS ---
interface VerifyOtpData {
  email: string;
  otp: string;
}

// --- FUNCIONES AUXILIARES ---

/** Registra un evento de negocio en la tabla `business_events`. */
const logEvent = async (
    supabase: SupabaseClient,
    eventType: string,
    details: { whatsapp_identity_id?: number; auth_user_id?: string; error?: string; payload?: Record<string, unknown> }
) => {
    const { whatsapp_identity_id, auth_user_id, error, payload } = details;
    // En la migración, la columna se llama 'details', no 'payload'. Ajustamos aquí.
    await supabase.from('business_events').insert({
        event_type: eventType,
        whatsapp_identity_id,
        auth_user_id,
        details: { error, ...payload },
    });
};

// --- SERVIDOR PRINCIPAL DE LA FUNCIÓN ---

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let identityId: number | undefined;
    let authUserId: string | undefined;

    try {
        const { email, otp }: VerifyOtpData = await req.json();

        if (!email || !otp) {
            return new Response(JSON.stringify({ error_code: 'MISSING_PARAMS', message: 'Email y OTP son requeridos.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // 1. Verificar el OTP con Supabase Auth
        const { data: { user }, error: otpError } = await supabaseAdmin.auth.verifyOtp({
            email,
            token: otp,
            type: 'email', // 'email' es para Magic Links, 'signup' es para OTP de registro. Asumimos 'email' genérico.
        });

        if (otpError) {
            await logEvent(supabaseAdmin, 'OTP_FAILURE', { error: otpError.message, payload: { email } });
            return new Response(JSON.stringify({ error_code: 'INVALID_OTP', message: 'OTP inválido o expirado.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }
        if (!user) {
            throw new Error('El usuario no fue encontrado después de una verificación de OTP supuestamente exitosa.');
        }
        authUserId = user.id;

        // 2. Buscar la identidad de WhatsApp asociada
        const { data: identity, error: identityError } = await supabaseAdmin
            .from('whatsapp_identities')
            .select('*')
            .eq('associated_auth_user_id', authUserId)
            .single();

        if (identityError || !identity) {
            throw new Error(`Estado inconsistente: no se encontró la identidad de WhatsApp para el usuario ${authUserId}.`);
        }
        identityId = identity.id;

        // 3. Validar el estado actual de la identidad
        if (identity.status === 'BLOCKED') {
            await logEvent(supabaseAdmin, 'TRIAL_ACTIVATION_BLOCKED', { whatsapp_identity_id: identityId, auth_user_id: authUserId });
            return new Response(JSON.stringify({ error_code: 'WHATSAPP_BLOCKED', message: 'Este número de WhatsApp se encuentra bloqueado.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 423, // Locked
            });
        }

        if (identity.status !== 'PENDING_VERIFICATION') {
             await logEvent(supabaseAdmin, 'TRIAL_ACTIVATION_ATTEMPT_ON_INVALID_STATUS', { whatsapp_identity_id: identityId, auth_user_id: authUserId, payload: { current_status: identity.status } });
            return new Response(JSON.stringify({ error_code: 'ALREADY_ACTIVE', message: 'El trial para esta cuenta ya fue activado o procesado.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 409, // Conflict
            });
        }

        // 4. Activar el Trial
        // NOTA: Para una atomicidad perfecta y evitar race conditions, esto debería estar encapsulado en una función RPC (transacción) en la base de datos.
        const trialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: updatedIdentity, error: updateError } = await supabaseAdmin
            .from('whatsapp_identities')
            .update({
                status: 'TRIAL_ACTIVE',
                trial_started_at: new Date().toISOString(),
                trial_expires_at: trialExpiresAt,
            })
            .eq('id', identityId)
            .select()
            .single();

        if (updateError) {
            throw new Error(`No se pudo activar el trial en la base de datos: ${updateError.message}`);
        }

        await logEvent(supabaseAdmin, 'TRIAL_ACTIVATED', { whatsapp_identity_id: identityId, auth_user_id: authUserId });
        
        // 5. Éxito
        return new Response(JSON.stringify({ status: 'ok', message: 'trial_activated', trial_expires_at: updatedIdentity.trial_expires_at }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        await logEvent(supabaseAdmin, 'INTERNAL_SERVER_ERROR', { whatsapp_identity_id: identityId, auth_user_id: authUserId, error: error.message });
        return new Response(JSON.stringify({ error_code: 'INTERNAL_SERVER_ERROR', message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});