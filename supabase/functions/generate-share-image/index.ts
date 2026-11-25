import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import satori from 'npm:satori@0.10.13';
import { Resvg, initWasm } from 'npm:@resvg/resvg-wasm@2.6.2';
import { corsHeaders } from '../_shared/cors.ts';

let wasmInitialized = false;

// --- Type Definitions ---
interface ShareImagePayload {
  storeId: string;
}

interface TopProduct {
  id: string;
  title: string;
  image_url: string | null;
  likes: number;
  dislikes: number;
  added_to_cart: number;
  score: number;
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
      fetch('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-400-normal.woff').then((res) => res.arrayBuffer()),
    ]);
    
    if (storeError) throw new Error(`Failed to fetch store: ${storeError.message}`);
    if (analyticsError) throw new Error(`Failed to fetch analytics: ${analyticsError.message}`);
    if (!storeData) throw new Error('Store not found.');
    if (!analyticsData?.top_products) throw new Error('Analytics data not available.');

    const { name: storeName, logo_url: logoUrl } = storeData;
    const topProducts: TopProduct[] = analyticsData.top_products;

    // 3. Design the shareable image using Satori (Stories aspect ratio 600x1067)
    // White top fading through soft lavender to a vibrant purple at the bottom
    const rankColors = [
      { bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', border: 'rgba(245, 158, 11, 0.4)' }, // 1st - Gold
      { bg: 'rgba(124, 58, 237, 0.15)', text: '#7C3AED', border: 'rgba(124, 58, 237, 0.4)' }, // 2nd - Violet
      { bg: 'rgba(236, 72, 153, 0.15)', text: '#DB2777', border: 'rgba(236, 72, 153, 0.4)' }, // 3rd - Pink
      { bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', border: 'rgba(16, 185, 129, 0.4)' }, // 4th - Emerald
      { bg: 'rgba(100, 116, 139, 0.12)', text: '#475569', border: 'rgba(100, 116, 139, 0.3)' } // 5th - Slate
    ];

    const template = {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 35%, #DDD6FE 65%, #7C3AED 100%)',
          color: '#1E1B4B',
          padding: '48px 36px',
          fontFamily: '"Inter"',
          boxSizing: 'border-box',
          position: 'relative',
        },
        children: [
          // Header Section (on white background)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                marginBottom: '32px',
              },
              children: [
                // Badge Pill
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: 'rgba(124, 58, 237, 0.1)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '999px',
                      padding: '6px 18px',
                      marginBottom: '14px',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            display: 'flex',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: '#7C3AED',
                            letterSpacing: '2px',
                            textTransform: 'uppercase',
                          },
                          children: '🔥 TOP PRODUCTOS DE LA SEMANA',
                        },
                      },
                    ],
                  },
                },
                // Store Name
                {
                  type: 'h1',
                  props: {
                    style: {
                      display: 'flex',
                      fontSize: '44px',
                      fontWeight: '800',
                      margin: '0 0 8px 0',
                      textAlign: 'center',
                      color: '#1E1B4B',
                      letterSpacing: '-1px',
                    },
                    children: String(storeName || 'Tienda'),
                  },
                },
                // Subtitle
                {
                  type: 'p',
                  props: {
                    style: {
                      display: 'flex',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#6B7280',
                      margin: '0',
                    },
                    children: 'Los favoritos de nuestra comunidad',
                  },
                },
              ],
            },
          },

          // Products List (Top 5)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: '14px',
              },
              children: topProducts.slice(0, 5).map((product: TopProduct, index: number) => {
                const colorScheme = rankColors[index] || rankColors[4];
                return {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      backgroundColor: 'rgba(255, 255, 255, 0.92)',
                      border: '1px solid rgba(124, 58, 237, 0.18)',
                      borderRadius: '20px',
                      padding: '16px 20px',
                      boxSizing: 'border-box',
                    },
                    children: [
                      // Rank Number Pill
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '46px',
                            height: '46px',
                            borderRadius: '14px',
                            backgroundColor: colorScheme.bg,
                            border: `1px solid ${colorScheme.border}`,
                            color: colorScheme.text,
                            fontSize: '20px',
                            fontWeight: '800',
                            marginRight: '16px',
                            flexShrink: 0,
                          },
                          children: `#${index + 1}`,
                        },
                      },
                      // Product Title
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            flexDirection: 'column',
                            flexGrow: 1,
                            minWidth: 0,
                            marginRight: '12px',
                          },
                          children: [
                            {
                              type: 'span',
                              props: {
                                style: {
                                  display: 'flex',
                                  fontSize: '18px',
                                  fontWeight: '700',
                                  color: '#1E1B4B',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                },
                                children: String(product.title || 'Producto'),
                              },
                            },
                          ],
                        },
                      },
                      // Score Pill
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(124, 58, 237, 0.08)',
                            borderRadius: '12px',
                            padding: '6px 14px',
                            flexShrink: 0,
                          },
                          children: [
                            {
                              type: 'span',
                              props: {
                                style: {
                                  display: 'flex',
                                  fontSize: '17px',
                                  fontWeight: '800',
                                  color: colorScheme.text,
                                },
                                children: `${product.score ?? 0} pts`,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                };
              }),
            },
          },

          // Call to Action Banner at bottom (on purple background)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                marginTop: 'auto',
                paddingTop: '24px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '18px',
                      padding: '16px 20px',
                      boxSizing: 'border-box',
                      marginBottom: '16px',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            display: 'flex',
                            fontSize: '16px',
                            fontWeight: '800',
                            color: '#6D28D9',
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                          },
                          children: '👉 Toca el enlace para ver y pedir',
                        },
                      },
                    ],
                  },
                },
                // Footer Branding
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: { display: 'flex' },
                          children: 'Tiender • Social Commerce para WhatsApp',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    };

    // Define a minimal type for Satori nodes
    type SatoriNode = {
      type: string;
      props?: {
        style?: Record<string, string | number>;
        src?: string;
        children?: (SatoriNode | string | null | undefined)[];
      };
    };
    
    // 4. Generate SVG from HTML
    const svg = await satori(template as SatoriNode, {
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
    if (!wasmInitialized) {
      const wasmRes = await fetch('https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm');
      await initWasm(await wasmRes.arrayBuffer());
      wasmInitialized = true;
    }
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

    } catch (error: unknown) {
      console.error('Error generating share image:', error);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : 'An unknown error occurred' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
});