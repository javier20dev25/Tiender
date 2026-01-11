// supabase/functions/verify-otp-and-activate/index.ts


import { corsHeaders } from '../_shared/cors.ts';

// --- INTERFACES Y TIPOS ---
interface VerifyOtpData {
  email: string;
  otp: string;
}

// --- FUNCIONES AUXILIARES ---

/*
/** Registra un evento de negocio en la tabla `business_events`. * /
const logEvent = async (
    supabase: SupabaseClient,
    eventType: string,
    details: { whatsapp_identity_id?: number; auth_user_id?: string; payload?: Record<string, unknown> }
) => {
    // ... (la misma función de logEvent que en orchestrate-signup)
    const { whatsapp_identity_id, auth_user_id, payload } = details;
    await supabase.from('business_events').insert({
        event_type: eventType,
        whatsapp_identity_id,
        auth_user_id,
        payload,
    });
};
*/


// --- SERVIDOR PRINCIPAL DE LA FUNCIÓN ---

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    /* const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    ); */

    try {
        const { email, otp }: VerifyOtpData = await req.json();

        if (!email || !otp) {
            return new Response(JSON.stringify({ error_code: 'MISSING_PARAMS', message: 'Faltan email y OTP.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        // --- LÓGICA DE NEGOCIO PRINCIPAL ---

        // TODO: 1. Verificar el OTP con Supabase Auth.
        // - Llamar a `supabaseAdmin.auth.verifyOtp` con el email y el token.
        // - Si falla, registrar `OTP_FAILURE` y devolver un error.
        
        // TODO: 2. Obtener el `auth_user_id` del usuario verificado.
        // - La respuesta exitosa de `verifyOtp` contiene la sesión y el usuario.

        // TODO: 3. Buscar la `whatsapp_identity` asociada.
        // - Consultar `whatsapp_identities` usando el `auth_user_id`.
        // - Si no se encuentra, es un estado inconsistente -> registrar error.

        // TODO: 4. Activar el Trial.
        // - Si la identidad está en `PENDING_VERIFICATION`, actualizarla:
        //   - `status` a `TRIAL_ACTIVE`.
        //   - `trial_started_at` a `NOW()`.
        //   - `trial_expires_at` a `NOW() + interval '7 days'`.
        // - Registrar el evento `TRIAL_ACTIVATED`.

        // Respuesta temporal mientras implementamos la lógica.
        const responseData = {
            message: 'Función verify-otp-and-activate iniciada. Lógica pendiente.',
        };

        return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        // En caso de un error inesperado.
        return new Response(JSON.stringify({ error_code: 'INTERNAL_SERVER_ERROR', message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
