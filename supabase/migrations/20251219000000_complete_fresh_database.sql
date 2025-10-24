-- =====================================================
-- COMPLETE FRESH DATABASE MIGRATION FOR FOOD ORDERING SYSTEM
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Item sizes table
CREATE TABLE item_sizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    multiplier DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food items table
CREATE TABLE food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT true,
    preparation_time INTEGER DEFAULT 15, -- in minutes
    ingredients TEXT[],
    allergens TEXT[],
    nutritional_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff', 'kiosk')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CART TABLES
-- =====================================================

-- Cart items table
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    size_id UUID REFERENCES item_sizes(id),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, food_item_id, size_id)
);

-- =====================================================
-- ORDER TABLES
-- =====================================================

-- Main orders table (for online orders)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
    order_type VARCHAR(20) DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery')),
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'online')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    order_source VARCHAR(20) DEFAULT 'online' CHECK (order_source IN ('online', 'kiosk', 'pos')),
    delivery_address TEXT,
    notes TEXT,
    estimated_ready_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    size_id UUID REFERENCES item_sizes(id),
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kiosk orders table (separate from main orders)
CREATE TABLE kiosk_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) DEFAULT 'N/A',
    customer_phone VARCHAR(20) DEFAULT 'N/A',
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')),
    order_type VARCHAR(20) DEFAULT 'pickup' CHECK (order_type IN ('pickup', 'delivery')),
    payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card')),
    notes TEXT,
    kiosk_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kiosk order items table
CREATE TABLE kiosk_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kiosk_order_id UUID REFERENCES kiosk_orders(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS orders table (for point of sale)
CREATE TABLE pos_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id UUID REFERENCES auth.users(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card', 'mobile')),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- POS order items table
CREATE TABLE pos_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pos_order_id UUID REFERENCES pos_orders(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order cancellations table
CREATE TABLE order_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    cancelled_by TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(order_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Food items indexes
CREATE INDEX idx_food_items_category_id ON food_items(category_id);
CREATE INDEX idx_food_items_is_available ON food_items(is_available);

-- Cart items indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_food_item_id ON cart_items(food_item_id);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_source ON orders(order_source);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_food_item_id ON order_items(food_item_id);

-- Kiosk orders indexes
CREATE INDEX idx_kiosk_orders_status ON kiosk_orders(status);
CREATE INDEX idx_kiosk_orders_created_at ON kiosk_orders(created_at);
CREATE INDEX idx_kiosk_order_items_kiosk_order_id ON kiosk_order_items(kiosk_order_id);
CREATE INDEX idx_kiosk_order_items_food_item_id ON kiosk_order_items(food_item_id);

-- POS orders indexes
CREATE INDEX idx_pos_orders_cashier_id ON pos_orders(cashier_id);
CREATE INDEX idx_pos_orders_created_at ON pos_orders(created_at);
CREATE INDEX idx_pos_orders_status ON pos_orders(status);
CREATE INDEX idx_pos_order_items_pos_order_id ON pos_order_items(pos_order_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE kiosk_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_cancellations ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Allow public to view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Item sizes policies
CREATE POLICY "Allow public to view item sizes" ON item_sizes FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage item sizes" ON item_sizes FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Food items policies
CREATE POLICY "Allow public to view available food items" ON food_items FOR SELECT USING (is_available = true);
CREATE POLICY "Allow admin to manage food items" ON food_items FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow admin to view all users" ON users FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Cart items policies
CREATE POLICY "Users can manage their own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow public to create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin to view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);
CREATE POLICY "Allow admin to update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Order items policies
CREATE POLICY "Users can view their own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Allow public to insert order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin to view all order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Kiosk orders policies
CREATE POLICY "Allow public to view kiosk orders" ON kiosk_orders FOR SELECT USING (true);
CREATE POLICY "Allow public to insert kiosk orders" ON kiosk_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin to update kiosk orders" ON kiosk_orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Kiosk order items policies
CREATE POLICY "Allow public to view kiosk order items" ON kiosk_order_items FOR SELECT USING (true);
CREATE POLICY "Allow public to insert kiosk order items" ON kiosk_order_items FOR INSERT WITH CHECK (true);

-- POS orders policies
CREATE POLICY "Allow staff to manage POS orders" ON pos_orders FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'staff'))
);

-- POS order items policies
CREATE POLICY "Allow staff to manage POS order items" ON pos_order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'staff'))
);

