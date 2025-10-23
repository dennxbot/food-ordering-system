-- Add kiosk role to the users table
-- This migration adds the 'kiosk' role option to the existing role enum

-- First, add the new role to the enum type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'kiosk';

-- Update the check constraint to include the new role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin', 'kiosk'));

-- Create a sample kiosk user for testing (optional)
-- Password: kiosk123 (you should change this in production)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'kiosk@foodordering.com',
  crypt('kiosk123', gen_salt('bf')),
  now(),
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Insert corresponding user profile
INSERT INTO users (id, email, full_name, role)
SELECT 
  id,
  'kiosk@foodordering.com',
  'Kiosk User',
  'kiosk'
FROM auth.users 
WHERE email = 'kiosk@foodordering.com'
ON CONFLICT (email) DO NOTHING;