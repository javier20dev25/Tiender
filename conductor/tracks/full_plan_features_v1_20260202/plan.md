# Plan de Implementación: Funcionalidades del Plan Full (v1)

**Track:** `full_plan_features_v1_20260202`

Este documento detalla el plan técnico para implementar las nuevas funcionalidades exclusivas para el "Plan Full", según las ideas de Astaroth.

**Regla de Oro:** Todas las funcionalidades aquí descritas deben estar estrictamente limitadas a los usuarios con un plan 'full'. La verificación se hará principalmente en el frontend (`if (store.plan_type === 'full')`) para la UI, y en el backend (RLS) si se crean nuevas tablas o endpoints sensibles.

---
## Checklist de Implementación

- [ ] **CTA a Grupo/Canal al Finalizar**
- [ ] **Hashtags por Producto**
- [ ] **Indicador de "Producto Caliente" (🔥) y Priorización**
- [ ] **Oferta por Inactividad del Usuario**
- [ ] **Ventas al por Mayor (Wholesale)**

---

### 1. Indicador de "Producto Caliente" (🔥) y Priorización

*   **Objetivo:** Destacar los productos más populares y mostrarlos primero.
*   **Pasos Técnicos:**
    1.  **Backend (Función RPC):** Modificar la función `get_weekly_heatmap_analytics` para que el `product_summary` devuelto incluya un campo booleano `is_hot`. La lógica determinará que un producto es "caliente" si está en el top 3 de `total_added_to_cart`.
    2.  **Backend (RLS):** No se requieren cambios de RLS para esta lectura de datos.
    3.  **Frontend (Tienda Social):**
        *   En `SocialStorePage.tsx`, al recibir los productos, reordenar el array `products` para que todos los que tengan la bandera `is_hot` aparezcan al principio.
        *   En el renderizado del producto, si `product.is_hot` es `true` y `store.plan_type === 'full'`, mostrar un ícono de llama (🔥) en una esquina de la imagen.

### 2. Oferta por Inactividad del Usuario

*   **Objetivo:** Convertir a usuarios indecisos con un descuento por tiempo limitado.
*   **Pasos Técnicos:**
    1.  **Database (Migración):**
        *   `ALTER TABLE products ADD COLUMN discount_timer_seconds INT;`
        *   `ALTER TABLE products ADD COLUMN discount_percentage INT;`
    2.  **Frontend (Dashboard):**
        *   **Feature Gate:** En `EditProductForm.tsx`, envolver la nueva sección de UI en un `if (store.plan_type === 'full')`.
        *   Añadir un toggle "Activar oferta por inactividad".
        *   Si está activo, mostrar inputs para "Tiempo de espera (segundos)" y "Descuento (%)".
        *   Actualizar la lógica de guardado del formulario para incluir estos nuevos campos.
    3.  **Frontend (Tienda Social):**
        *   En `SocialStorePage.tsx`, crear un `useEffect` que se active con `currentIndex`.
        *   Dentro del efecto, si el plan es 'full' y `currentProduct.discount_percentage` tiene un valor, iniciar un `setTimeout`.
        *   El `setTimeout` se debe limpiar si el usuario interactúa (like, dislike, cambia de producto) o el componente se desmonta.
        *   Si el temporizador se completa, mostrar un modal con el mensaje de la oferta. La lógica del carrito deberá ser capaz de aplicar este descuento.

### 3. Hashtags por Producto

*   **Objetivo:** Añadir más contexto y estilo a los productos.
*   **Pasos Técnicos:**
    1.  **Database (Migración):**
        *   `ALTER TABLE products ADD COLUMN hashtags TEXT[];` (Usar un array de texto para simpleza).
    2.  **Frontend (Dashboard):**
        *   **Feature Gate:** En `EditProductForm.tsx`, añadir un nuevo campo para hashtags dentro del `if (store.plan_type === 'full')`.
        *   El input debe permitir escribir hashtags separados por comas o espacios. Se debe procesar la entrada para guardarla como un array.
        *   Actualizar la lógica de guardado.
    3.  **Frontend (Tienda Social):**
        *   En `SocialStorePage.tsx`, si el plan es 'full' y `product.hashtags` existe, mapearlos y renderizarlos sobre la imagen del producto, con un fondo semi-transparente para asegurar la legibilidad.

### 4. Ventas al por Mayor (Wholesale)

*   **Objetivo:** Incentivar compras de mayor volumen.
*   **Pasos Técnicos:**
    1.  **Database (Migración):**
        *   `ALTER TABLE products ADD COLUMN wholesale_threshold INT;`
        *   `ALTER TABLE products ADD COLUMN wholesale_price NUMERIC;`
    2.  **Frontend (Dashboard):**
        *   **Feature Gate:** En `EditProductForm.tsx`, dentro del `if (store.plan_type === 'full')`.
        *   Añadir un toggle "Activar precios al por mayor".
        *   Si está activo, mostrar inputs para "Cantidad mínima" y "Nuevo precio por unidad".
        *   Actualizar la lógica de guardado.
    3.  **Frontend (Tienda Social):**
        *   Modificar el `CartModal` y la función que calcula el total.
        *   Al calcular el total, para cada item en el carrito, comprobar si el plan es 'full' y si `item.quantity >= item.wholesale_threshold`. Si es así, usar `item.wholesale_price`.
        *   Mostrar una nota visual en el `CartModal` indicando que se ha aplicado el descuento por volumen.

### 5. CTA a Grupo/Canal al Finalizar

*   **Objetivo:** Capturar leads que no convirtieron.
*   **Pasos Técnicos:**
    1.  **Database (Migración):**
        *   `ALTER TABLE stores ADD COLUMN community_link TEXT;`
    2.  **Frontend (Dashboard):**
        *   **Feature Gate:** En `EditStoreForm.tsx`, añadir el campo "Enlace a tu comunidad" dentro del `if (store.plan_type === 'full')`.
        *   Actualizar la lógica de guardado del formulario de la tienda.
    3.  **Frontend (Tienda Social):**
        *   En `SocialStorePage.tsx`, al llegar al final del carrusel, comprobar si `cart.length === 0`, si el plan es 'full' y si `store.community_link` existe.
        *   Si todas las condiciones se cumplen, mostrar un botón o un modal con el CTA para unirse a la comunidad.