-- Order cancellations policies
CREATE POLICY "Users can view their own order cancellations" ON order_cancellations FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "Allow admin to manage order cancellations" ON order_cancellations FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- =====================================================
-- FUNCTIONS AND STORED PROCEDURES
-- =====================================================

-- Function to create order with items (for online orders)
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
            CASE WHEN v_item->>'size_id' != 'null' THEN (v_item->>'size_id')::UUID ELSE NULL END,
            v_item->>'special_instructions'
        );
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create kiosk order with items
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

-- Function to create POS order
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

-- Function to cancel order
CREATE OR REPLACE FUNCTION cancel_order(
    p_order_id UUID,
    p_reason TEXT,
    p_cancelled_by TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update order status
    UPDATE orders 
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = p_order_id;

    -- Insert cancellation record
    INSERT INTO order_cancellations (order_id, reason, cancelled_by)
    VALUES (p_order_id, p_reason, p_cancelled_by);

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert default item sizes
INSERT INTO item_sizes (name, multiplier) VALUES
('Small', 0.80),
('Medium', 1.00),
('Large', 1.30),
('Extra Large', 1.60);

-- Insert sample categories
INSERT INTO categories (name, description, is_active) VALUES
('Appetizers', 'Start your meal with our delicious appetizers', true),
('Main Courses', 'Hearty and satisfying main dishes', true),
('Desserts', 'Sweet treats to end your meal', true),
('Beverages', 'Refreshing drinks and hot beverages', true),
('Salads', 'Fresh and healthy salad options', true),
('Soups', 'Warm and comforting soups', true);

-- Insert sample food items
INSERT INTO food_items (name, description, price, category_id, is_available, preparation_time) VALUES
('Caesar Salad', 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan cheese', 12.99, (SELECT id FROM categories WHERE name = 'Salads'), true, 10),
('Grilled Chicken Breast', 'Tender grilled chicken breast with herbs and spices', 18.99, (SELECT id FROM categories WHERE name = 'Main Courses'), true, 25),
('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and fresh basil', 16.99, (SELECT id FROM categories WHERE name = 'Main Courses'), true, 20),
('Chocolate Cake', 'Rich chocolate cake with chocolate frosting', 8.99, (SELECT id FROM categories WHERE name = 'Desserts'), true, 5),
('Coffee', 'Freshly brewed coffee', 3.99, (SELECT id FROM categories WHERE name = 'Beverages'), true, 5),
('Tomato Soup', 'Creamy tomato soup with herbs', 7.99, (SELECT id FROM categories WHERE name = 'Soups'), true, 15),
('Garlic Bread', 'Toasted bread with garlic butter', 5.99, (SELECT id FROM categories WHERE name = 'Appetizers'), true, 8),
('Iced Tea', 'Refreshing iced tea with lemon', 2.99, (SELECT id FROM categories WHERE name = 'Beverages'), true, 3);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kiosk_orders_updated_at BEFORE UPDATE ON kiosk_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pos_orders_updated_at BEFORE UPDATE ON pos_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Fresh database migration completed successfully!';
    RAISE NOTICE 'Created tables: categories, item_sizes, food_items, users, cart_items, orders, order_items, kiosk_orders, kiosk_order_items, pos_orders, pos_order_items, order_cancellations';
    RAISE NOTICE 'Created functions: create_order_with_items, create_kiosk_order, create_pos_order, cancel_order';
    RAISE NOTICE 'Inserted sample data for categories, item_sizes, and food_items';
    RAISE NOTICE 'All RLS policies and indexes have been created';
END $$;