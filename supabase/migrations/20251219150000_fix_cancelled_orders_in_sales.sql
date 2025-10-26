-- =====================================================
-- FIX: Exclude Cancelled Orders from Sales Calculations
-- =====================================================
-- This migration fixes the get_combined_sales_report function to exclude
-- cancelled orders from sales calculations while still counting them in order totals

-- Drop and recreate the function with proper status filtering
DROP FUNCTION IF EXISTS get_combined_sales_report(DATE, DATE) CASCADE;

CREATE OR REPLACE FUNCTION get_combined_sales_report(
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE (
    total_orders BIGINT,
    total_sales NUMERIC,
    avg_order_value NUMERIC,
    orders_by_status JSONB,
    top_selling_items JSONB,
    daily_sales_data JSONB
) AS $$
DECLARE
    v_total_orders BIGINT := 0;
    v_total_sales NUMERIC := 0;
    v_avg_order_value NUMERIC := 0;
    v_orders_by_status JSONB;
    v_top_selling_items JSONB;
    v_daily_sales_data JSONB;
BEGIN
    -- Get total orders (including cancelled) and sales (excluding cancelled) from all sources
    SELECT 
        COALESCE(COUNT(*), 0),
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0)
    INTO v_total_orders, v_total_sales
    FROM (
        SELECT total_amount, created_at, status FROM orders 
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        UNION ALL
        SELECT total_amount, created_at, 'completed' as status FROM kiosk_orders 
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        UNION ALL
        SELECT total_amount, created_at, 'completed' as status FROM pos_orders 
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
    ) combined_orders;

    -- Calculate average order value (excluding cancelled orders from denominator)
    IF v_total_orders > 0 THEN
        -- Count only non-cancelled orders for average calculation
        SELECT COALESCE(COUNT(*), 0) INTO v_total_orders
        FROM (
            SELECT total_amount, created_at, status FROM orders 
            WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
            AND status != 'cancelled'
            UNION ALL
            SELECT total_amount, created_at, 'completed' as status FROM kiosk_orders 
            WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
            UNION ALL
            SELECT total_amount, created_at, 'completed' as status FROM pos_orders 
            WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        ) non_cancelled_orders;
        
        IF v_total_orders > 0 THEN
            v_avg_order_value := v_total_sales / v_total_orders;
        ELSE
            v_avg_order_value := 0;
        END IF;
    ELSE
        v_avg_order_value := 0;
    END IF;

    -- Get orders by status (only from main orders table as kiosk and pos have different status flows)
    SELECT jsonb_build_object(
        'pending', COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0),
        'preparing', COALESCE(SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END), 0),
        'ready', COALESCE(SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END), 0),
        'out_for_delivery', COALESCE(SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END), 0),
        'completed', COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0),
        'cancelled', COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0)
    ) INTO v_orders_by_status
    FROM orders 
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date;

    -- Get top selling items (excluding cancelled orders)
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', item_name,
            'quantity', total_quantity,
            'revenue', total_revenue
        ) ORDER BY total_quantity DESC
    ) INTO v_top_selling_items
    FROM (
        SELECT 
            fi.name as item_name,
            SUM(combined_items.quantity) as total_quantity,
            SUM(combined_items.quantity * combined_items.unit_price) as total_revenue
        FROM (
            -- From regular orders (excluding cancelled)
            SELECT oi.food_item_id, oi.quantity, oi.unit_price
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE DATE(o.created_at) BETWEEN p_start_date AND p_end_date
            AND o.status != 'cancelled'
            
            UNION ALL
            
            -- From kiosk orders (all are considered completed)
            SELECT koi.food_item_id, koi.quantity, koi.unit_price
            FROM kiosk_order_items koi
            JOIN kiosk_orders ko ON koi.kiosk_order_id = ko.id
            WHERE DATE(ko.created_at) BETWEEN p_start_date AND p_end_date
            
            UNION ALL
            
            -- From POS orders (all are considered completed)
            SELECT poi.food_item_id, poi.quantity, poi.unit_price
            FROM pos_order_items poi
            JOIN pos_orders po ON poi.pos_order_id = po.id
            WHERE DATE(po.created_at) BETWEEN p_start_date AND p_end_date
        ) combined_items
        JOIN food_items fi ON combined_items.food_item_id = fi.id
        GROUP BY fi.name
        ORDER BY total_quantity DESC
        LIMIT 10
    ) top_items;

    -- Get daily sales data (excluding cancelled orders from sales)
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', sale_date,
            'orders', daily_orders,
            'sales', daily_sales,
            'online_sales', online_sales,
            'pos_sales', pos_sales
        ) ORDER BY sale_date
    ) INTO v_daily_sales_data
    FROM (
        SELECT 
            DATE(combined_daily.created_at) as sale_date,
            COUNT(*) as daily_orders,
            SUM(CASE WHEN combined_daily.status != 'cancelled' THEN combined_daily.total_amount ELSE 0 END) as daily_sales,
            SUM(CASE WHEN combined_daily.source = 'online' AND combined_daily.status != 'cancelled' THEN combined_daily.total_amount ELSE 0 END) as online_sales,
            SUM(CASE WHEN combined_daily.source = 'pos' THEN combined_daily.total_amount ELSE 0 END) as pos_sales
        FROM (
            SELECT total_amount, created_at, 'online' as source, status FROM orders 
            WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
            UNION ALL
            SELECT total_amount, created_at, 'kiosk' as source, 'completed' as status FROM kiosk_orders 
            WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
            UNION ALL
            SELECT total_amount, created_at, 'pos' as source, 'completed' as status FROM pos_orders 
            WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        ) combined_daily
        GROUP BY DATE(combined_daily.created_at)
        ORDER BY sale_date
    ) daily_data;

    -- Handle null cases for empty data
    IF v_orders_by_status IS NULL THEN
        v_orders_by_status := jsonb_build_object(
            'pending', 0, 'preparing', 0, 'ready', 0, 
            'out_for_delivery', 0, 'completed', 0, 'cancelled', 0
        );
    END IF;

    IF v_top_selling_items IS NULL THEN
        v_top_selling_items := '[]'::jsonb;
    END IF;

    IF v_daily_sales_data IS NULL THEN
        v_daily_sales_data := '[]'::jsonb;
    END IF;

    -- Return the results
    RETURN QUERY SELECT 
        v_total_orders,
        v_total_sales,
        v_avg_order_value,
        v_orders_by_status,
        v_top_selling_items,
        v_daily_sales_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_combined_sales_report(DATE, DATE) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed get_combined_sales_report function to exclude cancelled orders from sales calculations!';
END $$;
