-- Adding all columns for the new 'Full Plan' features

-- 1. For "Oferta por Inactividad"
ALTER TABLE public.products ADD COLUMN discount_timer_seconds INT;
ALTER TABLE public.products ADD COLUMN discount_percentage INT;

-- 2. For "Hashtags por Producto"
ALTER TABLE public.products ADD COLUMN hashtags TEXT[];

-- 3. For "Ventas al por Mayor"
ALTER TABLE public.products ADD COLUMN wholesale_threshold INT;
ALTER TABLE public.products ADD COLUMN wholesale_price NUMERIC;

-- 4. For "CTA a Grupo/Canal"
ALTER TABLE public.stores ADD COLUMN community_link TEXT;
