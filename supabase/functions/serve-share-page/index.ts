import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:5173';

// --- Main Function ---
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const storeId = url.searchParams.get('storeId');

  if (!storeId) {
    return new Response('storeId query parameter is required.', { status: 400 });
  }

  try {
    // 1. Create Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Fetch store data
    const { data: storeData, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single();

    if (storeError) throw new Error(`Failed to fetch store: ${storeError.message}`);
    if (!storeData) throw new Error('Store not found.');

    const { name: storeName } = storeData;
    
    // 3. Construct the image URL from storage
    const { data: imageUrlData } = supabaseAdmin.storage
      .from('share-images')
      .getPublicUrl(`${storeId}.png`);

    const imageUrl = imageUrlData?.publicUrl;
    if (!imageUrl) {
      // Fallback or error if image doesn't exist yet
      // For now, we'll proceed without an image, but in a real scenario,
      // you might want to trigger the generation here or show a default image.
      console.warn(`Share image for store ${storeId} not found.`);
    }

    // 4. Define URLs
    const pageUrl = `${url.origin}${url.pathname}?storeId=${storeId}`;
    const redirectUrl = `${APP_URL}/tienda/${storeId}`; // Assuming a route like /tienda/:storeId for the social store

    // 5. Generate HTML with Open Graph tags and redirect
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

        <!-- Twitter Card Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="¡Mira nuestro Top 5 en ${storeName}!">
        <meta name="twitter:description" content="Descubre los productos más populares y haz tu pedido.">
        ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ''}

        <!-- Redirect user to the actual store page -->
        <meta http-equiv="refresh" content="0; url=${redirectUrl}" />
        <link rel="canonical" href="${redirectUrl}" />

        <title>Redirigiendo a ${storeName}...</title>
      </head>
      <body>
        <p>
          Si no eres redirigido automáticamente, 
          <a href="${redirectUrl}">haz clic aquí para visitar la tienda de ${storeName}</a>.
        </p>
      </body>
      </html>
    `;

    // 6. Return the HTML response
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // Ensure fresh data
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      status: 200,
    });

  } catch (err) {
    console.error('Error serving share page:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});