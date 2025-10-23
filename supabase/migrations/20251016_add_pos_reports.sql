-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_pos_sales_report(TIMESTAMPTZ, TIMESTAMPTZ);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pos_orders_created_at_status ON pos_orders(created_at, status);
CREATE INDEX IF NOT EXISTS idx_pos_orders_payment_method ON pos_orders(payment_method);

-- Create function to get POS sales report
CREATE OR REPLACE FUNCTION get_pos_sales_report(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    date DATE,
    total_sales DECIMAL,
    cash_sales DECIMAL,
    card_sales DECIMAL,
    total_orders BIGINT,
    total_items BIGINT,
    items_sold JSON
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
    WITH order_summary AS (
        -- First get order level data
        SELECT 
            DATE(o.created_at) as sale_date,
            o.id as order_id,
            o.total_amount,
            o.payment_method
        FROM pos_orders o
        WHERE o.created_at >= p_start_date
        AND o.created_at < p_end_date
        AND o.status = 'completed'
    ),
    daily_items AS (
        -- Then get item level data
        SELECT 
            DATE(o.created_at) as sale_date,
            json_agg(
                json_build_object(
                    'item_name', f.name,
                    'size', COALESCE(s.name, 'Regular'),
                    'quantity', oi.quantity,
                    'revenue', oi.total_price
                )
            ) as items
        FROM pos_orders o
        JOIN pos_order_items oi ON o.id = oi.pos_order_id
        JOIN food_items f ON oi.food_item_id = f.id
        LEFT JOIN item_sizes s ON oi.size_id = s.id
        WHERE o.created_at >= p_start_date
        AND o.created_at < p_end_date
        AND o.status = 'completed'
        GROUP BY DATE(o.created_at)
    ),
    daily_totals AS (
        -- Calculate daily totals
        SELECT 
            sale_date,
            COUNT(DISTINCT order_id) as order_count,
            SUM(total_amount) as daily_total,
            SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END) as daily_cash,
            SUM(CASE WHEN payment_method = 'card' THEN total_amount ELSE 0 END) as daily_card
        FROM order_summary
        GROUP BY sale_date
    )
    SELECT
        dt.sale_date as date,
        COALESCE(dt.daily_total, 0) as total_sales,
        COALESCE(dt.daily_cash, 0) as cash_sales,
        COALESCE(dt.daily_card, 0) as card_sales,
        COALESCE(dt.order_count, 0) as total_orders,
        COALESCE(
            (
                SELECT SUM(oi.quantity)
                FROM pos_orders o
                JOIN pos_order_items oi ON o.id = oi.pos_order_id
                WHERE DATE(o.created_at) = dt.sale_date
                AND o.status = 'completed'
            ),
            0
        ) as total_items,
        COALESCE(di.items, '[]'::json) as items_sold
    FROM daily_totals dt
    LEFT JOIN daily_items di ON dt.sale_date = di.sale_date
    ORDER BY dt.sale_date DESC;
END;
$$;