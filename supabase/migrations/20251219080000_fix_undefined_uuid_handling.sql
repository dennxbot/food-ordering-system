-- Fix UUID handling in create_order_with_items function to handle 'undefined' strings
CREATE OR REPLACE FUNCTION create_order_with_items(
    p_customer_name VARCHAR(255),
    p_order_items JSONB,
    p_user_id UUID DEFAULT NULL,
    p_customer_email VARCHAR(255) DEFAULT NULL,
    p_customer_phone VARCHAR(20) DEFAULT NULL,
    p_order_type VARCHAR(20) DEFAULT 'pickup',
    p_payment_method VARCHAR(20) DEFAULT 'cash',
    p_delivery_address TEXT DEFAULT NULL,
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

    -- Insert the order
    INSERT INTO orders (
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        total_amount,
        order_type,
        payment_method,
        delivery_address,
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
        p_delivery_address,
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
            size_id,
            special_instructions
        ) VALUES (
            v_order_id,
            (v_item->>'food_item_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL,
            CASE 
                WHEN v_item->>'size_id' IS NULL OR v_item->>'size_id' = 'null' OR v_item->>'size_id' = 'undefined' OR v_item->>'size_id' = '' 
                THEN NULL 
                ELSE (v_item->>'size_id')::UUID 
            END,
            v_item->>'special_instructions'
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix the create_kiosk_order function
CREATE OR REPLACE FUNCTION create_kiosk_order(
    p_customer_name VARCHAR(255),
    p_items JSONB,
    p_customer_email VARCHAR(255) DEFAULT 'N/A',
    p_customer_phone VARCHAR(20) DEFAULT 'N/A',
    p_order_type VARCHAR(20) DEFAULT 'pickup',
    p_payment_method VARCHAR(20) DEFAULT 'cash',
    p_notes TEXT DEFAULT NULL,
    p_kiosk_id VARCHAR(50) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_total_amount DECIMAL(10,2) := 0;
BEGIN
    -- Calculate total amount from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_amount := v_total_amount + (v_item->>'quantity')::INTEGER * (v_item->>'unit_price')::DECIMAL;
    END LOOP;

    -- Insert the kiosk order
    INSERT INTO kiosk_orders (
        customer_name,
        customer_email,
        customer_phone,
        total_amount,
        order_type,
        payment_method,
        notes,
        kiosk_id
    ) VALUES (
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        v_total_amount,
        p_order_type,
        p_payment_method,
        p_notes,
        p_kiosk_id
    ) RETURNING id INTO v_order_id;

    -- Insert kiosk order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO kiosk_order_items (
            kiosk_order_id,
            food_item_id,
            quantity,
            unit_price
        ) VALUES (
            v_order_id,
            (v_item->>'food_item_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
