-- Fix admin access to order_cancellations table
-- Ensure admins can view all cancellation details

-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can view their own order cancellations" ON order_cancellations;
DROP POLICY IF EXISTS "Allow authenticated users to manage order cancellations" ON order_cancellations;

-- Create a comprehensive policy for admins to access all order cancellations
CREATE POLICY "Allow admin to view all order cancellations" ON order_cancellations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Allow users to view their own order cancellations
CREATE POLICY "Users can view their own order cancellations" ON order_cancellations FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_cancellations.order_id 
        AND orders.user_id = auth.uid()
    )
);

-- Allow authenticated users to insert order cancellations
CREATE POLICY "Allow authenticated users to insert order cancellations" ON order_cancellations FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Allow admins to manage all order cancellations
CREATE POLICY "Allow admin to manage order cancellations" ON order_cancellations FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);
