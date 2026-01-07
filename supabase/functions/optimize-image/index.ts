// Supabase Edge Function (TypeScript) - optimize-image
// Trigger: storage event on bucket "product-images" (object created)
// Nota: edge functions en supabase tienen runtime deno/node; adapta según tu entorno

import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import sharp from "https://esm.sh/sharp@0.33.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

serve(async (req) => {
  try {
    const { record } = await req.json();
    const { bucket_id: bucket, name: key } = record;

    // Fetch the uploaded object
    const { data, error } = await supabase.storage.from(bucket).download(key);
    if (error || !data) throw error ?? new Error("No data");

    const arrayBuffer = await data.arrayBuffer();

    // Generate sizes
    const sizes = [
      { suffix: "thumb", width: 400 },
      { suffix: "medium", width: 800 },
      { suffix: "large", width: 1600 }
    ];

    for (const s of sizes) {
      const resized = await sharp(arrayBuffer)
        .resize({ width: s.width, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer();

      const newKey = key.replace(/(\.[^.]+)$/, `_${s.suffix}.webp`);
      const { error: uploadError } = await supabase.storage.from(bucket).upload(newKey, resized, {
        contentType: "image/webp",
        upsert: true
      });

      if (uploadError) {
        console.error(`Upload error for ${newKey}:`, uploadError);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
