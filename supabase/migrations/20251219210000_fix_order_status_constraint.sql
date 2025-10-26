-- Fix order status constraint to include 'out_for_delivery' status
-- The frontend uses 'out_for_delivery' but the database constraint was missing it

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the updated constraint with all required statuses
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'));

-- Also fix kiosk_orders table if it has the same issue
ALTER TABLE kiosk_orders DROP CONSTRAINT IF EXISTS kiosk_orders_status_check;
ALTER TABLE kiosk_orders ADD CONSTRAINT kiosk_orders_status_check 
    CHECK (status IN ('pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'));

-- Update any existing orders that might have been stuck due to this constraint
-- (This is just a safety measure, shouldn't be needed)
UPDATE orders SET status = 'ready' WHERE status = 'out_for_delivery' AND order_type = 'pickup';
