-- Function to set user context for RLS
CREATE OR REPLACE FUNCTION set_user_context(user_id UUID, user_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store the user role in a session variable
  PERFORM set_config('app.user_role', user_role, true);
  -- Store the user ID in a session variable
  PERFORM set_config('app.user_id', user_id::text, true);
END;
$$;
