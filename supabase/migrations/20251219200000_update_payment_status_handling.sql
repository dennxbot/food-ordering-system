-- Update create_order_with_items function to properly set payment_status
-- This ensures cash orders are marked as 'pending' payment and card orders as 'paid'

CREATE OR REPLACE FUNCTION create_order_with_items(
    p_customer_name VARCHAR(255),
    p_order_items JSONB,
    p_user_id UUID DEFAULT NULL,
    p_customer_email VARCHAR(255) DEFAULT NULL,
    p_customer_phone VARCHAR(20) DEFAULT NULL,
    p_order_type VARCHAR(20) DEFAULT 'pickup',
    p_payment_method VARCHAR(20) DEFAULT 'cash',
    p_customer_address TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_order_source VARCHAR(20) DEFAULT 'online'
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_total_amount DECIMAL(10,2) := 0;
BEGIN
    -- Calculate total amount from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        v_total_amount := v_total_amount + (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL;
    END LOOP;

    -- Insert the order with proper payment status
    INSERT INTO orders (
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        total_amount,
        order_type,
        payment_method,
        payment_status,
        customer_address,
        notes,
        order_source
    ) VALUES (
        p_user_id,
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        v_total_amount,
        p_order_type,
        p_payment_method,
        CASE 
            WHEN p_payment_method = 'cash' THEN 'pending'
            WHEN p_payment_method = 'card' THEN 'paid'
            ELSE 'pending'
        END,
        p_customer_address,
        p_notes,
        p_order_source
    ) RETURNING id INTO v_order_id;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
        INSERT INTO order_items (
            order_id,
            food_item_id,
            quantity,
            unit_price,
            total_price,
            size_id,
            special_instructions
        ) VALUES (
            v_order_id,
            (v_item->>'food_item_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL,
            CASE WHEN v_item->>'size_id' != 'null' THEN (v_item->>'size_id')::UUID ELSE NULL END,
            v_item->>'special_instructions'
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to update payment status when payment is received
CREATE OR REPLACE FUNCTION update_payment_status(
    p_order_id UUID,
    p_payment_status VARCHAR(20)
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validate payment status
    IF p_payment_status NOT IN ('pending', 'paid', 'failed', 'refunded') THEN
        RAISE EXCEPTION 'Invalid payment status: %', p_payment_status;
    END IF;

    -- Update the order
    UPDATE orders 
    SET 
        payment_status = p_payment_status,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Check if any rows were updated
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RAISE EXCEPTION 'Order not found: %', p_order_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_payment_status(UUID, VARCHAR(20)) TO authenticated;
