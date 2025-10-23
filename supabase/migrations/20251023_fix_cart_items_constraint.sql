-- Fix cart_items unique constraint to include size_id
-- This allows the same food item with different sizes to be added to cart

-- First, drop the existing constraint that only considers user_id and food_item_id
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_food_item_id_key;

-- Create a new unique constraint that includes size_id
-- This allows different sizes of the same item to coexist in the cart
ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_food_item_id_size_id_key 
    UNIQUE (user_id, food_item_id, size_id);

-- Add a comment to explain the constraint
COMMENT ON CONSTRAINT cart_items_user_id_food_item_id_size_id_key ON cart_items IS 
    'Ensures each user can have only one cart entry per food item and size combination';