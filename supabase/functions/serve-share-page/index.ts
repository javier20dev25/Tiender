import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Use the APP_URL secret, with a fallback for local dev
const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const storeId = url.searchParams.get('storeId');

  if (!storeId) {
    return new Response('storeId query parameter is required.', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  try {
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

    // 2. Invoke the image generation function to ensure the image is fresh and get its URL
    // This simplifies the logic and guarantees we have the URL before proceeding.
    const { data: generatedImageData, error: generationError } = await supabaseAdmin.functions.invoke('generate-share-image', {
      body: { storeId },
    });

    if (generationError || !generatedImageData.imageUrl) {
      // Log the error but proceed to generate HTML without an image, so the redirect still works
      console.error('Critical error: Could not generate or retrieve share image.', generationError);
    }
    
    // The public URL of the generated image
    let imageUrl = generatedImageData.imageUrl;
    
    // Add a cache-busting query param to ensure the latest image is shown
    if (imageUrl) {
      imageUrl = `${imageUrl}?t=${new Date().getTime()}`;
    }

    // 3. Define final, correct URLs using the APP_URL
    const pageUrl = `${APP_URL}/s/${storeId}`; // The clean, rewritten URL
    const storeUrl = `${APP_URL}/tienda/${storeId}`; // The final destination

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
