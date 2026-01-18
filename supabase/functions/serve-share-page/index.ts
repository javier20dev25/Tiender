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

    // 3. Ensure share image exists, generating it if necessary.
    let imageUrl = '';
    try {
      // Check if the file exists by trying to get its public URL.
      // A more robust way could be to list files, but this is often sufficient.
      const potentialImageUrl = supabaseAdmin.storage.from('share-images').getPublicUrl(`${storeId}.png`).data.publicUrl;

      // A simple HEAD request can verify existence without downloading the file.
      const headResponse = await fetch(potentialImageUrl, { method: 'HEAD' });

      if (headResponse.ok) {
        imageUrl = potentialImageUrl;
      } else {
        // If not found (or other error), generate it.
        throw new Error("Image not found, generating...");
      }
    } catch (e) {
      // This block runs if the fetch fails (e.g., 404) or if we throw the error.
      console.log("Generating new share image for store:", storeId);
      const { data: generated, error: generationError } = await supabaseAdmin.functions.invoke('generate-share-image', {
        body: { storeId },
      });

      if (generationError) {
        console.error("Failed to generate image on the fly:", generationError);
        // Proceed without an image, or handle error differently
      } else {
        imageUrl = generated.imageUrl;
      }
    }
    
    // Add a cache-busting query param to the image URL
    if (imageUrl) {
      imageUrl = `${imageUrl}?t=${new Date().getTime()}`;
    }

    // 4. Define URLs
    const pageUrl = `${url.origin}${url.pathname}?storeId=${storeId}`;
    const redirectUrl = `${APP_URL}/tienda/${storeId}`;

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
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});