# Manifiesto de Políticas de Negocio v2.0

Este documento consolida todas las reglas de negocio para el ciclo de vida del usuario, el trial y la seguridad. Es la fuente de verdad que dicta la implementación técnica y el diseño de la experiencia de usuario. La v2.0 refleja el cambio a un modelo de identidad basado en teléfono y un registro en un solo paso.

---

## 1. Políticas de Identidad y Autenticación

Estas reglas definen la identidad principal del Vendedor dentro del ecosistema Tiender.

*   **P-ID-01: Identidad Primaria**
    *   La identidad principal, única e inmutable de una tienda es su **número de teléfono verificado por WhatsApp**.
    *   El registro se realiza mediante número de teléfono y contraseña. No se utiliza email en el flujo de creación de cuenta.

*   **P-ID-02: Inmutabilidad**
    *   Un número de teléfono asociado a una cuenta no puede ser editado. Representa la identidad comercial de la tienda, y cambiarlo implicaría romper la confianza y el historial con sus clientes.

*   **P-ID-03: Unicidad**
    *   Un número de teléfono solo puede estar asociado a una única cuenta de Tiender. El sistema debe prevenir activamente la creación de cuentas duplicadas para el mismo número.

*   **P-ID-04: Proceso de Registro (One-Step Signup)**
    *   El registro de un nuevo vendedor se completa en un solo paso (`orchestrate-signup`).
    *   No existen estados intermedios como `PENDING_VERIFICATION`. La cuenta se considera activa inmediatamente después de la creación exitosa.

---

## 2. Políticas de OTP (One-Time Password)

El rol del OTP ha sido redefinido. Ya no es parte del flujo de activación.

*   **P-OTP-01: Propósito del OTP**
    *   El OTP **no se utiliza** para la creación o activación de cuentas.
    *   Su uso se reserva para flujos futuros de alta seguridad, tales como:
        *   Recuperación de cuenta.
        *   Confirmación de acciones sensibles (ej. eliminar la tienda).
        *   Verificación de inicio de sesión desde un nuevo dispositivo.

---

## 3. Políticas de Trial

El período de prueba (trial) se concede automáticamente en el momento del registro.

*   **P-TRIAL-01: Elegibilidad y Activación Inmediata**
    *   Un número de teléfono es elegible para un trial si nunca antes ha sido registrado en el sistema.
    *   El trial se activa **inmediatamente** al registrarse, cambiando el estado a `TRIAL_ACTIVE`. No hay activación diferida.

*   **P-TRIAL-02: Duración y Expiración**
    *   La duración del trial es de **7 días naturales**.
    *   El campo `trial_expires_at` se calcula y almacena en el momento del registro (`NOW() + interval '7 days'`).
    *   Una vez que un trial ha expirado (`TRIAL_EXPIRED`), es permanente. No se conceden segundos períodos de prueba para la misma identidad de WhatsApp.

---

## 4. Políticas de Upgrade (Transición a Pago)

Estas políticas son nocionales y guiarán el diseño futuro de los planes de pago.

*   **P-UPG-01: Upgrade Durante el Trial**
    *   Un usuario en `TRIAL_ACTIVE` puede migrar a un plan de pago en cualquier momento.

*   **P-UPG-02: Upgrade Post-Trial**
    *   Un usuario en estado `TRIAL_EXPIRED` debe seleccionar un plan de pago para continuar utilizando las funcionalidades premium.

---

## 5. Políticas de Reintento y Seguridad Temporal

*   **P-RETRY-01: Límite de Fallos de Contraseña**
    *   Después de **5 intentos fallidos** de inicio de sesión, la cuenta se bloquea temporalmente por **15 minutos**.
    *   **Implementación Técnica:** Usar la funcionalidad estándar de Supabase Auth (Lock user after failed login attempts).

---

## 6. Políticas de Bloqueo Permanente (Antifraude)

*   **P-BLOCK-01: Bloqueo Manual Administrativo**
    *   El estado `BLOCKED` en la tabla `whatsapp_identities` es la política de denegación definitiva.
    *   Un administrador puede aplicar este estado manualmente para prohibir permanentemente que un número de WhatsApp acceda al servicio.
    *   Un `status` `BLOCKED` previene cualquier nuevo registro e inicio de sesión.
