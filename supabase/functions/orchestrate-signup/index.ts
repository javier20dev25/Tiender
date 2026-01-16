// supabase/functions/orchestrate-signup/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// --- INTERFACES Y TIPOS ---
interface SignUpData {
  phone: string;
  password?: string;
}

// --- FUNCIONES AUXILIARES ---

/** Normaliza un número de teléfono a solo dígitos. */
const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
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
    const { phone, password }: SignUpData = await req.json();
    console.log('Iniciando orchestrate-signup con body:', { phone, password: password ? '[REDACTED]' : 'N/A' });
    console.log('Contraseña recibida (longitud):', password?.length);


    if (!phone || !password) {
      return new Response(JSON.stringify({ error_code: 'MISSING_PARAMS', message: 'Faltan el teléfono y la contraseña.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const normalizedPhone = normalizePhone(phone);
    await logEvent(supabaseAdmin, 'SIGNUP_ATTEMPT', { payload: { phone: normalizedPhone } });

    // 1. Verificar la identidad de WhatsApp
    let { data: identity, error: identityError } = await supabaseAdmin
      .from('whatsapp_identities')
      .select('*')
      .eq('whatsapp_number', normalizedPhone)
      .single();

    if (identityError && identityError.code !== 'PGRST116') { // 'No rows found'
      throw new Error(`Error al verificar WhatsApp: ${identityError.message}`);
    }

    if (identity) {
      if (['TRIAL_ACTIVE', 'TRIAL_EXPIRED'].includes(identity.status)) {
        await logEvent(supabaseAdmin, 'SIGNUP_FAILURE', { whatsapp_identity_id: identity.id, payload: { error: 'Phone number already exists (trial active/expired)', errorCode: 'PHONE_EXISTS' } });
        return new Response(JSON.stringify({ error_code: 'PHONE_EXISTS', message: 'User with this phone number already exists.' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }
      if (identity.status === 'BLOCKED') {
        await logEvent(supabaseAdmin, 'WHATSAPP_TRIAL_DENIED', { whatsapp_identity_id: identity.id, payload: { status: identity.status } });
        const message = 'Este número de WhatsApp se encuentra bloqueado.';
        const error_code = 'WHATSAPP_BLOCKED';
        return new Response(JSON.stringify({ error_code, message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409,
        });
      }
    } else {
      const { data: newIdentity, error: newIdError } = await supabaseAdmin
        .from('whatsapp_identities')
        .insert({ whatsapp_number: normalizedPhone, status: 'TRIAL_AVAILABLE' })
        .select()
        .single();
      if (newIdError) throw new Error(`No se pudo crear la identidad de WhatsApp: ${newIdError.message}`);
      identity = newIdentity;
    }
    await logEvent(supabaseAdmin, 'WHATSAPP_TRIAL_AVAILABLE', { whatsapp_identity_id: identity.id });

    // 2. Crear el usuario en Supabase Auth usando el teléfono
    console.log('Intentando crear usuario en Supabase Auth con:', { phone: normalizedPhone, password: '[REDACTED]' });
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: `${normalizedPhone}@tiender.app`,
      password,
      phone: normalizedPhone,
      phone_confirm: true, // Auto-confirma al usuario inmediatamente
      email_confirm: true, // ¡CRUCIAL! Auto-confirma el email falso también
    });

    console.log('Resultado de createUser:', { user: user?.id, error: userError?.message || null });

    if (userError) {
      const errorCode = userError.message.includes('already registered') ? 'PHONE_EXISTS' : 'AUTH_USER_CREATION_FAILED';
      await logEvent(supabaseAdmin, 'SIGNUP_FAILURE', { whatsapp_identity_id: identity.id, payload: { error: userError.message, errorCode } });
      return new Response(JSON.stringify({ error_code: errorCode, message: userError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 409,
      });
    }
    if (!user) throw new Error('La creación del usuario no devolvió un usuario.');
    await logEvent(supabaseAdmin, 'SIGNUP_SUCCESS', { whatsapp_identity_id: identity.id, auth_user_id: user.id });

    // 3. Asociar la identidad de WhatsApp y activar el trial.
    const { error: updateError } = await supabaseAdmin
      .from('whatsapp_identities')
      .update({
        associated_auth_user_id: user.id,
        status: 'TRIAL_ACTIVE', // El trial se activa inmediatamente.
      })
      .eq('id', identity.id);
    
    if (updateError) throw new Error(`Error al asociar la identidad: ${updateError.message}`);

    await logEvent(supabaseAdmin, 'TRIAL_ACTIVATED', { auth_user_id: user.id });

    // 4. Crear la tienda por defecto para el usuario.
    const { error: storeError } = await supabaseAdmin.from('stores').insert({
      owner_id: user.id,
      name: 'Mi Tienda', // Nombre por defecto
      phone_number: normalizedPhone,
    });

    if (storeError) {
      throw new Error(`Error al crear la tienda por defecto: ${storeError.message}`);
    }
    await logEvent(supabaseAdmin, 'STORE_CREATED', { auth_user_id: user.id });

    // Éxito: el usuario está creado y activo.
    return new Response(JSON.stringify({ success: true, user_id: user.id, message: 'Usuario creado y activado correctamente.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error en el bloque catch principal:', error.message);
    return new Response(JSON.stringify({ error_code: 'INTERNAL_SERVER_ERROR', message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
