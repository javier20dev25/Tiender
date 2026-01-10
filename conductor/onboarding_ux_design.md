# Diseño de Experiencia de Usuario (UX): Onboarding y Casos Límite

Este documento define las decisiones de UX para el flujo de adquisición de usuarios, centrándose en la claridad, la justicia y la conversión. Es el complemento final a `business_flow.md` y `antifraud_rules.md`.

## 1. Flujo Principal: "Cuenta Primero" vs. "Plan Primero"

Para un producto como Tiender, que busca viralidad y la menor fricción posible para que los vendedores casuales empiecen, el enfoque de **"Cuenta Primero"** es superior.

*   **Justificación:**
    *   **Menor Carga Cognitiva:** El usuario solo tiene una decisión: "crear cuenta". No se le presenta una elección de planes que podría no entender aún.
    *   **Compromiso Progresivo:** Una vez que el usuario ha invertido tiempo en crear su cuenta y verificar su correo, está más predispuesto a continuar y explorar el producto.
    *   **Alineado con el Trial Único:** Como nuestro modelo de negocio inicial se basa en un único período de prueba gratuito, no hay una "elección" de plan real que hacer al principio.

*   **Decisión de Arquitectura:** **Se mantiene el flujo de "Cuenta Primero"**. El usuario aterriza en una página principal que le invita a registrarse, sin mención de planes de precios en esta fase inicial.

## 2. Diseño de Comunicación en Casos Límite

La forma en que comunicamos las restricciones es tan importante como las restricciones mismas. Los mensajes deben ser claros, empáticos y ofrecer una salida o explicación.

*   **Escenario 1: El usuario intenta registrarse con un WhatsApp ya existente.**
    *   **Contexto:** El usuario rellena el formulario de registro y la orquestación del backend devuelve el error `WHATSAPP_IN_USE`.
    *   **Objetivo de UX:** No frustrar al usuario. Reconocer que puede ser un cliente existente que ha olvidado su cuenta. Facilitar la recuperación.
    *   **Implementación en el Frontend (`SignUpForm.tsx`):**
        *   **Mensaje de Error Específico (en lugar de un error genérico):**
            > "Este número de WhatsApp ya está registrado en una cuenta. **¿Olvidaste tu contraseña?**"
        *   **Llamada a la Acción (CTA):**
            *   La parte "¿Olvidaste tu contraseña?" del mensaje debe ser un enlace.
            *   Este enlace **no** lleva a una página de "recuperar contraseña" directamente, sino que **cambia el formulario visible al de "Iniciar Sesión" (`SignInForm`)**.
            *   El `SignInForm` a su vez, debería tener su propio enlace de "¿Olvidaste la contraseña?" que sí inicie el flujo de recuperación de Supabase Auth.

*   **Escenario 2: El usuario con trial expirado intenta usar una función de pago.**
    *   **Contexto:** Un usuario cuya `trial_expires_at` es en el pasado intenta, por ejemplo, "añadir un nuevo producto" (asumiendo que esta es una función premium después del trial).
    *   **Objetivo de UX:** Convertir al usuario a un plan de pago de forma clara y sin fricción. Comunicar el valor.
    *   **Implementación (Nocional - para el futuro):**
        *   **Paywall Amigable (Modal o Banner):** La acción del usuario (ej. clic en "Añadir Producto") es interceptada. En lugar de un error, se muestra un *modal* (ventana emergente) o un *banner* prominente.
        *   **Encabezado:** "Tu período de prueba ha terminado"
        *   **Cuerpo del Mensaje:** "¡Nos encanta que sigas con nosotros! Para añadir más productos y acceder a todas las funciones premium, por favor elige un plan."
        *   **CTA Primario (Botón):** "Ver Planes de Pago" (lleva a la página de precios).
        *   **CTA Secundario (Enlace):** "Seguir con el plan gratuito limitado" (si aplica, cierra el modal).

## 3. Mapa de Experiencia de Usuario (Onboarding)

| Punto de Contacto | Mensaje Clave del Sistema | Acción Esperada del Usuario |
| :--- | :--- | :--- |
| **Landing Page** | "Crea tu tienda social y vende por WhatsApp en minutos." | Clic en "Crear Cuenta Gratis". |
| **Formulario de Registro** | Campos: Email, Contraseña, WhatsApp. | Rellena y envía el formulario. |
| **Registro - Fallo (WhatsApp usado)** | "Este número ya está registrado. ¿Olvidaste tu contraseña?" | Hace clic en el enlace para cambiar a "Iniciar Sesión". |
| **Registro - Éxito** | (Redirección a `/verify-otp`) | Revisa su correo electrónico en busca del código OTP. |
| **Página de Verificación OTP** | "Hemos enviado un código a [tu.email@...]. Ingrésalo aquí." | Copia y pega el código de 6 dígitos. |
| **Verificación - Fallo** | "El código es incorrecto. Por favor, inténtalo de nuevo." | Revisa el correo y vuelve a introducir el código. |
| **Primer Acceso al Dashboard** | (Banner) "¡Bienvenido! Tienes 7 días de prueba con todas las funciones." | Empieza a explorar el producto. |
| **Acceso a Función Premium (Post-Trial)**| (Modal) "Tu período de prueba ha terminado. Actualiza para continuar." | Hace clic en "Ver Planes de Pago". |

Este documento cierra el ciclo de diseño estratégico. Ahora tenemos una visión completa del **QUÉ** (flujo), el **PORQUÉ** (reglas de negocio) y el **CÓMO SE SIENTE** (UX). Estamos listos para reanudar la implementación técnica con un propósito y una dirección claros.
