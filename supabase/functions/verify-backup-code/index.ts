import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { compare } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts'; // For comparing hashes
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, code } = await req.json();
    if (!userId || !code) {
      throw new Error('userId and code are required.');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch user's hashed backup codes from metadata
    const { data: userData, error: fetchUserError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (fetchUserError || !userData?.user) {
      throw new Error(`User not found or error fetching user: ${fetchUserError?.message || ''}`);
    }

    const hashedCodes: string[] | undefined = userData.user.user_metadata?.backup_codes;

    if (!hashedCodes || hashedCodes.length === 0) {
      throw new Error('No backup codes found for this user.');
    }

    // 2. Compare the provided code against the stored hashes
    let codeIsValid = false;
    const updatedHashedCodes = [...hashedCodes]; // Copy array to modify

    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await compare(code, hashedCodes[i]);
      if (isMatch) {
        codeIsValid = true;
        // Remove the used code's hash from the array
        updatedHashedCodes.splice(i, 1);
        break; // Found a match, no need to check further
      }
    }

    if (!codeIsValid) {
      throw new Error('Invalid recovery code.');
    }

    // 3. Update user metadata to remove the used code
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          backup_codes: updatedHashedCodes,
          // Optionally update a timestamp for code usage
        }
      }
    );

    if (updateUserError) {
      throw new Error(`Failed to update user metadata after code usage: ${updateUserError.message}`);
    }

    // 4. Return a success signal. The frontend will then trigger the password reset flow.
    // A more advanced flow could involve generating a temporary auth token here.
    return new Response(JSON.stringify({ success: true, message: 'Recovery code verified. Proceed to reset password.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error verifying backup code:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});