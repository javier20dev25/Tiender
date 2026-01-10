# Plan de Implementación de UX v1.0

Este documento traduce las políticas de negocio (`business_policies.md`) en un plan de acción concreto para la interfaz de usuario. Define qué ve el usuario y cómo interactúa en cada paso del flujo de onboarding.

---

## 1. Diagrama de Vistas y Flujo de Navegación

El flujo principal de adquisición se compone de las siguientes vistas:

1.  **`AuthPage`**: Contenedor principal.
    *   **Vista A (por defecto):** `SignUpForm` (Formulario de Registro).
    *   **Vista B:** `SignInForm` (Formulario de Inicio de Sesión).
    *   *Transición:* El usuario puede cambiar entre `SignUpForm` y `SignInForm` a través de un enlace.

2.  **`VerifyOtpPage`**: Página de verificación de código OTP.
    *   *Entrada:* Se llega a esta página únicamente después de un envío exitoso del formulario `SignUpForm`.

3.  **`DashboardPage`**: El panel principal de la aplicación.
    *   *Entrada:* Se llega aquí después de un inicio de sesión exitoso o una verificación de OTP exitosa.

4.  **`PricingPage` (Nocional):** Una futura página para mostrar los planes de pago.
    *   *Entrada:* Se llega aquí desde el `DashboardPage` al intentar usar una función premium con un trial expirado, o al hacer clic en un botón de "Upgrade".

---

## 2. Decisión de Negocio: Onboarding "Cuenta Primero"

*   **Decisión:** Se confirma el modelo **"Cuenta Primero"**.
*   **Implementación:** La `Landing Page` o la ruta raíz (`/`) debe dirigir al usuario al flujo de registro (`/auth` mostrando `SignUpForm`). No se presentarán planes de precios antes de crear la cuenta. El objetivo es capturar el registro con la menor fricción posible, ofreciendo el trial como el camino por defecto.

---

## 3. Mapeo de Lógica de Negocio a Componentes de UI

Esta tabla define cómo cada componente debe reaccionar a las respuestas (tanto exitosas como de error) del servicio de orquestación.

| Componente | Respuesta del Backend (simulada o real) | Implementación en la Interfaz de Usuario |
| :--- | :--- | :--- |
| `SignUpForm`| **Éxito** (`{ success: true }`) | Redirige al usuario a la página `/verify-otp`, pasando el `email` en el estado de la navegación. |
| `SignUpForm`| **Error:** `WHATSAPP_IN_USE` | **1. Muestra Mensaje:** "Este número de WhatsApp ya está registrado."<br>**2. Muestra CTA:** Debajo del mensaje, un enlace/botón que dice "**¿Ya tienes una cuenta? Inicia Sesión**".<br>**3. Acción del CTA:** Al hacer clic, se llama a la función `onSwitchToSignIn`, que cambia la vista al componente `SignInForm`. |
| `SignUpForm`| **Error:** `EMAIL_EXISTS` | **1. Muestra Mensaje:** "Este correo electrónico ya está en uso."<br>**2. Muestra CTA:** Debajo del mensaje, un enlace/botón que dice "**Inicia Sesión aquí**".<br>**3. Acción del CTA:** Llama a `onSwitchToSignIn` para cambiar la vista al `SignInForm`. |
| `SignUpForm`| **Error:** `WHATSAPP_BLOCKED` | **1. Muestra Mensaje:** "Esta cuenta se encuentra bloqueada por incumplimiento de los términos de servicio."<br>**2. Deshabilita Formulario:** Todos los campos de entrada y el botón de envío se deshabilitan para prevenir más intentos. |
| `SignInForm`| **Error de Auth (genérico)** | Muestra el mensaje de error devuelto por Supabase Auth: "Invalid login credentials". |
| `VerifyOtpPage`| **Error:** `INVALID_OTP` | **1. Muestra Mensaje:** "El código ingresado es incorrecto. Por favor, inténtalo de nuevo."<br>**2. Limpia Campo:** El campo de entrada del OTP se vacía. |
| `DashboardPage`| **Estado de Trial:** `TRIAL_ACTIVE` | Muestra un banner o un indicador no intrusivo en la UI. **Copy:** "Te quedan **X** días de prueba." (donde X se calcula a partir de `trial_expires_at`). |
| `DashboardPage`| **Estado de Trial:** `TRIAL_EXPIRED` (detectado al usar una función premium) | **1. Intercepta Acción:** Previene la ejecución de la acción del usuario.<br>**2. Muestra Modal (Paywall):**<br>&nbsp;&nbsp;&nbsp;**Título:** "Tu período de prueba ha terminado"<br>&nbsp;&nbsp;&nbsp;**Mensaje:** "Para desbloquear esta y todas las funciones premium, por favor elige un plan."<br>&nbsp;&nbsp;&nbsp;**Botón Principal:** "Ver Planes" (redirige a `/pricing`).<br>&nbsp;&nbsp;&nbsp;**Botón Secundario:** "Cerrar". |

---

Este plan de implementación de UX es ahora nuestra guía para el desarrollo del frontend. Define claramente el comportamiento esperado para cada escenario de negocio, asegurando una experiencia de usuario coherente y alineada con nuestros objetivos.
