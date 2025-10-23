-- Add order_source field to orders table to distinguish between different order types
-- This migration adds the 'order_source' field to track whether orders come from online, kiosk, or POS

-- Add order_source column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_source TEXT NOT NULL DEFAULT 'online' 
CHECK (order_source IN ('online', 'kiosk', 'pos'));

-- Update existing orders to have 'online' as default source
UPDATE orders 
SET order_source = 'online' 
WHERE order_source IS NULL;

-- Add index for better query performance when filtering by order_source
CREATE INDEX IF NOT EXISTS idx_orders_order_source ON orders(order_source);

-- Add index for combined filtering by order_source and created_at
CREATE INDEX IF NOT EXISTS idx_orders_source_created_at ON orders(order_source, created_at DESC);

-- Update the create_order_with_items function to accept order_source parameter
CREATE OR REPLACE FUNCTION create_order_with_items(
    p_user_id UUID,
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_customer_address TEXT,
    p_order_type TEXT,
    p_payment_method TEXT,
    p_total_amount DECIMAL,
    p_order_items JSONB,
    p_order_source TEXT DEFAULT 'online'
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order orders;
    v_item record;
BEGIN
    -- Start transaction
    BEGIN
        -- Create order
        INSERT INTO orders (
            user_id,
            customer_name,
            customer_email,
            customer_phone,
            customer_address,
            order_type,
            payment_method,
            total_amount,
            order_source,
            status
        )
        VALUES (
            p_user_id,
            p_customer_name,
            p_customer_email,
            p_customer_phone,
            p_customer_address,
            p_order_type,
            p_payment_method,
            p_total_amount,
            p_order_source,
            'pending'
        )
        RETURNING * INTO v_order;

        -- Create order items
        FOR v_item IN 
            SELECT 
                value->>'food_item_id' as food_item_id,
                value->>'size_id' as size_id,
                (value->>'quantity')::INTEGER as quantity,
                (value->>'unit_price')::DECIMAL as unit_price,
                (value->>'total_price')::DECIMAL as total_price
            FROM jsonb_array_elements(p_order_items)
        LOOP
            INSERT INTO order_items (
                order_id,
                food_item_id,
                size_id,
                quantity,
                unit_price,
                total_price
            )
            VALUES (
                v_order.id,
                v_item.food_item_id::UUID,
                CASE WHEN v_item.size_id IS NOT NULL AND v_item.size_id != '' 
                     THEN v_item.size_id::UUID 
                     ELSE NULL END,
                v_item.quantity,
                v_item.unit_price,
                v_item.total_price
            );
        END LOOP;

        RETURN v_order;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Error creating order: %', SQLERRM;
    END;
END;
$$;