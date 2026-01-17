// supabase/functions/log-product-event/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Define the expected request body
interface LogPayload {
  store_id: string;
  product_id?: string; // Optional for 'VISIT' events
  event_type: 'VISIT' | 'LIKE' | 'DISLIKE' | 'ADD_TO_CART';
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload: LogPayload = await req.json();
    const { store_id, product_id, event_type } = payload;

    // Basic validation
    if (!store_id || !event_type) {
      return new Response(JSON.stringify({ error: 'store_id and event_type are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (event_type !== 'VISIT' && !product_id) {
        return new Response(JSON.stringify({ error: 'product_id is required for this event type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert the event into the analytics table
    const { error } = await supabaseAdmin.from('product_analytics').insert({
      store_id,
      product_id, // This can be null for 'VISIT' events
      event_type,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, message: 'Event logged.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error logging event:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
