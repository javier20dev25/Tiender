// supabase/functions/orchestrate-signup/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// --- INTERFACES Y TIPOS ---
interface SignUpData {
  email: string;
  password?: string;
  whatsapp: string;
}

// --- FUNCIONES AUXILIARES ---

/** Normaliza un número de WhatsApp a solo dígitos. */
const normalizeWhatsApp = (whatsapp: string): string => {
  return whatsapp.replace(/\D/g, '');
};

/** Registra un evento de negocio en la tabla `business_events`. */
const logEvent = async (
  supabase: SupabaseClient,
  eventType: string,
  details: { whatsapp_identity_id?: number; auth_user_id?: string; payload?: Record<string, unknown> }
) => {
  const { whatsapp_identity_id, auth_user_id, payload } = details;
  await supabase.from('business_events').insert({
    event_type: eventType,
    whatsapp_identity_id,
    auth_user_id,
    payload,
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

  try {
    const { email, password, whatsapp }: SignUpData = await req.json();

    if (!email || !password || !whatsapp) {
      return new Response(JSON.stringify({ error_code: 'MISSING_PARAMS', message: 'Faltan datos requeridos.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const normalizedWhatsApp = normalizeWhatsApp(whatsapp);
    await logEvent(supabaseAdmin, 'SIGNUP_ATTEMPT', { payload: { email, whatsapp: normalizedWhatsApp } });

    // 1. Verificar la identidad de WhatsApp
    const { data: identity, error: identityError } = await supabaseAdmin
      .from('whatsapp_identities')
      .select('*')
      .eq('whatsapp_number', normalizedWhatsApp)
      .single();

    if (identityError && identityError.code !== 'PGRST116') { // 'No rows found'
      throw new Error(`Error al verificar WhatsApp: ${identityError.message}`);
    }

    if (identity) {
      if (['TRIAL_ACTIVE', 'TRIAL_EXPIRED', 'BLOCKED'].includes(identity.status)) {
        await logEvent(supabaseAdmin, 'WHATSAPP_TRIAL_DENIED', { whatsapp_identity_id: identity.id, payload: { status: identity.status } });
        const message = identity.status === 'BLOCKED' ? 'Este número de WhatsApp se encuentra bloqueado.' : 'Este número de WhatsApp ya ha utilizado su período de prueba.';
        const error_code = identity.status === 'BLOCKED' ? 'WHATSAPP_BLOCKED' : 'WHATSAPP_IN_USE';
        return new Response(JSON.stringify({ error_code, message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }
    } else {
      const { data: newIdentity, error: newIdError } = await supabaseAdmin
        .from('whatsapp_identities')
        .insert({ whatsapp_number: normalizedWhatsApp, status: 'TRIAL_AVAILABLE' })
        .select()
        .single();
      if (newIdError) throw new Error(`No se pudo crear la identidad de WhatsApp: ${newIdError.message}`);
      identity = newIdentity;
    }
    await logEvent(supabaseAdmin, 'WHATSAPP_TRIAL_AVAILABLE', { whatsapp_identity_id: identity.id });

    // 2. Crear el usuario en Supabase Auth
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Requerimos confirmación de correo (OTP).
    });

    if (userError) {
      const errorCode = userError.message.includes('already registered') ? 'EMAIL_EXISTS' : 'AUTH_USER_CREATION_FAILED';
      await logEvent(supabaseAdmin, 'SIGNUP_FAILURE', { whatsapp_identity_id: identity.id, payload: { error: userError.message, errorCode } });
      return new Response(JSON.stringify({ error_code: errorCode, message: userError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }
    if (!user) throw new Error('La creación del usuario no devolvió un usuario.');
    await logEvent(supabaseAdmin, 'SIGNUP_SUCCESS', { whatsapp_identity_id: identity.id, auth_user_id: user.id });

    // 3. Asociar la identidad de WhatsApp con el nuevo usuario de Auth.
    const { error: updateError } = await supabaseAdmin
      .from('whatsapp_identities')
      .update({
        associated_auth_user_id: user.id,
        status: 'PENDING_VERIFICATION', // El trial no se activa hasta la verificación del OTP.
      })
      .eq('id', identity.id);
    
    if (updateError) throw new Error(`Error al asociar la identidad: ${updateError.message}`);

    // 4. Se asume que Supabase enviará el OTP automáticamente por la configuración de `email_confirm: true`.
    await logEvent(supabaseAdmin, 'OTP_SENT', { auth_user_id: user.id });

    // Éxito: el frontend puede proceder a la página de OTP.
    return new Response(JSON.stringify({ success: true, message: 'Usuario creado. Por favor, verifica tu correo.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    await logEvent(supabaseAdmin, 'SIGNUP_FAILURE', { payload: { error: error.message, source: 'CATCH_ALL' } });
    return new Response(JSON.stringify({ error_code: 'INTERNAL_SERVER_ERROR', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
