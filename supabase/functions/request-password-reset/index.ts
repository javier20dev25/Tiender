// supabase/functions/request-password-reset/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { phone } = await req.json();
    const normalizedPhone = phone.replace(/\D/g, '');

    // 1. Find user by phone in auth.users (via identity or metadata)
    // In our system, the email is phone@tiender.app
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    const user = users.find(u => u.email === `${normalizedPhone}@tiender.app` || u.phone === normalizedPhone);

    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'No se encontró ninguna cuenta asociada a este número.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const recoveryEmail = user.user_metadata?.recovery_email;

    if (!recoveryEmail) {
      return new Response(JSON.stringify({ success: false, message: 'Esta cuenta no tiene un correo de recuperación configurado. Contacta a soporte.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    // 3. Store OTP in user_metadata temporarily (or a dedicated table)
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        recovery_otp: otp,
        recovery_otp_expires_at: expiresAt
      }
    });

    // 4. Send Email (Mocking for now as per user request to "configure as much as possible")
    // If you have Resend or SendGrid, add it here. 
    // For now, we log it and return success.
    console.log(`[RECOVERY] OTP for ${recoveryEmail}: ${otp}`);

    // Mask email for security: j***@gmail.com
    const [name, domain] = recoveryEmail.split('@');
    const maskedEmail = `${name[0]}***@${domain}`;

    return new Response(JSON.stringify({ 
      success: true, 
      masked_email: maskedEmail,
      message: 'Código enviado.' 
    }), {
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
