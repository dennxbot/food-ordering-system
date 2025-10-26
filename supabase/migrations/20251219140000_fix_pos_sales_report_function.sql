-- =====================================================
-- FIX: POS Sales Report Function - Remove size_id Reference
-- =====================================================

-- Drop the existing function that has the size_id error
DROP FUNCTION IF EXISTS get_pos_sales_report(DATE, DATE) CASCADE;

-- Recreate the function without the problematic size_id reference
CREATE OR REPLACE FUNCTION get_pos_sales_report(
    p_start_date DATE,
    p_end_date DATE
) RETURNS TABLE(
    date DATE,
    total_sales DECIMAL(10,2),
    cash_sales DECIMAL(10,2),
    card_sales DECIMAL(10,2),
    total_orders BIGINT,
    total_items BIGINT,
    items_sold JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(po.created_at) as date,
        COALESCE(SUM(po.total_amount), 0) as total_sales,
        COALESCE(SUM(CASE WHEN po.payment_method = 'cash' THEN po.total_amount ELSE 0 END), 0) as cash_sales,
        COALESCE(SUM(CASE WHEN po.payment_method = 'card' THEN po.total_amount ELSE 0 END), 0) as card_sales,
        COUNT(po.id) as total_orders,
        COALESCE(SUM(poi.quantity), 0) as total_items,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'item_name', fi.name,
                    'size', 'Regular', -- POS orders don't have sizes
                    'quantity', poi.quantity,
                    'revenue', poi.total_price
                )
            ) FILTER (WHERE fi.name IS NOT NULL),
            '[]'::jsonb
        ) as items_sold
    FROM pos_orders po
    LEFT JOIN pos_order_items poi ON po.id = poi.pos_order_id
    LEFT JOIN food_items fi ON poi.food_item_id = fi.id
    WHERE DATE(po.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(po.created_at)
    ORDER BY DATE(po.created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pos_sales_report(DATE, DATE) TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'POS sales report function fixed successfully!';
    RAISE NOTICE 'Removed problematic size_id reference from pos_order_items';
END $$;
