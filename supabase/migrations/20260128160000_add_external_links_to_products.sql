-- supabase/migrations/YYYYMMDDHHMMSS_add_external_links_to_products.sql

-- Añade las columnas para enlaces externos a la tabla de productos.
-- Ambas son de tipo TEXT y pueden ser nulas, ya que son opcionales.

ALTER TABLE public.products
ADD COLUMN url_video TEXT,
ADD COLUMN url_tienda_web TEXT;
