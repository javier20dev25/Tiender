-- Segunda versión: shipping options, 1 store per account, billing exempt for collaborators
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS shipping_options JSONB NOT NULL DEFAULT '[{"method_type":"Por coordinar","method_name":"Envío","cost":0}]'::jsonb;

-- Ensure existing rows have a valid value
UPDATE public.products
SET shipping_options = '[{"method_type":"Por coordinar","method_name":"Envío","cost":0}]'::jsonb
WHERE shipping_options IS NULL;

ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS billing_exempt BOOLEAN NOT NULL DEFAULT false;

-- Default 1 store per active account (soft-delete aware)
CREATE UNIQUE INDEX IF NOT EXISTS stores_user_id_active_unique
ON public.stores(user_id)
WHERE deleted_at IS NULL;

-- Recreate get_store_products including shipping_options
DROP FUNCTION IF EXISTS public.get_store_products(UUID);

CREATE OR REPLACE FUNCTION public.get_store_products(
    target_store_id UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price NUMERIC,
    image_url TEXT,
    external_link TEXT,
    video_link TEXT,
    store_id UUID,
    created_at TIMESTAMPTZ,
    description TEXT,
    hashtags TEXT[],
    is_hot BOOLEAN,
    discount_timer_seconds INTEGER,
    discount_percentage INTEGER,
    wholesale_threshold INTEGER,
    wholesale_price NUMERIC,
    shipping_options JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH product_reactions AS (
        SELECT
            pa.product_id,
            COUNT(*) FILTER (WHERE pa.event_type = 'LIKE') as like_count
        FROM public.product_analytics pa
        WHERE pa.store_id = target_store_id
          AND pa.created_at > (NOW() - INTERVAL '7 days')
        GROUP BY pa.product_id
    )
    SELECT
        p.id,
        p.title,
        p.price::NUMERIC,
        p.image_url,
        p.external_link,
        p.video_link,
        p.store_id,
        p.created_at,
        p.description,
        p.hashtags,
        COALESCE(pr.like_count >= 5, false) as is_hot,
        p.discount_timer_seconds,
        p.discount_percentage,
        p.wholesale_threshold,
        p.wholesale_price::NUMERIC,
        COALESCE(p.shipping_options, '[{"method_type":"Por coordinar","method_name":"Envío","cost":0}]'::jsonb) as shipping_options
    FROM public.products p
    LEFT JOIN product_reactions pr ON p.id = pr.product_id
    WHERE p.store_id = target_store_id
    ORDER BY p.created_at DESC;
END;
$$;
