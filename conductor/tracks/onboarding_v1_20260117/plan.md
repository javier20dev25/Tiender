# Plan: Onboarding de Vendedores v1

Este documento describe el flujo de onboarding implementado, que centraliza el registro de usuarios y la creación de recursos iniciales a través de una función orquestadora.

**Estado:** Implementado y verificado.

---

## Fase 1: Registro Orquestado [Completado]

*Meta: Unificar el proceso de alta de un nuevo vendedor para que, en una sola operación, se cree el usuario, se le asigne una tienda por defecto y quede listo para operar.*

- **[x] Task: Implementar la Supabase Edge Function `orchestrate-signup`.**
  - **Lógica:**
    1.  Recibe `phone` y `password` del frontend.
    2.  Verifica o crea un registro en `whatsapp_identities` para el número de teléfono.
    3.  Crea un nuevo usuario en `supabase.auth` usando un email falso (`<phone>@tiender.app`).
    4.  Auto-confirma el teléfono y el email del usuario para evitar pasos de verificación.
    5.  Crea una tienda por defecto (`name: 'Mi Tienda'`) y la asocia al `user_id` del nuevo usuario.
    6.  Registra los eventos clave del proceso (`SIGNUP_SUCCESS`, `STORE_CREATED`) en la tabla `business_events`.
  - **Archivos Clave:** `supabase/functions/orchestrate-signup/index.ts`

- **[x] Task: Actualizar el frontend para usar la función orquestadora.**
  - **Lógica:** El formulario de registro (`SignUpForm.tsx`) ya no llama a `supabase.auth.signUp`, sino que invoca a la Edge Function `orchestrate-signup`.
  - **Archivos Clave:** `src/features/auth/services/authService.ts`, `src/features/auth/components/SignUpForm.tsx`

---

## Fase 2: Panel de Vendedor y Gestión de la Tienda [Completado]

*Meta: Proveer al usuario una interfaz para gestionar su tienda y sus productos después de iniciar sesión.*

- **[x] Task: Desarrollar el componente principal del panel (`DashboardPage.tsx`).**
  - **Lógica:**
    1.  Al cargar, obtiene los datos de la tienda (`stores`) y los productos (`products`) asociados al usuario.
    2.  Si no encuentra una tienda (caso que ya no debería ocurrir para nuevos usuarios, pero se mantiene por robustez), muestra una opción para crear una.
    3.  Si encuentra la tienda, muestra los detalles y la lista de productos.
  - **Archivos Clave:** `src/pages/DashboardPage.tsx`

- **[x] Task: Implementar la funcionalidad para añadir/editar productos.**
  - **Lógica:** Formularios modales que permiten al usuario crear o actualizar productos. La subida de imágenes se realiza a Supabase Storage.
  - **Archivos Clave:** `src/components/AddProductForm.tsx`, `src/components/EditProductForm.tsx`

- **[x] Task: Implementar la funcionalidad para editar la tienda.**
  - **Lógica:** Un formulario modal que permite al usuario cambiar el nombre y el logo de su tienda.
  - **Archivos Clave:** `src/components/EditStoreForm.tsx`

---

## Fase 3: Optimización de Imágenes [Completado]

*Meta: Optimizar automáticamente las imágenes de productos subidas por los usuarios para mejorar el rendimiento.*

- **[x] Task: Implementar la Supabase Edge Function `optimize-image`.**
  - **Lógica:** Una función que se dispara (o puede ser disparada) cuando se sube una imagen a un bucket de Supabase Storage. Utiliza una librería de procesamiento de imágenes para comprimirla.
  - **Archivos Clave:** `supabase/functions/optimize-image/index.ts`
