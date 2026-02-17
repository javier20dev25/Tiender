// supabase/functions/record-verified-event/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verify } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') || 'your-super-secret-jwt-token-with-at-least-32-characters-long';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract and verify the visit_token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Token de visita faltante o malformado.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const visitToken = authHeader.split(' ')[1];

    let payload;
    try {
      payload = await verify(visitToken, JWT_SECRET, 'HS256');
    } catch (_e) {
      return new Response(JSON.stringify({ error: 'Token de visita inválido o expirado.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload || !payload.store_id) {
      throw new Error('El payload del token es inválido.');
    }

    // 2. Get event details from the request body
    const { event_type, product_id } = await req.json();
    if (!event_type) {
      return new Response(JSON.stringify({ error: 'event_type es requerido.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Insert the validated event into the analytics table
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const eventToInsert: { store_id: string, event_type: string, product_id?: string } = {
      store_id: payload.store_id as string,
      event_type: event_type,
    };

    if (product_id) {
      eventToInsert.product_id = product_id;
    }

    const { error: insertError } = await supabaseAdmin
      .from('product_analytics')
      .insert(eventToInsert);

    if (insertError) {
      console.error('Error al insertar el evento de analítica:', insertError);
      throw new Error('No se pudo registrar el evento.');
    }

    // 4. Optionally, update the visit status to 'token_used'
    // This can prevent the same token from being used for multiple initial page loads
    // For now, we allow multiple events per token until it expires.

    return new Response(JSON.stringify({ success: true, message: `Evento '${event_type}' registrado.` }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fatal en record-verified-event:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
