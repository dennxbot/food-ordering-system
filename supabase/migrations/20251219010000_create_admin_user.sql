-- =====================================================
-- ADMIN USER SETUP INSTRUCTIONS
-- =====================================================

-- Function to set user as admin (to be called after user is created via Supabase Auth)
CREATE OR REPLACE FUNCTION set_user_as_admin(
    p_user_id UUID,
    p_full_name VARCHAR(255) DEFAULT 'System Administrator'
) RETURNS TEXT AS $$
DECLARE
    result_message TEXT;
BEGIN
    -- Insert or update user in users table with admin role
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        is_active
    ) 
    SELECT 
        p_user_id,
        au.email,
        p_full_name,
        'admin',
        true
    FROM auth.users au 
    WHERE au.id = p_user_id
    ON CONFLICT (id) 
    DO UPDATE SET 
        role = 'admin',
        full_name = EXCLUDED.full_name,
        is_active = true,
        updated_at = NOW();
    
    result_message := 'User with ID ' || p_user_id || ' has been set as admin successfully!';
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user as admin by email (easier to use)
CREATE OR REPLACE FUNCTION set_user_as_admin_by_email(
    p_email VARCHAR(255),
    p_full_name VARCHAR(255) DEFAULT 'System Administrator'
) RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    result_message TEXT;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN 'User with email ' || p_email || ' not found in auth.users. Please create the user first via Supabase Auth.';
    END IF;
    
    -- Insert or update user in users table with admin role
    INSERT INTO users (
        id,
        email,
        full_name,
        role,
        is_active
    ) VALUES (
        v_user_id,
        p_email,
        p_full_name,
        'admin',
        true
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        role = 'admin',
        full_name = EXCLUDED.full_name,
        is_active = true,
        updated_at = NOW();
    
    result_message := 'User ' || p_email || ' has been set as admin successfully!';
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION set_user_as_admin TO authenticated;
GRANT EXECUTE ON FUNCTION set_user_as_admin_by_email TO authenticated;

-- Create RLS policy to allow admin users to manage other users
DROP POLICY IF EXISTS "Allow admin to manage all users" ON users;
CREATE POLICY "Allow admin to manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users admin_user 
            WHERE admin_user.id = auth.uid() 
            AND admin_user.role = 'admin'
        )
    );

-- Instructions for creating admin user
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ADMIN USER SETUP INSTRUCTIONS ===';
    RAISE NOTICE '';
    RAISE NOTICE 'To create an admin user, follow these steps:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Go to your Supabase project dashboard';
    RAISE NOTICE '2. Navigate to Authentication > Users';
    RAISE NOTICE '3. Click "Add user" button';
    RAISE NOTICE '4. Enter email: admin@foodordering.com (or your preferred email)';
    RAISE NOTICE '5. Set a secure password';
    RAISE NOTICE '6. Click "Create user"';
    RAISE NOTICE '';
    RAISE NOTICE '7. After the user is created, run this SQL command in the SQL Editor:';
    RAISE NOTICE '   SELECT set_user_as_admin_by_email(''admin@foodordering.com'', ''System Administrator'');';
    RAISE NOTICE '';
    RAISE NOTICE 'Alternative: If you know the user ID, you can use:';
    RAISE NOTICE '   SELECT set_user_as_admin(''USER_ID_HERE'', ''Admin Name'');';
    RAISE NOTICE '';
    RAISE NOTICE 'The admin user will then have full access to:';
    RAISE NOTICE '- Manage all orders';
    RAISE NOTICE '- View admin dashboard';
    RAISE NOTICE '- Manage food items and categories';
    RAISE NOTICE '- Access POS system';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '- set_user_as_admin(user_id, full_name)';
    RAISE NOTICE '- set_user_as_admin_by_email(email, full_name)';
    RAISE NOTICE '';
END $$;