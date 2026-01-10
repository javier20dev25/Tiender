# Reglas de Negocio y Políticas Antifraude v1

Este documento define las reglas de negocio para la gestión de trials y las políticas iniciales para prevenir el abuso del sistema. Es un complemento al `business_flow.md`.

## 1. Políticas de la Identidad de WhatsApp (Núcleo del Negocio)

La entidad `whatsapp_identities` es la única fuente de verdad para determinar el derecho a un período de prueba.

*   **Regla 1.1: Un Trial por Identidad, para Siempre.**
    *   Un número de WhatsApp normalizado (`whatsapp_number`) solo puede estar asociado a un `status` de `TRIAL_ACTIVE` una única vez en su ciclo de vida.
    *   **Implementación:** El flujo de registro (Paso 5 en `business_flow.md`) debe denegar estrictamente cualquier intento de registro si el `status` existente es `TRIAL_ACTIVE` o `TRIAL_EXPIRED`.

*   **Regla 1.2: La Identidad de WhatsApp es Permanente.**
    *   Un usuario no puede cambiar el número de WhatsApp asociado a su cuenta de Auth una vez que ha sido vinculado.
    *   **Implementación:** No se desarrollará ninguna funcionalidad de "cambiar número de WhatsApp" en el frontend o backend en esta fase.

*   **Regla 1.3: Un Correo por Identidad Activa.**
    *   Si un número de WhatsApp ya está asociado a una cuenta de Auth (`associated_auth_user_id` no es nulo), ningún otro correo puede registrarse usando ese mismo número de WhatsApp.
    *   **Implementación:** Esto ya está cubierto por la Regla 1.1. El sistema denegará el re-registro antes de llegar a la verificación del correo.

## 2. Gestión del Ciclo de Vida del Trial

*   **Regla 2.1: Duración Fija del Trial.**
    *   El período de prueba es de **7 días naturales** a partir del momento de la activación.
    *   **Implementación:** En el momento de la activación (Paso 11 en `business_flow.md`), el backend debe calcular y escribir `trial_expires_at` como `NOW() + interval '7 days'`.

*   **Regla 2.2: Transición a `TRIAL_EXPIRED` (Mecanismo Futuro).**
    *   Actualmente, no se implementará un proceso automático (cron job) para cambiar el `status` de `TRIAL_ACTIVE` a `TRIAL_EXPIRED` cuando la fecha de expiración se cumpla.
    *   **Enfoque Actual (Lógica en Tiempo de Lectura):** Cualquier lógica de la aplicación que restrinja el acceso a funciones "premium" deberá comprobar `trial_expires_at < NOW()`. Un `status` `TRIAL_ACTIVE` con una fecha de expiración pasada se trata, a efectos prácticos, como expirado.
    *   **Decisión de Arquitectura:** Se asume que un *scheduler* (ej. Supabase Cron Jobs) será añadido en el futuro para realizar esta limpieza de estados.

## 3. Políticas de Bloqueo y Antifraude (v1 - Simplificado)

*   **Regla 3.1: El Bloqueo es una Medida Administrativa.**
    *   El `status` `BLOCKED` es la medida más drástica y, en esta versión, solo puede ser aplicado por un administrador con acceso a la base de datos.
    *   **Implementación:** No se creará ninguna API o lógica de negocio para el bloqueo automático. Un administrador ejecutaría un `UPDATE public.whatsapp_identities SET status = 'BLOCKED' WHERE id = ...;`.

*   **Regla 3.2: Registro de Señales para Análisis Futuro.**
    *   El sistema de `business_events` debe registrar datos que permitan un análisis de fraude a futuro.
    *   **Implementación:** En cada evento `SIGNUP_ATTEMPT`, el `payload` en la tabla `business_events` debe incluir la dirección IP del solicitante. La Edge Function puede acceder a esta información desde la cabecera de la solicitud (`x-forwarded-for`).
    *   **Análisis Futuro:** Esto nos permitirá, más adelante, escribir consultas que detecten múltiples intentos de registro desde la misma IP en un corto período.

## 4. Prioridades de Implementación

1.  **Cumplimiento Estricto de la Regla 1.1:** Es la regla más crítica para proteger el modelo de negocio. La implementación en la Edge Function debe ser infalible.
2.  **Cálculo Correcto de la Expiración (Regla 2.1):** Asegurar que la fecha de expiración se calcule y guarde correctamente en el momento de la activación.
3.  **Registro de IP (Regla 3.2):** Incluir la IP en los eventos de registro es una victoria fácil y de alto valor para el futuro.
