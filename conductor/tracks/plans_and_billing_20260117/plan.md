# Plan: Planes y Facturación v1

Este documento describe la funcionalidad implementada para la gestión de planes, límites de productos y el proceso de mejora de plan a través de PayPal.

**Estado:** Implementado y verificado.

---

## Fase 1: Estructura de Datos y Límites [Completado]

*Meta: Definir en la base de datos la estructura de los planes y los límites asociados a cada uno.*

- **[x] Task: Añadir campos de plan a la tabla `stores`.**
  - **Lógica:**
    1. Se añadió la columna `plan_type` (originalmente `plan`) para almacenar el tipo de plan del usuario (ej: 'FREE', 'PREMIUM').
    2. Se añadió la columna `product_limit` para definir cuántos productos puede crear una tienda según su plan. El valor por defecto es 10 para el plan gratuito.
  - **Archivos Clave:** `supabase/migrations/004_add_plan_features.sql`, `supabase/migrations/005_add_product_limits.sql`

---

## Fase 2: Integración en el Frontend [Completado]

*Meta: Mostrar la información del plan en el panel de vendedor y aplicar los límites en la UI.*

- **[x] Task: Mostrar el plan actual y el límite de productos.**
  - **Lógica:** El componente `DashboardPage.tsx` obtiene y muestra el `plan_type` y el recuento de productos actual (`products.length`) frente al `product_limit`.
  - **Archivos Clave:** `src/pages/DashboardPage.tsx`

- **[x] Task: Bloquear la creación de productos al alcanzar el límite.**
  - **Lógica:** El botón "+ Añadir Producto" se deshabilita si `products.length >= store.product_limit`. Se muestra un aviso al usuario sugiriendo que mejore su plan.
  - **Archivos Clave:** `src/pages/DashboardPage.tsx`

- **[x] Task: Implementar el botón "Mejorar Plan".**
  - **Lógica:** Un botón en el `DashboardPage.tsx` que, al ser presionado, inicia el proceso de suscripción.
  - **Archivos Clave:** `src/pages/DashboardPage.tsx`

---

## Fase 3: Proceso de Suscripción con PayPal [Completado]

*Meta: Permitir a los usuarios mejorar su plan a uno de pago a través de una suscripción de PayPal.*

- **[x] Task: Implementar la Supabase Edge Function `create-paypal-subscription`.**
  - **Lógica:**
    1. Es invocada desde el botón "Mejorar Plan".
    2. Se comunica con la API de PayPal para crear un nuevo plan de suscripción.
    3. Devuelve una `approve_url` de PayPal al frontend.
    4. El frontend redirige al usuario a esta URL de PayPal para que apruebe el pago.
    *(Nota: La lógica para manejar el webhook de PayPal después del pago exitoso aún no está documentada o podría no estar implementada).*
  - **Archivos Clave:** `supabase/functions/create-paypal-subscription/index.ts`
