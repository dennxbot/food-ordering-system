-- Drop existing function if it exists
DROP FUNCTION IF EXISTS cancel_order(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS cancel_order(UUID, TEXT, TEXT);

-- Create order_cancellations table
CREATE TABLE IF NOT EXISTS order_cancellations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    cancelled_by TEXT NOT NULL, -- Changed from UUID to TEXT to store user ID
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(order_id)
);

-- Add RLS policies for order_cancellations
ALTER TABLE order_cancellations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order cancellations"
ON order_cancellations
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_cancellations.order_id
        AND (orders.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        ))
    )
);

CREATE POLICY "Only admins and order owners can create cancellations"
ON order_cancellations
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_cancellations.order_id
        AND (orders.user_id = auth.uid() OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        ))
    )
);

-- Create function to handle order cancellation
CREATE OR REPLACE FUNCTION cancel_order(
    p_order_id UUID,
    p_reason TEXT,
    p_cancelled_by TEXT -- Changed from UUID to TEXT
)
RETURNS orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order orders;
    v_user_role text;
    v_user_id text; -- Changed from uuid to text
    v_cancellation_window interval = interval '15 minutes';
    v_daily_limit int = 3;
    v_cancellations_today int;
BEGIN
    -- Get current user info
    SELECT auth.users.role INTO v_user_role 
    FROM auth.users 
    WHERE auth.users.id = auth.uid();
    
    v_user_id := auth.uid()::text; -- Cast UUID to text

    -- Get the order
    SELECT * INTO v_order FROM orders WHERE id = p_order_id;
    
    -- Check if order exists
    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- For non-admin users, perform additional checks
    IF v_user_role != 'admin' THEN
        -- Check if user owns the order
        IF v_order.user_id != v_user_id THEN
            RAISE EXCEPTION 'Unauthorized to cancel this order';
        END IF;

        -- Check cancellation window
        IF v_order.created_at < NOW() - v_cancellation_window THEN
            RAISE EXCEPTION 'Cancellation window has expired';
        END IF;

        -- Check if status allows cancellation
        IF v_order.status NOT IN ('pending', 'preparing') THEN
            RAISE EXCEPTION 'Order cannot be cancelled in its current status';
        END IF;

        -- Check daily cancellation limit
        SELECT COUNT(*) INTO v_cancellations_today
        FROM orders
        WHERE user_id = v_user_id
        AND status = 'cancelled'
        AND DATE(created_at) = CURRENT_DATE;

        IF v_cancellations_today >= v_daily_limit THEN
            RAISE EXCEPTION 'Maximum daily cancellation limit reached';
        END IF;
    END IF;

    -- Begin transaction
    BEGIN
        -- Update order status
        UPDATE orders
        SET status = 'cancelled',
            updated_at = NOW()
        WHERE id = p_order_id
        RETURNING * INTO v_order;

        -- Create cancellation record
        INSERT INTO order_cancellations (order_id, cancelled_by, reason)
        VALUES (p_order_id, p_cancelled_by, p_reason);

        -- Add status history entry
        INSERT INTO order_status_history (
            order_id,
            status,
            changed_by,
            notes
        ) VALUES (
            p_order_id,
            'cancelled',
            p_cancelled_by::uuid, -- Cast TEXT back to UUID for order_status_history
            'Order cancelled - ' || p_reason
        );

        -- Return updated order
        RETURN v_order;
    EXCEPTION
        WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to cancel order: %', SQLERRM;
    END;
END;
$$;