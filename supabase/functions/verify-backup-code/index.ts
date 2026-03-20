import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, code, newPassword } = await req.json();
    if (!phone || !code) {
      throw new Error('phone and code are required.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Look up user by phone (shadow email pattern: <digits>@tiender.app)
    const normalizedPhone = phone.replace(/\D/g, '');
    const shadowEmail = `${normalizedPhone}@tiender.app`;

    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw new Error(`Error looking up users: ${listError.message}`);

    const targetUser = usersData.users.find(u => u.email === shadowEmail);
    if (!targetUser) {
      throw new Error('No se encontró una cuenta asociada a este número.');
    }

    // 2. Fetch user's hashed backup codes from metadata
    const hashedCodes: string[] | undefined = targetUser.user_metadata?.backup_codes;

    if (!hashedCodes || hashedCodes.length === 0) {
      throw new Error('No hay códigos de recuperación para esta cuenta.');
    }

    // 3. Compare the provided code against the stored hashes
    let codeIsValid = false;
    const updatedHashedCodes = [...hashedCodes];

    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await compare(code, hashedCodes[i]);
      if (isMatch) {
        codeIsValid = true;
        updatedHashedCodes.splice(i, 1);
        break;
      }
    }

    if (!codeIsValid) {
      throw new Error('Código de recuperación inválido o ya utilizado.');
    }

    // 4. Build update payload: always remove used code, optionally reset password
    const updatePayload: Record<string, unknown> = {
      user_metadata: {
        backup_codes: updatedHashedCodes,
      }
    };

    if (newPassword) {
      if (newPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres.');
      }
      updatePayload.password = newPassword;
    }

    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      updatePayload
    );

    if (updateUserError) {
      throw new Error(`Error al actualizar la cuenta: ${updateUserError.message}`);
    }

    const message = newPassword
      ? 'Contraseña restablecida correctamente.'
      : 'Código verificado. Procede a restablecer tu contraseña.';

    return new Response(JSON.stringify({ success: true, message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error verifying backup code:', err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});