CREATE OR REPLACE FUNCTION public.get_store_products(
    target_store_id UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price REAL,
    image_url TEXT,
    external_link TEXT,
    video_link TEXT,
    store_id UUID,
    created_at TIMESTAMPTZ,
    description TEXT,
    hashtags TEXT[],
    is_hot BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH product_add_counts AS (
        SELECT
            p.id as product_id,
            COUNT(pa.product_id) as total_added_to_cart
        FROM
            public.products p
        LEFT JOIN
            public.product_analytics pa ON p.id = pa.product_id
        WHERE
            p.store_id = target_store_id
            AND pa.event_type = 'ADD_TO_CART'
            AND pa.created_at >= (NOW() - '7 days'::interval)
        GROUP BY
            p.id
    ),
    ranked_products AS (
        SELECT
            product_id,
            total_added_to_cart,
            (RANK() OVER (ORDER BY total_added_to_cart DESC) <= 3) as is_hot_flag
        FROM
            product_add_counts
    )
    SELECT
        p.id,
        p.title,
        p.price,
        p.image_url,
        p.external_link,
        p.video_link,
        p.store_id,
        p.created_at,
        p.description,
        p.hashtags,
        COALESCE(rp.is_hot_flag, false) as is_hot
    FROM
        public.products p
    LEFT JOIN
        ranked_products rp ON p.id = rp.product_id
    WHERE
        p.store_id = target_store_id
    ORDER BY
        is_hot DESC,
        p.created_at DESC;
END;
$$;