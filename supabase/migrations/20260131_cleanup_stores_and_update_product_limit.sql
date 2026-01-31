-- Migración para limpiar tiendas de desarrollo y ajustar el límite de productos por defecto.

-- ¡¡PRECAUCIÓN: ESTE COMANDO ELIMINA TODOS LOS DATOS DE LAS TIENDAS Y SUS PRODUCTOS ASOCIADOS!!
-- Se utiliza para limpiar el entorno de desarrollo según solicitado.
TRUNCATE public.stores RESTART IDENTITY CASCADE;

-- Altera el valor por defecto del límite de productos para todas las futuras tiendas.
-- El plan "Standard" (tanto en trial como pagado) tendrá un límite de 30 productos desde el inicio.
ALTER TABLE public.stores
ALTER COLUMN product_limit SET DEFAULT 30;
