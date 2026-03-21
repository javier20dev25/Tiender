-- Remove DISTINCT session_id counting to count all raw visits
-- supabase/migrations/20260308000000_count_raw_visits.sql

DROP FUNCTION IF EXISTS public.get_weekly_heatmap_analytics(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE FUNCTION public.get_weekly_heatmap_analytics(
    target_store_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
                COUNT(*) as visits
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
                (SELECT COUNT(*) FROM store_events WHERE event_type = 'VISIT') as total_visits,
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
