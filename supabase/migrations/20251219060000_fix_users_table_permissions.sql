-- =====================================================
-- FIX USERS TABLE RLS POLICIES
-- =====================================================
-- This migration fixes the users table RLS policies to allow proper access

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Allow admin to view all users" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Allow admin to manage all users" ON users;

-- Create new policies with proper logic
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON users 
FOR SELECT USING (auth.uid() = id);

-- Allow admin users to view all users (using the users table role, not auth metadata)
CREATE POLICY "Allow admin to view all users" ON users 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users admin_user 
        WHERE admin_user.id = auth.uid() 
        AND admin_user.role = 'admin'
    )
);

-- Allow users to insert their own profile during registration
CREATE POLICY "Allow user registration" ON users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON users 
FOR UPDATE USING (auth.uid() = id);

-- Allow admin users to manage all users
CREATE POLICY "Allow admin to manage all users" ON users 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users admin_user 
        WHERE admin_user.id = auth.uid() 
        AND admin_user.role = 'admin'
    )
);