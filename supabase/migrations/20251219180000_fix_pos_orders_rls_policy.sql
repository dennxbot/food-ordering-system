-- =====================================================
-- FIX: POS Orders RLS Policy - Remove auth.users Access
-- =====================================================
-- This migration fixes the RLS policy for pos_orders to not access auth.users table

-- Drop the problematic policy that accesses auth.users
DROP POLICY IF EXISTS "Allow admin to manage POS orders" ON pos_orders;
DROP POLICY IF EXISTS "Allow staff to manage POS orders" ON pos_orders;

-- Create a simple policy that allows admin access without accessing auth.users
-- We'll use a different approach - allow access for authenticated users
-- and rely on application-level admin checks
CREATE POLICY "Allow authenticated users to access POS orders" ON pos_orders FOR ALL USING (
    auth.uid() IS NOT NULL
);

-- Also fix pos_order_items policy
DROP POLICY IF EXISTS "Allow admin to manage POS order items" ON pos_order_items;
DROP POLICY IF EXISTS "Allow staff to manage POS order items" ON pos_order_items;

CREATE POLICY "Allow authenticated users to access POS order items" ON pos_order_items FOR ALL USING (
    auth.uid() IS NOT NULL
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed POS orders RLS policies to not access auth.users table!';
END $$;
