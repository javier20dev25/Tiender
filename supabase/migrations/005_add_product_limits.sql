-- supabase/migrations/005_add_product_limits.sql
-- Añadir la columna product_limit a la tabla de tiendas para implementar la lógica de planes.

-- 1. Añadir la columna con un valor por defecto para los planes de prueba.
ALTER TABLE public.stores
ADD COLUMN product_limit INT DEFAULT 10;

-- 2. (Opcional, pero recomendado) Actualizar tiendas existentes que podrían no tener el límite.
--    Esto asegura que todas las tiendas ya creadas en tu DB tengan el límite de prueba.
UPDATE public.stores
SET product_limit = 10
WHERE product_limit IS NULL;

-- 3. Comentario para el futuro:
-- Cuando un usuario pague por un plan, se deberá actualizar el valor de esta columna.
-- Por ejemplo, para el Plan Basic, se ejecutaría:
-- UPDATE public.stores SET product_limit = 30 WHERE id = 'store_id_del_usuario';
-- Para el Plan Pro, se ejecutaría:
-- UPDATE public.stores SET product_limit = 60 WHERE id = 'store_id_del_usuario';
