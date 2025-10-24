-- =====================================================
-- RESTORE SAMPLE DATA FOR FOOD ORDERING SYSTEM
-- =====================================================
-- This script restores essential data that the application needs to function properly
-- Run this if you've emptied the database tables and the system is stuck loading

-- Insert default item sizes (REQUIRED for the system to work)
INSERT INTO item_sizes (name, multiplier) VALUES
('Small', 0.80),
('Medium', 1.00),
('Large', 1.30),
('Extra Large', 1.60)
ON CONFLICT (name) DO NOTHING;

-- Insert sample categories (REQUIRED - without categories, menu won't load)
INSERT INTO categories (name, description, is_active) VALUES
('Appetizers', 'Start your meal with our delicious appetizers', true),
('Main Courses', 'Hearty and satisfying main dishes', true),
('Desserts', 'Sweet treats to end your meal', true),
('Beverages', 'Refreshing drinks and hot beverages', true),
('Salads', 'Fresh and healthy salad options', true),
('Soups', 'Warm and comforting soups', true)
ON CONFLICT (name) DO NOTHING;

-- Insert sample food items (REQUIRED - without food items, menu will be empty)
INSERT INTO food_items (name, description, price, category_id, is_available, preparation_time) VALUES
('Caesar Salad', 'Fresh romaine lettuce with caesar dressing, croutons, and parmesan cheese', 12.99, (SELECT id FROM categories WHERE name = 'Salads'), true, 10),
('Grilled Chicken Breast', 'Tender grilled chicken breast with herbs and spices', 18.99, (SELECT id FROM categories WHERE name = 'Main Courses'), true, 25),
('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and fresh basil', 16.99, (SELECT id FROM categories WHERE name = 'Main Courses'), true, 20),
('Chocolate Cake', 'Rich chocolate cake with chocolate frosting', 8.99, (SELECT id FROM categories WHERE name = 'Desserts'), true, 5),
('Coffee', 'Freshly brewed coffee', 3.99, (SELECT id FROM categories WHERE name = 'Beverages'), true, 5),
('Tomato Soup', 'Creamy tomato soup with herbs', 7.99, (SELECT id FROM categories WHERE name = 'Soups'), true, 15),
('Garlic Bread', 'Toasted bread with garlic butter', 5.99, (SELECT id FROM categories WHERE name = 'Appetizers'), true, 8),
('Iced Tea', 'Refreshing iced tea with lemon', 2.99, (SELECT id FROM categories WHERE name = 'Beverages'), true, 3),
('Beef Burger', 'Juicy beef patty with lettuce, tomato, and cheese', 14.99, (SELECT id FROM categories WHERE name = 'Main Courses'), true, 15),
('Chicken Wings', 'Spicy buffalo chicken wings with ranch dip', 11.99, (SELECT id FROM categories WHERE name = 'Appetizers'), true, 18),
('Greek Salad', 'Fresh vegetables with feta cheese and olive oil', 10.99, (SELECT id FROM categories WHERE name = 'Salads'), true, 8),
('Tiramisu', 'Classic Italian dessert with coffee and mascarpone', 7.99, (SELECT id FROM categories WHERE name = 'Desserts'), true, 5)
ON CONFLICT (name) DO NOTHING;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Sample data restoration completed!';
    RAISE NOTICE 'Restored: % categories, % item sizes, % food items', 
        (SELECT COUNT(*) FROM categories),
        (SELECT COUNT(*) FROM item_sizes),
        (SELECT COUNT(*) FROM food_items);
    RAISE NOTICE 'Your application should now load properly without getting stuck.';
END $$;