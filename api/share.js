// api/share.js
const sanitizeEnv = (val) => {
  if (!val) return '';
  return String(val).replace(/^[\uFEFF\u200B-\u200D\s"']+|[\uFEFF\u200B-\u200D\s"']+$/g, '').trim();
};

const SUPABASE_URL = sanitizeEnv(process.env.VITE_SUPABASE_URL) || 'https://zilkwckvsnxualaaapud.supabase.co';
const SUPABASE_ANON_KEY = sanitizeEnv(process.env.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbGt3Y2t2c254dWFsYWFhcHVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODU1NjgsImV4cCI6MjA4MzI2MTU2OH0.JZYT0b6UXEhxNmytfrzLSQDg7bVeecRhk6hddXir-UQ';
const APP_URL = 'https://tiender.vercel.app';

export default async function handler(req, res) {
  const storeId = req.query.storeId;

  if (!storeId) {
    return res.redirect(302, APP_URL);
  }

  let storeName = 'Tienda';
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/stores?id=eq.${encodeURIComponent(storeId)}&select=name`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data[0]?.name) {
        storeName = data[0].name;
      }
    }
  } catch (err) {
    console.error('Error fetching store for OG:', err);
  }

  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/share-images/${storeId}.png`;
  const pageUrl = `${APP_URL}/s/${storeId}`;
  const storeUrl = `${APP_URL}/tienda/${storeId}`;

  const safeStoreName = escapeHtml(storeName);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Open Graph / WhatsApp / Facebook / Instagram -->
  <meta property="og:title" content="🔥 Top Productos de ${safeStoreName}">
  <meta property="og:description" content="Descubre los productos más populares y haz tu pedido directo por WhatsApp.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="600">
  <meta property="og:image:height" content="1067">
  <meta property="og:image:type" content="image/png">
  <meta property="og:site_name" content="Tiender">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="🔥 Top Productos de ${safeStoreName}">
  <meta name="twitter:description" content="Descubre los productos más populares y haz tu pedido directo por WhatsApp.">
  <meta name="twitter:image" content="${imageUrl}">

  <!-- Instant Browser Redirect -->
  <meta http-equiv="refresh" content="0; url=${storeUrl}">
  <script>window.location.replace("${storeUrl}");</script>
  <link rel="canonical" href="${storeUrl}">

  <title>Redirigiendo a ${safeStoreName}...</title>
  <style>
    body {
      background-color: #09090D;
      color: #94A3B8;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    a {
      color: #A3E635;
      text-decoration: none;
      font-weight: bold;
      margin-top: 16px;
      padding: 12px 24px;
      background: rgba(163, 230, 53, 0.1);
      border: 1px solid rgba(163, 230, 53, 0.3);
      border-radius: 12px;
      display: inline-block;
    }
  </style>
</head>
<body>
  <p>Redirigiendo a la tienda...</p>
  <p><a href="${storeUrl}">Toca aquí si no te redirige automáticamente</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  return res.status(200).send(html);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
