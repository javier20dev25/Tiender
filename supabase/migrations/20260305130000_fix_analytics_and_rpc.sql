-- Final fix for get_store_products structure after feature enhancements
-- Corrects type mismatch (numeric vs real) and adds missing feature columns

DROP FUNCTION IF EXISTS public.get_store_products(UUID);

CREATE OR REPLACE FUNCTION public.get_store_products(
    target_store_id UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    price NUMERIC, -- Corrected from REAL to match products table
    image_url TEXT,
    external_link TEXT,
    video_link TEXT,
    store_id UUID,
    created_at TIMESTAMPTZ,
    description TEXT,
    hashtags TEXT[],
    is_hot BOOLEAN,
    discount_timer_seconds INTEGER, -- Added
    discount_percentage INTEGER,      -- Added
    wholesale_threshold INTEGER,      -- Added
    wholesale_price NUMERIC           -- Added
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
        COALESCE(rp.is_hot_flag, false) as is_hot,
        p.discount_timer_seconds,
        p.discount_percentage,
        p.wholesale_threshold,
        p.wholesale_price
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

-- Update get_weekly_heatmap_analytics to include LIKES and DISLIKES
CREATE OR REPLACE FUNCTION public.get_weekly_heatmap_analytics(
    target_store_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        WITH all_hours AS (
            SELECT generate_series(
                date_trunc('hour', start_date),
                date_trunc('hour', end_date),
                '1 hour'::interval
            ) as hour
        ),
        store_events AS (
            SELECT
                created_at,
                event_type,
                session_id,
                product_id
            FROM
                public.product_analytics
            WHERE
                store_id = target_store_id
                AND created_at >= start_date
                AND created_at <= end_date
        ),
        hourly_visits AS (
            SELECT
                date_trunc('hour', created_at) as hour,
                COUNT(DISTINCT session_id) as visits
            FROM
                store_events
            WHERE
                event_type = 'VISIT'
            GROUP BY
                1
        ),
        hourly_adds_to_cart AS (
            SELECT
                date_trunc('hour', created_at) as hour,
                COUNT(*) as adds_to_cart
            FROM
                store_events
            WHERE
                event_type = 'ADD_TO_CART'
            GROUP BY
                1
        ),
        product_summary AS (
            SELECT
                p.id,
                p.title,
                p.image_url,
                COUNT(CASE WHEN se.event_type = 'ADD_TO_CART' THEN 1 END) as total_added_to_cart,
                COUNT(CASE WHEN se.event_type = 'LIKE' THEN 1 END) as total_likes,
                COUNT(CASE WHEN se.event_type = 'DISLIKE' THEN 1 END) as total_dislikes
            FROM
                public.products p
            LEFT JOIN
                store_events se ON se.product_id = p.id
            WHERE
                p.store_id = target_store_id
            GROUP BY
                p.id, p.title, p.image_url
            ORDER BY
                total_added_to_cart DESC, total_likes DESC
        ),
        total_summary AS (
            SELECT
                (SELECT COUNT(DISTINCT session_id) FROM store_events WHERE event_type = 'VISIT') as total_visits,
                (SELECT COUNT(*) FROM store_events WHERE event_type = 'ADD_TO_CART') as total_adds_to_cart,
                (SELECT COUNT(*) FROM store_events WHERE event_type = 'LIKE') as total_likes,
                (SELECT COUNT(*) FROM store_events WHERE event_type = 'DISLIKE') as total_dislikes
        )
        SELECT
            JSON_BUILD_OBJECT(
                'heatmap_data', (
                    SELECT
                        JSON_AGG(
                            JSON_BUILD_OBJECT(
                                'hour', ah.hour,
                                'visits', COALESCE(hv.visits, 0),
                                'adds_to_cart', COALESCE(hatc.adds_to_cart, 0)
                            )
                        )
                    FROM
                        all_hours ah
                    LEFT JOIN
                        hourly_visits hv ON ah.hour = hv.hour
                    LEFT JOIN
                        hourly_adds_to_cart hatc ON ah.hour = hatc.hour
                ),
                'product_summary', (SELECT JSON_AGG(ps.*) FROM product_summary ps),
                'total_summary', (SELECT ROW_TO_JSON(ts.*) FROM total_summary ts)
            )
    );
END;
$$;
