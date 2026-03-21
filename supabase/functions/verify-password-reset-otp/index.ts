// supabase/functions/verify-password-reset-otp/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { phone, otp, newPassword } = await req.json();
    const normalizedPhone = phone.replace(/\D/g, '');

    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const user = users.find(u => u.email === `${normalizedPhone}@tiender.app` || u.phone === normalizedPhone);

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Usuario no encontrado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const storedOtp = user.user_metadata?.recovery_otp;
    const expiresAt = user.user_metadata?.recovery_otp_expires_at;

    if (!storedOtp || storedOtp !== otp) {
      return new Response(JSON.stringify({ success: false, message: 'Código incorrecto.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (new Date() > new Date(expiresAt)) {
      return new Response(JSON.stringify({ success: false, message: 'El código ha expirado.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Step 2: Reset Password (if newPassword provided)
    if (newPassword) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: newPassword,
        user_metadata: {
          ...user.user_metadata,
          recovery_otp: null, // Clear OTP after use
          recovery_otp_expires_at: null
        }
      });
      if (updateError) throw updateError;
    }

    return new Response(JSON.stringify({ success: true, message: 'Acción completada con éxito.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
