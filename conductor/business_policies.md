# Manifiesto de Políticas de Negocio v1.0

Este documento consolida todas las reglas de negocio para el ciclo de vida del usuario, el trial y la seguridad. Es la fuente de verdad que dicta la implementación técnica y el diseño de la experiencia de usuario.

---

## 1. Políticas de Trial

El período de prueba (trial) es un privilegio para nuevos usuarios y se rige por la identidad del número de WhatsApp.

*   **P-TRIAL-01: Elegibilidad del Trial**
    *   Un número de WhatsApp es elegible para un período de prueba si, y solo si, no existe un registro previo para ese número en la tabla `whatsapp_identities` con un estado de `TRIAL_ACTIVE` o `TRIAL_EXPIRED`.

*   **P-TRIAL-02: Activación Post-Verificación**
    *   El trial no se activa al crear la cuenta. Se considera `TRIAL_ACTIVE` únicamente después de que el usuario haya verificado exitosamente su correo electrónico a través del código OTP. Esto previene el abuso de trials por parte de bots o usuarios con correos falsos.

*   **P-T-RIAL-03: Duración y Expiración**
    *   La duración del trial es de **7 días naturales**.
    *   El campo `trial_expires_at` se calcula y almacena en el momento de la activación (`NOW() + interval '7 days'`).
    *   Una vez que un trial ha expirado, es permanente. No se conceden extensiones, reactivaciones ni segundos períodos de prueba para la misma identidad de WhatsApp.

---

## 2. Políticas de Upgrade (Transición a Pago)

Estas políticas son nocionales y guiarán el diseño futuro de los planes de pago.

*   **P-UPG-01: Upgrade Durante el Trial**
    *   Un usuario en `TRIAL_ACTIVE` puede migrar a un plan de pago en cualquier momento. Al hacerlo, el estado de su trial termina y se convierte en un cliente de pago.

*   **P-UPG-02: Upgrade Post-Trial**
    *   Un usuario cuyo `status` es `TRIAL_EXPIRED` debe seleccionar un plan de pago para continuar utilizando las funcionalidades premium de la aplicación.
    *   El sistema debe presentar un "paywall" claro (ver `onboarding_ux_design.md`) al intentar acceder a dichas funciones.

---

## 3. Políticas de Reintento y Seguridad Temporal

Estas reglas protegen al sistema contra ataques de fuerza bruta y abuso de servicios.

*   **P-RETRY-01: Límite de Solicitud de OTP**
    *   Un usuario puede solicitar un nuevo código OTP un máximo de **3 veces** dentro de una ventana de **10 minutos**.
    *   **Implementación Técnica:** La tabla `whatsapp_identities` (o `business_events`) deberá registrar `otp_sent_count` y `last_otp_sent_at`. La lógica para permitir o denegar un nuevo envío residirá en el backend.
    *   **Consecuencia:** Al exceder el límite, la capacidad de solicitar un nuevo OTP para esa cuenta queda bloqueada durante **1 hora**.

*   **P-RETRY-02: Límite de Fallos de Contraseña**
    *   Después de **5 intentos fallidos** de inicio de sesión con la contraseña incorrecta, la cuenta (`auth_user_id`) se bloquea temporalmente por **15 minutos**.
    *   **Implementación Técnica:** Esta es una funcionalidad estándar de Supabase Auth (Lock user after failed login attempts), que debe ser activada y configurada en el dashboard de Supabase.

---

## 4. Políticas de Bloqueo Permanente (Antifraude)

El bloqueo es la medida más severa y se reserva para casos claros de abuso.

*   **P-BLOCK-01: Bloqueo por Intento de Re-Trial**
    *   Si un usuario intenta registrarse con un número de WhatsApp cuyo `status` ya es `TRIAL_EXPIRED`, el sistema debe denegar el registro (como se define en P-TRIAL-01).
    *   Además, el sistema registrará un evento de negocio (`SIGNUP_FAILURE`) con el `error_code: 'WHATSAPP_TRIAL_EXPIRED'`.
    *   **Análisis Futuro:** Múltiples eventos de este tipo desde la misma IP o para el mismo `whatsapp_identity_id` (con diferentes correos) son una fuerte señal de abuso que puede justificar un bloqueo manual.

*   **P-BLOCK-02: Bloqueo Manual Administrativo**
    *   El estado `BLOCKED` en la tabla `whatsapp_identities` es la política de denegación definitiva.
    *   Un administrador puede aplicar este estado manualmente en la base de datos para prohibir permanentemente que un número de WhatsApp acceda al servicio.
    *   Un `status` `BLOCKED` previene cualquier nuevo registro y cualquier intento de inicio de sesión para cuentas asociadas.
