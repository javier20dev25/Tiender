-- Refine get_store_products RPC to avoid type mismatch warnings and optimize analytics
-- supabase/migrations/20260305140000_refine_analytics_and_rpc.sql

-- Migration to fix get_store_products sorting and hot product logic

DROP FUNCTION IF EXISTS public.get_store_products(UUID);

-- 1. Refine get_store_products with exact numeric types
CREATE OR REPLACE FUNCTION public.get_store_products(
    target_store_id UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price NUMERIC(10,2), -- Matches products table exactly
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
    wholesale_price NUMERIC(10,2) -- Matches products table expectations
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH product_reactions AS (
        -- Count likes for "is_hot" logic
        SELECT 
            product_id,
            COUNT(*) FILTER (WHERE event_type = 'LIKE') as like_count
        FROM public.product_analytics
        WHERE store_id = target_store_id
          AND created_at > (NOW() - INTERVAL '7 days')
        GROUP BY product_id
    )
    SELECT
        p.id,
        p.title,
        p.price::NUMERIC(10,2), -- Force cast
        p.image_url,
        p.external_link,
        p.video_link,
        p.store_id,
        p.created_at,
        p.description,
        p.hashtags,
        COALESCE(pr.like_count >= 5, false) as is_hot, -- Simplified is_hot logic
        p.discount_timer_seconds,
        p.discount_percentage,
        p.wholesale_threshold,
        p.wholesale_price::NUMERIC(10,2) -- Force cast
    FROM public.products p
    LEFT JOIN product_reactions pr ON p.id = pr.product_id
    WHERE p.store_id = target_store_id
    ORDER BY p.created_at DESC;
END;
$$;

-- 2. Add an index for session_id if it doesn't exist (ensuring unique tracking is fast)
CREATE INDEX IF NOT EXISTS idx_product_analytics_session_id ON public.product_analytics(session_id);

-- 3. Verify get_weekly_heatmap_analytics (Ensuring it handles NULL session_id gracefully but benefits from them)
-- No changes needed to the logic as COUNT(DISTINCT session_id) is already what we want.
