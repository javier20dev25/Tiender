# Plan de Configuración de PayPal

Este plan detalla los pasos finales requeridos para activar la integración de suscripciones con PayPal en el entorno de producción y pruebas. El código de la aplicación está completo, pero requiere la siguiente configuración externa.

## Tareas Pendientes

### 1. Obtener Credenciales de PayPal
- **Estado:** Pendiente
- **Acción:** Inicia sesión en tu cuenta de [PayPal Developer](https://developer.paypal.com/).
- **Pasos:**
    1. Ve a la sección **My Apps & Credentials**.
    2. Asegúrate de que estás en el modo **Sandbox**.
    3. Crea una nueva "App" si no existe una para este proyecto.
    4. Copia el **Client ID** y el **Client Secret** de tu aplicación. Estos serán `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET`.

### 2. Configurar y Ejecutar el Script de Setup
- **Estado:** Pendiente
- **Acción:** El script `scripts/setup-paypal.ts` debe ser ejecutado para crear los productos y planes en la plataforma de PayPal.
- **Pasos:**
    1. Crea un archivo `.env` en la raíz del proyecto.
    2. Añade las credenciales del paso anterior al archivo `.env`:
       ```
       PAYPAL_CLIENT_ID=TU_CLIENT_ID
       PAYPAL_CLIENT_SECRET=TU_CLIENT_SECRET
       ```
    3. Ejecuta el script con Deno: `deno run --allow-env --allow-net --allow-read scripts/setup-paypal.ts`
    4. El script te devolverá un **ID de Plan**. Cópialo. Este será `PAYPAL_PLAN_ID`.

### 3. Configurar Webhook en PayPal
- **Estado:** Pendiente
- **Acción:** Debes indicarle a PayPal a dónde enviar las notificaciones de suscripción (webhooks).
- **Pasos:**
    1. En tu aplicación de PayPal Developer, ve a la sección de **Webhooks**.
    2. Añade un nuevo webhook.
    3. La URL del webhook debe apuntar a tu función de Supabase: `https://<ID_PROYECTO_SUPABASE>.supabase.co/functions/v1/handle-paypal-webhook`.
    4. Suscríbete al evento **`BILLING.SUBSCRIPTION.ACTIVATED`**.
    5. Guarda el webhook y copia el **Webhook ID**. Este será `PAYPAL_WEBHOOK_ID`.

### 4. Configurar Secretos en Supabase
- **Estado:** Pendiente
- **Acción:** Añade todas las credenciales obtenidas como secretos en tu proyecto de Supabase.
- **Pasos:**
    1. Ve a la configuración de tu proyecto en Supabase -> Secrets.
    2. Añade los siguientes secretos:
        - `PAYPAL_CLIENT_ID` (del paso 1)
        - `PAYPAL_CLIENT_SECRET` (del paso 1)
        - `PAYPAL_PLAN_ID` (del paso 2)
        - `PAYPAL_WEBHOOK_ID` (del paso 3)
        - `PAYPAL_API_URL` (usa `https://api-m.sandbox.paypal.com` para pruebas)

Una vez completados estos pasos, la integración de PayPal estará fully funcional.
