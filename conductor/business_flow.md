# Flujo de Negocio: Adquisición y Activación de Trial

Este documento define el flujo de negocio exacto para la adquisición de un nuevo usuario y la asignación de un período de prueba (trial). Es la fuente de verdad para la implementación técnica.

**Actores:**
*   **Usuario:** El vendedor potencial que visita la plataforma.
*   **Frontend:** La aplicación React que se ejecuta en el navegador del usuario.
*   **Backend:** El sistema de orquestación (futura Edge Function) que ejecuta la lógica de negocio.

---

## Fases del Proceso

1.  **Descubrimiento:** El usuario conoce la oferta del producto.
2.  **Decisión:** El usuario decide iniciar el proceso de registro.
3.  **Registro y Verificación de Identidad:** El usuario proporciona sus datos y el sistema valida su identidad principal (WhatsApp).
4.  **Decisión de Trial:** El sistema determina si el usuario tiene derecho a un período de prueba.
5.  **Creación y Verificación de Cuenta:** Se crea la cuenta de acceso (Auth) y se verifica el correo electrónico.
6.  **Activación:** El usuario accede por primera vez y el trial se activa oficialmente.

---

## Tabla de Flujo Detallado

| Paso | Fase | Actor | Acción del Actor | Lógica del Sistema (Backend) | Resultado Positivo (Backend) | Resultado Negativo (Backend) | Siguiente Estado / Acción |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Decisión | Usuario | Hace clic en "Empezar Prueba Gratis". | N/A | N/A | N/A | El Frontend muestra el formulario de registro. |
| 2 | Registro | Usuario | Rellena `email`, `password`, `whatsapp` y envía. | N/A | N/A | N/A | El Frontend llama al Backend (`orchestrate-signup`). |
| 3 | Verificación de Identidad | Backend | **1. Normalizar WhatsApp:**<br>Limpia el número a solo dígitos. | El número se estandariza. | N/A | N/A | Continúa al paso 4. |
| 4 | Decisión de Trial | Backend | **2. Consultar `whatsapp_identities`:**<br>¿Existe una fila con `whatsapp_number` = normalizado? | **Sí:** Continúa al paso 5.<br>**No:** Continúa al paso 6. | N/A | N/A | Salto condicional. |
| 5 | Decisión de Trial | Backend | **3. Evaluar Identidad Existente:**<br>Lee el `status` de la fila encontrada. | `status` = 'TRIAL_AVAILABLE': Continúa al paso 7.<br>`status` = 'BLOCKED' o 'TRIAL_EXPIRED': Deniega. | Denegado: `error_code: WHATSAPP_BLOCKED/EXPIRED`.<br>Registra evento `WHATSAPP_TRIAL_DENIED`. | **Éxito:** Continúa.<br>**Fallo:** Fin. Frontend muestra error específico. |
| 6 | Decisión de Trial | Backend | **4. Crear Nueva Identidad:**<br>Crea una fila en `whatsapp_identities` con el número y `status` = 'TRIAL_AVAILABLE'. | Fila creada.<br>Registra evento `WHATSAPP_TRIAL_AVAILABLE`. | Error de DB. Registra `SIGNUP_FAILURE`. | Continúa al paso 7. |
| 7 | Creación de Cuenta | Backend | **5. Crear Usuario en Auth:**<br>Llama a `supabase.auth.admin.createUser` con `email` y `password`. | Usuario de Auth creado.<br>Registra evento `SIGNUP_SUCCESS`. | `error: EMAIL_EXISTS`.<br>Registra `SIGNUP_FAILURE`. | **Éxito:** Continúa.<br>**Fallo:** Fin. Frontend muestra error específico. |
| 8 | Creación de Cuenta | Backend | **6. Iniciar Verificación de Correo:**<br>Supabase (por `email_confirm: true`) envía el OTP. | OTP enviado.<br>Registra evento `OTP_SENT`. | N/A (Fallo de envío es un problema de infra, no de lógica de negocio). | El Backend responde `success: true` al Frontend. |
| 9 | Verificación de Cuenta | Usuario | Es redirigido a `/verify-otp`. Ingresa el código recibido. | N/A | N/A | N/A | El Frontend llama al Backend (`verify-otp`). |
| 10 | Verificación de Cuenta | Backend | **7. Verificar OTP:**<br>Llama a `supabase.auth.verifyOtp`. | Código válido. Sesión creada.<br>Registra `OTP_VERIFIED`. | `error: INVALID_OTP`.<br>Registra `OTP_FAILURE`. | **Éxito:** Continúa.<br>**Fallo:** Fin. Frontend muestra error. |
| 11 | Activación | Backend | **8. Activar Trial:**<br>Llama a una función `activate-trial` (o dentro de `verify-otp`). | La función busca la fila en `whatsapp_identities` por `auth_user_id`. | Actualiza `status` a 'TRIAL_ACTIVE'.<br>Establece `trial_started_at` y `trial_expires_at`. | Error si no encuentra la identidad. | El Backend responde `success: true` y redirige al Dashboard. |
| 12 | Activación | Usuario | Es redirigido y accede al Dashboard. | El Frontend podría mostrar un banner: "Te quedan 7 días de prueba". | N/A | N/A | Fin del flujo de adquisición. |

---
**Nota sobre el Paso 11:** La activación del trial se realiza *después* de la verificación del OTP. Esto asegura que solo las cuentas verificadas consuman un período de prueba, previniendo el abuso con correos falsos.
