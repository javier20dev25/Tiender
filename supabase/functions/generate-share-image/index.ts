import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import satori from 'https://esm.sh/satori@0.10.9';
import { Resvg } from 'https://esm.sh/@resvg/resvg-js@2.6.0';
import { corsHeaders } from '../_shared/cors.ts';

// Define the expected request body
interface ShareImagePayload {
  storeId: string;
}

// --- Main Function ---
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { storeId }: ShareImagePayload = await req.json();
    if (!storeId) {
      throw new Error('storeId is required.');
    }

    // 1. Create Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Fetch all data in parallel
    const [
      { data: storeData, error: storeError },
      { data: analyticsData, error: analyticsError },
      fontData,
    ] = await Promise.all([
      supabaseAdmin.from('stores').select('name, logo_url').eq('id', storeId).single(),
      supabaseAdmin.rpc('get_store_analytics', { target_store_id: storeId }),
      fetch('https://fonts.gstatic.com/s/inter/v12/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2').then((res) => res.arrayBuffer()),
    ]);
    
    if (storeError) throw new Error(`Failed to fetch store: ${storeError.message}`);
    if (analyticsError) throw new Error(`Failed to fetch analytics: ${analyticsError.message}`);
    if (!storeData) throw new Error('Store not found.');
    if (!analyticsData?.top_products) throw new Error('Analytics data not available.');

    const { name: storeName, logo_url: logoUrl } = storeData;
    const { top_products: topProducts } = analyticsData;

    // 3. Design the shareable image using Satori (HTML/CSS-in-JS)
    const template = {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          backgroundColor: '#1F2937', // bg-gray-800
          color: 'white',
          padding: '40px',
          alignItems: 'center',
          fontFamily: '"Inter"',
        },
        children: [
          logoUrl ? {
            type: 'img',
            props: {
              src: logoUrl,
              style: {
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '4px solid white',
                marginBottom: '20px',
              },
            },
          } : null,
          {
            type: 'h1',
            props: {
              style: {
                fontSize: '48px',
                fontWeight: 'bold',
                marginBottom: '10px',
              },
              children: storeName,
            },
          },
          {
            type: 'h2',
            props: {
              style: {
                fontSize: '32px',
                fontWeight: '600',
                marginBottom: '40px',
                color: '#9CA3AF', // text-gray-400
              },
              children: 'Nuestro Top 5 Productos',
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '15px',
              },
              children: topProducts.slice(0, 5).map((product, index) => ({
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    backgroundColor: '#374151', // bg-gray-700
                    borderRadius: '15px',
                    padding: '15px',
                  },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: '30px',
                          fontWeight: 'bold',
                          color: '#60A5FA', // text-blue-400
                          width: '50px',
                        },
                        children: `#${index + 1}`,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          flexGrow: 1,
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: '24px',
                                fontWeight: '600',
                              },
                              children: product.title,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        },
                        children: [
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: '28px',
                                fontWeight: 'bold',
                                color: '#34D399', // text-green-400
                              },
                              children: product.score,
                            },
                          },
                          {
                            type: 'div',
                            props: {
                              style: {
                                fontSize: '16px',
                                color: '#9CA3AF',
                              },
                              children: 'Puntos',
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              })),
            },
          },
           {
            type: 'div',
            props: {
              style: {
                marginTop: 'auto',
                fontSize: '20px',
                color: '#6B7280', // text-gray-500
              },
              children: 'Generado por Tiender.com', // Your brand
            },
          },
        ],
      },
    };

    // 4. Generate SVG from HTML
    const svg = await satori(template, {
      width: 600,
      height: 1067, // Aspect ratio similar to stories
      fonts: [{
        name: 'Inter',
        data: fontData,
        weight: 400,
        style: 'normal',
      }],
    });

    // 5. Convert SVG to PNG
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // 6. Upload PNG to Supabase Storage
    const filePath = `${storeId}.png`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from('share-images')
      .upload(filePath, pngBuffer, {
        contentType: 'image/png',
        upsert: true, // Overwrite if it exists
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // 7. Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('share-images')
      .getPublicUrl(filePath);

    if (!publicUrlData) {
      throw new Error('Could not retrieve public URL for the image.');
    }

    // 8. Return the public URL
    return new Response(JSON.stringify({ imageUrl: publicUrlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Error generating share image:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});