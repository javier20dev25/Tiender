-- supabase/migrations/008_update_analytics_rpc_scoring.sql

CREATE OR REPLACE FUNCTION public.get_store_analytics(target_store_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
WITH store_events AS (
    SELECT
        product_id,
        event_type,
        session_id
    FROM
        public.product_analytics
    WHERE
        store_id = target_store_id
),
total_visits AS (
    SELECT
        COUNT(DISTINCT session_id) AS count
    FROM
        store_events
    WHERE
        event_type = 'VISIT'
),
product_metrics AS (
    SELECT
        product_id,
        COUNT(*) FILTER (WHERE event_type = 'LIKE') AS likes,
        COUNT(*) FILTER (WHERE event_type = 'DISLIKE') AS dislikes,
        COUNT(*) FILTER (WHERE event_type = 'ADD_TO_CART') AS added_to_cart
    FROM
        store_events
    WHERE
        product_id IS NOT NULL
    GROUP BY
        product_id
),
ranked_products AS (
    SELECT
        p.id,
        p.title,
        p.image_url,
        COALESCE(pm.likes, 0) AS likes,
        COALESCE(pm.dislikes, 0) AS dislikes,
        COALESCE(pm.added_to_cart, 0) AS added_to_cart,
        -- New scoring logic: 1 point for a like or add_to_cart, -1 for a dislike
        (COALESCE(pm.likes, 0) + COALESCE(pm.added_to_cart, 0) - COALESCE(pm.dislikes, 0)) AS score
    FROM
        public.products p
    LEFT JOIN
        product_metrics pm ON p.id = pm.product_id
    WHERE
        p.store_id = target_store_id
)
SELECT
    JSON_BUILD_OBJECT(
        'total_visits', (SELECT count FROM total_visits),
        'top_products', (
            SELECT
                JSON_AGG(rp.*)
            FROM (
                SELECT
                    *
                FROM
                    ranked_products
                ORDER BY
                    score DESC
                LIMIT 5
            ) rp
        )
    );
$$;
