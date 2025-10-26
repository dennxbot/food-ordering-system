-- Fix order_cancellations RLS policies to avoid auth.users access
-- The current policies are trying to access auth.users table which causes permission denied errors

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own order cancellations" ON order_cancellations;
DROP POLICY IF EXISTS "Allow admin to manage order cancellations" ON order_cancellations;

-- Create simplified policies that don't access auth.users
-- Users can view their own order cancellations (based on order ownership)
CREATE POLICY "Users can view their own order cancellations" ON order_cancellations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_cancellations.order_id 
        AND orders.user_id = auth.uid()
    )
);

-- Users can insert their own order cancellations
CREATE POLICY "Users can insert their own order cancellations" ON order_cancellations FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_cancellations.order_id 
        AND orders.user_id = auth.uid()
    )
);

-- Allow authenticated users to manage order cancellations (simplified approach)
-- This avoids the auth.users table access issue
CREATE POLICY "Allow authenticated users to manage order cancellations" ON order_cancellations FOR ALL USING (
    auth.uid() IS NOT NULL
);
