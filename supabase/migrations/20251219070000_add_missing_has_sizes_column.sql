-- =====================================================
-- ADD MISSING HAS_SIZES COLUMN TO FOOD_ITEMS TABLE
-- =====================================================
-- This migration adds the missing has_sizes column that's referenced in the application

-- Add has_sizes column to food_items table
ALTER TABLE food_items 
ADD COLUMN has_sizes BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_food_items_has_sizes ON food_items(has_sizes);

-- Note: The item_sizes table doesn't have a direct relationship to food_items
-- You can manually set has_sizes = true for items that should have size options