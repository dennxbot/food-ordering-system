-- =====================================================
-- ADD IS_FEATURED COLUMN TO FOOD_ITEMS TABLE
-- =====================================================
-- This migration adds the missing is_featured column that the application expects

-- Add is_featured column to food_items table
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Update existing items to set some as featured (optional)
-- You can customize this based on your needs
UPDATE food_items 
SET is_featured = true 
WHERE name IN ('Caesar Salad', 'Margherita Pizza', 'Chocolate Cake');

-- Add index for better performance on featured items queries
CREATE INDEX IF NOT EXISTS idx_food_items_is_featured ON food_items(is_featured);

-- Update the RLS policy to include is_featured in the select policy
DROP POLICY IF EXISTS "Allow public to view available food items" ON food_items;
CREATE POLICY "Allow public to view available food items" ON food_items 
FOR SELECT USING (is_available = true);