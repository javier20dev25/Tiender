import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hash } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Helper to generate a random code (8 alphanumeric chars)
const generateCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      throw new Error('userId is required.');
    }

    // Use the Service Role Key to create an admin client
    // This is necessary to update user metadata
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Generate 8 unique plaintext codes
    const plainTextCodes = Array.from({ length: 8 }, generateCode);

    // 2. Hash each code for secure storage
    const hashedCodes = await Promise.all(
      plainTextCodes.map(code => hash(code))
    );

    // 3. Store the HASHED codes in the user's metadata
    // The auth.admin client is required for this.
    const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          backup_codes: hashedCodes,
          backup_codes_generated_at: new Date().toISOString(),
        }
      }
    );

    if (updateUserError) {
      throw new Error(`Failed to update user metadata: ${updateUserError.message}`);
    }

    // 4. Return the PLAINTEXT codes to the frontend for one-time download
    return new Response(JSON.stringify({ plain_codes: plainTextCodes }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error generating backup codes:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
