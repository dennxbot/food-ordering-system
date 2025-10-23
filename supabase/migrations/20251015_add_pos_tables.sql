-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pos_orders table
CREATE TABLE IF NOT EXISTS pos_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cashier_id TEXT NOT NULL, -- Changed from UUID with foreign key to TEXT
    order_number TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pos_order_items table
CREATE TABLE IF NOT EXISTS pos_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pos_order_id UUID NOT NULL REFERENCES pos_orders(id),
    food_item_id UUID NOT NULL REFERENCES food_items(id),
    size_id UUID REFERENCES item_sizes(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE pos_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_order_items ENABLE ROW LEVEL SECURITY;

-- Policies for pos_orders
CREATE POLICY "Admins can manage POS orders"
ON pos_orders
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
    )
);

-- Policies for pos_order_items
CREATE POLICY "Admins can manage POS order items"
ON pos_order_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.role = 'admin'
    )
);

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS create_pos_order(TEXT, TEXT, DECIMAL, JSONB);

-- Create function to create a POS order
CREATE OR REPLACE FUNCTION create_pos_order(
    p_cashier_id TEXT,
    p_payment_method TEXT,
    p_total_amount DECIMAL,
    p_order_items JSONB
)
RETURNS pos_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order pos_orders;
    v_item record;
BEGIN
    -- Start transaction
    BEGIN
        -- Create order
        INSERT INTO pos_orders (
            cashier_id,
            order_number,
            payment_method,
            total_amount
        )
        VALUES (
            p_cashier_id,
            'POS-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
            p_payment_method,
            p_total_amount
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
            FROM jsonb_array_elements(p_order_items) as items(value)
        LOOP
            INSERT INTO pos_order_items (
                pos_order_id,
                food_item_id,
                size_id,
                quantity,
                unit_price,
                total_price
            )
            VALUES (
                v_order.id,
                v_item.food_item_id::UUID,
                NULLIF(v_item.size_id, 'null')::UUID,
                v_item.quantity,
                v_item.unit_price,
                v_item.total_price
            );
        END LOOP;

        RETURN v_order;
    EXCEPTION
        WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create POS order: %', SQLERRM;
    END;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pos_orders_created_at ON pos_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_pos_orders_cashier_id ON pos_orders(cashier_id);
CREATE INDEX IF NOT EXISTS idx_pos_orders_status ON pos_orders(status);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_order_id ON pos_order_items(pos_order_id);
CREATE INDEX IF NOT EXISTS idx_pos_order_items_food_item_id ON pos_order_items(food_item_id);