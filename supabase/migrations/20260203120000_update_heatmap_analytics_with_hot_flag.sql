
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
        product_counts AS (
            SELECT
                p.id,
                p.title,
                p.image_url,
                COUNT(se.product_id) as total_added_to_cart
            FROM
                store_events se
            JOIN
                public.products p ON se.product_id = p.id
            WHERE
                se.event_type = 'ADD_TO_CART'
            GROUP BY
                p.id, p.title, p.image_url
        ),
        product_summary AS (
            SELECT
                id,
                title,
                image_url,
                total_added_to_cart,
                (RANK() OVER (ORDER BY total_added_to_cart DESC) <= 3) as is_hot
            FROM
                product_counts
            ORDER BY
                total_added_to_cart DESC
        ),
        total_summary AS (
            SELECT
                (SELECT COUNT(DISTINCT session_id) FROM store_events WHERE event_type = 'VISIT') as total_visits,
                (SELECT COUNT(*) FROM store_events WHERE event_type = 'ADD_TO_CART') as total_adds_to_cart
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
                'total_summary', (SELECT JSON_BUILD_OBJECT('total_visits', ts.total_visits, 'total_adds_to_cart', ts.total_adds_to_cart) FROM total_summary ts)
            )
    );
END;
$$;
