# Resumen Técnico del Proyecto "Tiender"

Este documento sirve como una referencia rápida de la configuración técnica clave del proyecto, incluyendo la gestión de variables de entorno y los detalles de la integración con servicios de terceros.

---

## 1. Gestión de Variables de Entorno

Las variables de entorno y secretos del proyecto se gestionan en dos lugares principales, dependiendo de su propósito:

### a) Vercel (Entorno de Frontend)

Aquí se almacenan las variables que necesita el cliente (la aplicación de React). Estas son accesibles públicamente desde el navegador.

- **Ubicación:** Panel de Vercel > Proyecto "Tiender" > Settings > Environment Variables.
- **Variables Principales:**
    - `VITE_SUPABASE_URL`: La URL pública de la instancia de Supabase.
    - `VITE_SUPABASE_ANON_KEY`: La clave anónima y pública de Supabase.
    - `VITE_APP_URL`: La URL base de la aplicación.

### b) Supabase (Entorno de Backend)

Aquí se almacenan los secretos que utilizan las Edge Functions (el backend). **Estas variables no son públicas** y solo las funciones del lado del servidor pueden acceder a ellas.

- **Ubicación:** Panel de Supabase > Proyecto "zilkwckvsnxualaaapud" > Settings > Secrets.
- **Variables Principales:**
    - `PAYPAL_CLIENT_ID`: Credencial de la API de PayPal.
    - `PAYPAL_CLIENT_SECRET`: Credencial secreta de la API de PayPal.
    - `PAYPAL_PLAN_ID`: El ID del plan de suscripción creado en PayPal.
    - `PAYPAL_WEBHOOK_ID`: El ID del webhook configurado para recibir notificaciones.
    - `PAYPAL_API_URL`: La URL de la API de PayPal (apuntando a Sandbox).
    - `SUPABASE_SERVICE_ROLE_KEY`: La clave de servicio de Supabase para operaciones con privilegios.

---

## 2. Configuración de PayPal (Sandbox)

La integración con PayPal está actualmente configurada para funcionar en el entorno de **Sandbox**, que es el modo de pruebas de PayPal.

- **Plan Configurado:** Se ha creado un único plan de suscripción.
    - **ID del Plan:** `P-5YV043222V725663YNFUEXWI`

- **Webhook Configurado:** Se ha configurado un webhook para que PayPal notifique a nuestra aplicación sobre eventos de suscripción.
    - **ID del Webhook:** `7S541243LE716813N`
    - **URL del Webhook:** `https://zilkwckvsnxualaaapud.supabase.co/functions/v1/handle-paypal-webhook`
    - **Eventos Suscritos:** El webhook está suscrito a todos los eventos de la categoría `Billing subscription` (activada, cancelada, pago fallido, etc.), aunque actualmente la lógica principal solo gestiona la activación.
