// supabase/functions/visit-gate/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts';

// --- Constants ---
const VERIFICATION_THRESHOLD = 50; // Minimum score to be considered 'verified'
const SOCIAL_REFERERS = ['facebook.com', 'instagram.com', 't.co', 'wa.me', 'tiktok.com'];
const BOT_KEYWORDS = ['bot', 'spider', 'crawler', 'headless'];
const JWT_SECRET = Deno.env.get('SUPABASE_JWT_SECRET') || 'your-super-secret-jwt-token-with-at-least-32-characters-long';


// --- Helper Functions ---
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function calculateTrustScore(
  signals: { referer: string, userAgent: string, ipHash: string },
  supabase: SupabaseClient
): Promise<number> {
  let score = 0;

  // 1. Referer check
  if (SOCIAL_REFERERS.some(r => signals.referer.includes(r))) {
    score += 35;
  }

  // 2. User-Agent check
  if (signals.userAgent && !BOT_KEYWORDS.some(b => signals.userAgent.toLowerCase().includes(b))) {
    score += 25;
  } else {
    score -= 20; // Penalize missing or bot-like user agents
  }

  // 3. Rate limiting check (DB query)
  const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
  const { count, error } = await supabase
    .from('visits')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', signals.ipHash)
    .gte('created_at', oneMinuteAgo);

  if (error) {
    console.error('Error checking rate limit:', error);
  } else if (count && count > 25) { // More than 25 requests in a minute from the same IP
    score -= 50;
  }

  return score;
}


// --- Main Server Logic ---
serve(async (req, connInfo) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { store_id } = await req.json();
    if (!store_id) {
      return new Response(JSON.stringify({ error: 'store_id es requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 0. Resolve store_id if it's a slug
    let resolvedStoreId = store_id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(store_id)) {
      console.log(`Resolving slug: ${store_id}`);
      const { data: store, error: slugError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('slug', store_id)
        .single();
      
      if (slugError || !store) {
        console.error('Slug resolution failed:', slugError?.message);
        return new Response(JSON.stringify({ error: 'Tienda no encontrada' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      resolvedStoreId = store.id;
    }

    // 1. Collect signals
    const userAgent = req.headers.get('user-agent') || '';
    const referer = req.headers.get('referer') || '';
    const ip = (connInfo.remoteAddr as Deno.NetAddr).hostname;
    const ipHash = await sha256(ip);

    // 2. Calculate Trust Score
    const trustScore = await calculateTrustScore({ referer, userAgent, ipHash }, supabaseAdmin);

    // 3. Determine status and prepare for DB update
    const isVerified = trustScore >= VERIFICATION_THRESHOLD;
    const status = isVerified ? 'verified' : 'bot_suspected';
    let visitToken = null;
    const expiresAt = new Date(Date.now() + 30 * 60000); // Token expires in 30 minutes

    // 4. If verified, generate JWT
    if (isVerified) {
      visitToken = await create(
        { alg: 'HS256', typ: 'JWT' },
        {
          store_id: resolvedStoreId,
          trust_score: trustScore,
          exp: getNumericDate(expiresAt),
        },
        JWT_SECRET
      );
    }

    // 5. Insert the complete visit record
    const { data: visit, error: insertError } = await supabaseAdmin
      .from('visits')
      .insert({
        store_id: resolvedStoreId,
        ip_hash: ipHash,
        user_agent: userAgent,
        referer: referer,
        trust_score: trustScore,
        status: status,
        visit_token: visitToken,
        expires_at: expiresAt.toISOString(),
      })
      .select('id, status')
      .single();

    if (insertError) {
      console.error('Error al insertar la visita:', insertError);
      throw new Error('No se pudo registrar la visita.');
    }

    // 6. Return the token if verified, otherwise reject
    if (isVerified) {
      return new Response(JSON.stringify({ visit_token: visitToken, status: visit.status }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Tráfico sospechoso detectado', status: visit.status }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error fatal en visit-gate:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
