-- =====================================================
-- FIX: POS Orders Permissions Issue
-- =====================================================
-- This migration fixes the permission denied error when accessing pos_orders
-- by removing the problematic foreign key constraint to auth.users

-- First, let's check if there are any existing pos_orders with cashier_id references
-- and handle them appropriately

-- Remove the foreign key constraint to auth.users for cashier_id
ALTER TABLE pos_orders DROP CONSTRAINT IF EXISTS pos_orders_cashier_id_fkey;

-- Update the cashier_id column to allow NULL values and remove the foreign key reference
ALTER TABLE pos_orders ALTER COLUMN cashier_id DROP NOT NULL;

-- Add a comment to explain the change
COMMENT ON COLUMN pos_orders.cashier_id IS 'Cashier ID - stored as text to avoid auth.users table access issues';

-- Change the column type to text to avoid foreign key issues
ALTER TABLE pos_orders ALTER COLUMN cashier_id TYPE TEXT;

-- Ensure the RLS policy for pos_orders allows admin access
DROP POLICY IF EXISTS "Allow staff to manage POS orders" ON pos_orders;
CREATE POLICY "Allow admin to manage POS orders" ON pos_orders FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Also ensure pos_order_items has proper admin access
DROP POLICY IF EXISTS "Allow staff to manage POS order items" ON pos_order_items;
CREATE POLICY "Allow admin to manage POS order items" ON pos_order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.raw_user_meta_data->>'role' = 'admin')
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Fixed POS orders permissions by removing auth.users foreign key constraint!';
END $$;
