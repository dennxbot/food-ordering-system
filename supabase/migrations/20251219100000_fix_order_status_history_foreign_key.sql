-- Fix the foreign key relationship in order_status_history table
-- Drop the existing foreign key constraint
ALTER TABLE order_status_history DROP CONSTRAINT IF EXISTS order_status_history_changed_by_fkey;

-- Add the correct foreign key constraint to reference the public.users table
ALTER TABLE order_status_history 
ADD CONSTRAINT order_status_history_changed_by_fkey 
FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Update the RLS policies to work with the correct table reference
DROP POLICY IF EXISTS "Users can view their own order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can view all order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can insert order status history" ON order_status_history;
DROP POLICY IF EXISTS "Admins can update order status history" ON order_status_history;

-- Recreate RLS policies with correct table references
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
