import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Use the APP_URL secret, with a fallback to production URL
const APP_URL = Deno.env.get('APP_URL') || 'https://tiender.vercel.app';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const storeId = url.searchParams.get('storeId');
  console.log(`[serve-share-page] Received request for storeId: ${storeId}`);

  if (!storeId) {
    return new Response('storeId query parameter is required.', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  try {
    console.log(`[serve-share-page] Using APP_URL: ${APP_URL}`);
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch store data first to ensure it exists
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single();

    if (storeError || !storeData) {
      throw new Error(`Store not found: ${storeError?.message || ''}`);
    }
    const { name: storeName } = storeData;
    console.log(`[serve-share-page] Found store: ${storeName}`);

    // 2. Use the existing share image URL directly (no synchronous re-generation on crawl)
    const imageUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/share-images/${storeId}.png`;

    // 3. Define final, correct URLs using the APP_URL
    const pageUrl = `https://tiender.vercel.app/s/${storeId}`; 
    const storeUrl = `https://tiender.vercel.app/tienda/${storeId}`;
    console.log(`[serve-share-page] Final URLs | Page: ${pageUrl} | Store: ${storeUrl}`);

    // 4. Generate the definitive HTML with all fixes
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:title" content="¡Mira nuestro Top 5 en ${storeName}!" />
        <meta property="og:description" content="Descubre los productos más populares y haz tu pedido." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="${pageUrl}" />
        ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
        <meta property="og:image:width" content="600" />
        <meta property="og:image:height" content="1067" />
        <meta property="og:site_name" content="Tiender" />

        <!-- Twitter Card Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="¡Mira nuestro Top 5 en ${storeName}!">
        <meta name="twitter:description" content="Descubre los productos más populares y haz tu pedido.">
        ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}

        <!-- Redirect user to the actual store page -->
        <meta http-equiv="refresh" content="0; url=${storeUrl}" />
        <script>window.location.replace("${storeUrl}");</script>
        <link rel="canonical" href="${storeUrl}" />

        <title>Redirigiendo a ${storeName}...</title>
      </head>
      <body>
        <p>
          Si no eres redirigido automáticamente, 
          <a href="${storeUrl}">haz clic aquí para visitar la tienda de ${storeName}</a>.
        </p>
      </body>
      </html>
    `;

    // 5. Return the HTML response with correct headers
    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
      status: 200,
    });

  } catch (err) {
    console.error('Error serving share page:', err);
    return new Response(`Server Error: ${(err as Error).message}`, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
});

