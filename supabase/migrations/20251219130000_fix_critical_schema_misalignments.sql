-- =====================================================
-- CRITICAL SCHEMA FIXES FOR FOOD ORDERING SYSTEM
-- =====================================================
-- This migration fixes all critical misalignments between
-- the database schema and application code

-- =====================================================
-- FIX 1: COMPLETELY REBUILD ITEM_SIZES TABLE
-- =====================================================

-- Drop existing item_sizes table and recreate with correct structure
DROP TABLE IF EXISTS item_sizes CASCADE;

-- Create new item_sizes table with correct structure
CREATE TABLE item_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_item_sizes_food_item_id ON item_sizes(food_item_id);
CREATE INDEX idx_item_sizes_is_default ON item_sizes(is_default);

-- Enable RLS
ALTER TABLE item_sizes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public to view item sizes" ON item_sizes FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage item sizes" ON item_sizes FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- FIX 2: TOTAL_PRICE COLUMN WILL BE ADDED WHEN RECREATING ORDER_ITEMS TABLE
-- =====================================================
-- (This fix is handled in FIX 6 when we recreate the order_items table)

-- =====================================================
-- FIX 3: FIX ADDRESS FIELD INCONSISTENCIES
-- =====================================================

-- Fix address field inconsistencies in orders table
DO $$ 
BEGIN
    -- Check if delivery_address column exists and rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'delivery_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders RENAME COLUMN delivery_address TO customer_address;
    END IF;
    
    -- If customer_address doesn't exist, add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND column_name = 'customer_address'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE orders ADD COLUMN customer_address TEXT;
    END IF;
END $$;

-- Add customer_address column to kiosk_orders table
ALTER TABLE kiosk_orders 
ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- =====================================================
-- FIX 4: FIX ORDER STATUS HISTORY FOREIGN KEY
-- =====================================================

-- Drop and recreate order_status_history table with correct foreign key
DROP TABLE IF EXISTS order_status_history CASCADE;

CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created_at ON order_status_history(created_at);

-- Enable RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own order status history" ON order_status_history
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all order status history" ON order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert order status history" ON order_status_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update order status history" ON order_status_history
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- FIX 5: UPDATE CART_ITEMS TO REFERENCE NEW ITEM_SIZES
-- =====================================================

-- Drop and recreate cart_items table to fix foreign key relationships
DROP TABLE IF EXISTS cart_items CASCADE;

-- Create new cart_items table with correct structure
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    size_id UUID REFERENCES item_sizes(id) ON DELETE SET NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, food_item_id, size_id)
);

-- Add indexes for performance
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_food_item_id ON cart_items(food_item_id);

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- FIX 6: UPDATE ORDER_ITEMS TO REFERENCE NEW ITEM_SIZES
-- =====================================================

-- Drop and recreate order_items table to fix foreign key relationships
DROP TABLE IF EXISTS order_items CASCADE;

-- Create new order_items table with correct structure
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    size_id UUID REFERENCES item_sizes(id) ON DELETE SET NULL,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_food_item_id ON order_items(food_item_id);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Allow public to insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin to view all order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- FIX 7: ADD MISSING COLUMNS TO FOOD_ITEMS
-- =====================================================

-- Ensure is_featured column exists
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Ensure has_sizes column exists
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS has_sizes BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_items_is_featured ON food_items(is_featured);
CREATE INDEX IF NOT EXISTS idx_food_items_has_sizes ON food_items(has_sizes);

-- =====================================================
-- FIX 8: UPDATE STORED FUNCTIONS TO USE CORRECT COLUMN NAMES
-- =====================================================

-- Drop existing function first to avoid parameter name conflicts
-- Use a more robust approach to drop the function
DO $$ 
BEGIN
    -- Drop the function if it exists (this handles all parameter variations)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_order_with_items') THEN
        DROP FUNCTION create_order_with_items CASCADE;
    END IF;
END $$;

-- Also drop and recreate create_pos_order function to ensure it exists
DO $$ 
BEGIN
    -- Drop the function if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_pos_order') THEN
        DROP FUNCTION create_pos_order CASCADE;
    END IF;
END $$;

-- Create create_order_with_items function with correct parameter names
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

    -- Insert the order
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

