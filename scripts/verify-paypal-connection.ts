import 'dotenv/config';

async function verifyPayPal() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.error('❌ Error: PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET no encontrados en el archivo .env');
        return;
    }

    console.log('--- Diagnóstico de PayPal Sandbox ---');
    console.log(`Client ID: ${clientId.substring(0, 10)}...`);

    try {
        const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const response = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error al obtener el token de acceso:', errorData);
            return;
        }

        const data = await response.json();
        console.log('✅ Conexión con PayPal establecida correctamente.');
        console.log(`Token de acceso: ${data.access_token}`);
        console.log(`Vence en: ${data.expires_in} segundos`);

        // Intentar verificar el estado de la cuenta (si es posible)
        console.log('\n--- Probando API de PayPal ---');
        const productsResponse = await fetch('https://api-m.sandbox.paypal.com/v1/catalogs/products', {
            headers: {
                'Authorization': `Bearer ${data.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            console.log(`✅ Consulta de catálogos exitosa. Productos encontrados: ${productsData.products?.length || 0}`);
        } else {
            console.warn('⚠️ No se pudo consultar el catálogo, pero el token es válido.');
        }

        console.log('\n--- Conclusión ---');
        console.log('La configuración de backend de Tiender con PayPal Sandbox es CORRECTA.');
        console.log('Si tienes problemas al iniciar sesión en el popup de PayPal, es probable que sea:');
        console.log('1. Un problema del propio Sandbox de PayPal (a veces falla).');
        console.log('2. Extensiones de navegador (AdBlock) bloqueando scripts críticos.');
        console.log('3. Debes usar una cuenta de "Personal Buyer" y no la de "Business" para pagar.');

    } catch (err) {
        console.error('❌ Error de red al conectar con PayPal:', err);
    }
}

verifyPayPal();
