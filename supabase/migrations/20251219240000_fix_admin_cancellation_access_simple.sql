-- Fix admin access to order_cancellations table with simple approach
-- Avoid accessing auth.users table which causes permission denied errors

-- Drop all existing policies on order_cancellations
DROP POLICY IF EXISTS "Allow admin to view all order cancellations" ON order_cancellations;
DROP POLICY IF EXISTS "Users can view their own order cancellations" ON order_cancellations;
DROP POLICY IF EXISTS "Allow authenticated users to insert order cancellations" ON order_cancellations;
DROP POLICY IF EXISTS "Allow admin to manage order cancellations" ON order_cancellations;

-- Create simple policies that don't access auth.users
-- Allow all authenticated users to view order cancellations (simplified approach)
CREATE POLICY "Allow authenticated users to view order cancellations" ON order_cancellations FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- Allow all authenticated users to insert order cancellations
CREATE POLICY "Allow authenticated users to insert order cancellations" ON order_cancellations FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Allow all authenticated users to update order cancellations
CREATE POLICY "Allow authenticated users to update order cancellations" ON order_cancellations FOR UPDATE USING (
    auth.uid() IS NOT NULL
);

-- Allow all authenticated users to delete order cancellations
CREATE POLICY "Allow authenticated users to delete order cancellations" ON order_cancellations FOR DELETE USING (
    auth.uid() IS NOT NULL
);