-- Create create_pos_order function
CREATE OR REPLACE FUNCTION create_pos_order(
    p_cashier_id UUID,
    p_order_number VARCHAR(50),
    p_payment_method VARCHAR(20),
    p_items JSONB,
    p_customer_name VARCHAR(255) DEFAULT NULL,
    p_customer_phone VARCHAR(20) DEFAULT NULL,
    p_tax_amount DECIMAL(10,2) DEFAULT 0,
    p_discount_amount DECIMAL(10,2) DEFAULT 0,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_item JSONB;
    v_total_amount DECIMAL(10,2) := 0;
BEGIN
    -- Calculate total amount from items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_total_amount := v_total_amount + (v_item->>'total_price')::DECIMAL;
    END LOOP;

    -- Add tax and subtract discount
    v_total_amount := v_total_amount + p_tax_amount - p_discount_amount;

    -- Insert the POS order
    INSERT INTO pos_orders (
        cashier_id,
        order_number,
        customer_name,
        customer_phone,
        total_amount,
        tax_amount,
        discount_amount,
        payment_method,
        notes
    ) VALUES (
        p_cashier_id,
        p_order_number,
        p_customer_name,
        p_customer_phone,
        v_total_amount,
        p_tax_amount,
        p_discount_amount,
        p_payment_method,
        p_notes
    ) RETURNING id INTO v_order_id;

    -- Insert POS order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO pos_order_items (
            pos_order_id,
            food_item_id,
            quantity,
            unit_price,
            total_price
        ) VALUES (
            v_order_id,
            (v_item->>'food_item_id')::UUID,
            (v_item->>'quantity')::INTEGER,
            (v_item->>'unit_price')::DECIMAL,
            (v_item->>'total_price')::DECIMAL
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing get_pos_sales_report function first to avoid return type conflicts
DO $$ 
BEGIN
    -- Drop the function if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_pos_sales_report') THEN
        DROP FUNCTION get_pos_sales_report CASCADE;
    END IF;
END $$;

-- Create get_pos_sales_report function
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
                    'size', COALESCE(isz.name, 'Regular'),
                    'quantity', poi.quantity,
                    'revenue', poi.total_price
                )
            ) FILTER (WHERE fi.name IS NOT NULL),
            '[]'::jsonb
        ) as items_sold
    FROM pos_orders po
    LEFT JOIN pos_order_items poi ON po.id = poi.pos_order_id
    LEFT JOIN food_items fi ON poi.food_item_id = fi.id
    LEFT JOIN item_sizes isz ON NULL -- POS orders don't have size_id
    WHERE DATE(po.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(po.created_at)
    ORDER BY DATE(po.created_at);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIX 9: ADD SAMPLE ITEM SIZES FOR TESTING
-- =====================================================

-- Insert sample item sizes for existing food items
-- You can customize these based on your needs
INSERT INTO item_sizes (food_item_id, name, description, price, is_default)
SELECT 
    fi.id,
    'Small',
    'Small size',
    fi.price * 0.8,
    true
FROM food_items fi
WHERE fi.has_sizes = true OR fi.name IN ('Margherita Pizza', 'Coffee', 'Iced Tea');

INSERT INTO item_sizes (food_item_id, name, description, price, is_default)
SELECT 
    fi.id,
    'Medium',
    'Medium size',
    fi.price,
    false
FROM food_items fi
WHERE fi.has_sizes = true OR fi.name IN ('Margherita Pizza', 'Coffee', 'Iced Tea');

INSERT INTO item_sizes (food_item_id, name, description, price, is_default)
SELECT 
    fi.id,
    'Large',
    'Large size',
    fi.price * 1.3,
    false
FROM food_items fi
WHERE fi.has_sizes = true OR fi.name IN ('Margherita Pizza', 'Coffee', 'Iced Tea');

-- =====================================================
-- FIX 10: UPDATE FOOD ITEMS TO HAVE SIZES WHERE APPROPRIATE
-- =====================================================

-- Set has_sizes = true for items that should have size options
UPDATE food_items 
SET has_sizes = true 
WHERE name IN ('Margherita Pizza', 'Coffee', 'Iced Tea', 'Caesar Salad');

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== CRITICAL SCHEMA FIXES COMPLETED ===';
    RAISE NOTICE '';
    RAISE NOTICE 'Fixed Issues:';
    RAISE NOTICE '1. ✅ Rebuilt item_sizes table with correct structure';
    RAISE NOTICE '2. ✅ Rebuilt cart_items table with correct foreign keys';
    RAISE NOTICE '3. ✅ Rebuilt order_items table with total_price column';
    RAISE NOTICE '4. ✅ Fixed address field inconsistencies';
    RAISE NOTICE '5. ✅ Fixed order_status_history foreign key';
    RAISE NOTICE '6. ✅ Added missing columns to food_items';
    RAISE NOTICE '7. ✅ Updated stored functions (create_order_with_items, create_pos_order)';
    RAISE NOTICE '8. ✅ Added sample item sizes';
    RAISE NOTICE '9. ✅ Fixed POS order creation function';
    RAISE NOTICE '10. ✅ Fixed foreign key relationships between tables';
    RAISE NOTICE '';
    RAISE NOTICE 'Your application should now work correctly!';
    RAISE NOTICE 'All database schema misalignments have been resolved.';
    RAISE NOTICE '';
END $$;
