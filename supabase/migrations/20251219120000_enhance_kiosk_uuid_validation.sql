-- Enhance UUID validation in create_kiosk_order function
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
    v_food_item_id UUID;
    v_size_id UUID;
BEGIN
    -- Validate required parameters
    IF p_customer_name IS NULL OR TRIM(p_customer_name) = '' THEN
        RAISE EXCEPTION 'Customer name is required';
    END IF;
    
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order items are required';
    END IF;

    -- Calculate total amount from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Validate food_item_id
        v_food_item_id := NULL;
        IF v_item->>'food_item_id' IS NOT NULL AND v_item->>'food_item_id' != 'null' AND v_item->>'food_item_id' != 'undefined' THEN
            BEGIN
                v_food_item_id := (v_item->>'food_item_id')::UUID;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Invalid food_item_id: %', v_item->>'food_item_id';
            END;
        END IF;
        
        IF v_food_item_id IS NULL THEN
            RAISE EXCEPTION 'Valid food_item_id is required for all items';
        END IF;
        
        -- Validate size_id
        v_size_id := NULL;
        IF v_item->>'size_id' IS NOT NULL AND v_item->>'size_id' != 'null' AND v_item->>'size_id' != 'undefined' THEN
            BEGIN
                v_size_id := (v_item->>'size_id')::UUID;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Invalid size_id: %', v_item->>'size_id';
            END;
        END IF;
        
        -- Validate quantity
        IF (v_item->>'quantity')::INTEGER IS NULL OR (v_item->>'quantity')::INTEGER <= 0 THEN
            RAISE EXCEPTION 'Valid quantity is required for all items';
        END IF;
        
        -- Validate unit_price
        IF (v_item->>'unit_price')::DECIMAL IS NULL OR (v_item->>'unit_price')::DECIMAL <= 0 THEN
            RAISE EXCEPTION 'Valid unit_price is required for all items';
        END IF;
        
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
        -- Re-validate and get the IDs
        v_food_item_id := (v_item->>'food_item_id')::UUID;
        v_size_id := NULL;
        IF v_item->>'size_id' IS NOT NULL AND v_item->>'size_id' != 'null' AND v_item->>'size_id' != 'undefined' THEN
            v_size_id := (v_item->>'size_id')::UUID;
        END IF;
        
        INSERT INTO kiosk_order_items (
            kiosk_order_id,
            food_item_id,
            quantity,
            unit_price,
            size_id
        ) VALUES (
            v_order_id,
            v_food_item_id,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL,
            v_size_id
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
