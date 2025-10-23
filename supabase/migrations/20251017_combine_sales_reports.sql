-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_combined_sales_report(TIMESTAMPTZ, TIMESTAMPTZ);

-- Create function to get combined sales report (online + POS)
CREATE OR REPLACE FUNCTION get_combined_sales_report(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    total_orders BIGINT,
    total_sales DECIMAL,
    avg_order_value DECIMAL,
    orders_by_status JSONB,
    top_selling_items JSONB,
    daily_sales_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_role text;
BEGIN
    -- Get user role from auth.users
    SELECT role INTO v_user_role 
    FROM auth.users 
    WHERE id = auth.uid();

    -- Check if user is admin
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Only admins can view sales reports';
    END IF;

    RETURN QUERY
    WITH combined_orders AS (
        -- Online orders
        SELECT
            o.id,
            o.total_amount,
            o.status,
            o.created_at,
            'online' as order_type,
            oi.id as item_id,
            oi.quantity,
            oi.total_price as item_total,
            f.name as item_name,
            COALESCE(s.name, 'Regular') as size_name
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN food_items f ON oi.food_item_id = f.id
        LEFT JOIN item_sizes s ON oi.size_id = s.id
        WHERE o.created_at >= p_start_date
        AND o.created_at < p_end_date

        UNION ALL

        -- POS orders
        SELECT
            po.id,
            po.total_amount,
            po.status,
            po.created_at,
            'pos' as order_type,
            poi.id as item_id,
            poi.quantity,
            poi.total_price as item_total,
            f.name as item_name,
            COALESCE(s.name, 'Regular') as size_name
        FROM pos_orders po
        LEFT JOIN pos_order_items poi ON po.id = poi.pos_order_id
        LEFT JOIN food_items f ON poi.food_item_id = f.id
        LEFT JOIN item_sizes s ON poi.size_id = s.id
        WHERE po.created_at >= p_start_date
        AND po.created_at < p_end_date
    ),
    order_stats AS (
        SELECT
            COUNT(DISTINCT id) as total_orders,
            SUM(total_amount) as total_sales,
            CASE 
                WHEN COUNT(DISTINCT id) > 0 THEN SUM(total_amount) / COUNT(DISTINCT id)
                ELSE 0
            END as avg_order_value
        FROM combined_orders
    ),
    status_breakdown AS (
        SELECT
            jsonb_build_object(
                'pending', COUNT(*) FILTER (WHERE status = 'pending'),
                'preparing', COUNT(*) FILTER (WHERE status = 'preparing'),
                'ready', COUNT(*) FILTER (WHERE status = 'ready'),
                'out_for_delivery', COUNT(*) FILTER (WHERE status = 'out_for_delivery'),
                'completed', COUNT(*) FILTER (WHERE status = 'completed'),
                'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
            ) as orders_by_status
        FROM combined_orders
    ),
    item_sales AS (
        SELECT
            item_name,
            SUM(quantity) as total_quantity,
            SUM(item_total) as total_revenue
        FROM combined_orders
        WHERE item_name IS NOT NULL
        GROUP BY item_name
        ORDER BY total_quantity DESC
        LIMIT 5
    ),
    top_items AS (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'name', item_name,
                    'quantity', total_quantity,
                    'revenue', total_revenue
                )
            ) as top_selling_items
        FROM item_sales
    ),
    daily_breakdown AS (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'date', sale_date,
                    'orders', daily_orders,
                    'sales', daily_sales,
                    'online_sales', online_sales,
                    'pos_sales', pos_sales
                )
                ORDER BY sale_date
            ) as daily_sales_data
        FROM (
            SELECT
                DATE(created_at) as sale_date,
                COUNT(DISTINCT id) as daily_orders,
                SUM(total_amount) as daily_sales,
                SUM(CASE WHEN order_type = 'online' THEN total_amount ELSE 0 END) as online_sales,
                SUM(CASE WHEN order_type = 'pos' THEN total_amount ELSE 0 END) as pos_sales
            FROM combined_orders
            GROUP BY DATE(created_at)
        ) daily
    )
    SELECT
        os.total_orders,
        os.total_sales,
        os.avg_order_value,
        sb.orders_by_status,
        COALESCE(ti.top_selling_items, '[]'::jsonb) as top_selling_items,
        COALESCE(db.daily_sales_data, '[]'::jsonb) as daily_sales_data
    FROM order_stats os
    CROSS JOIN status_breakdown sb
    LEFT JOIN top_items ti ON true
    LEFT JOIN daily_breakdown db ON true;
END;
$$;
