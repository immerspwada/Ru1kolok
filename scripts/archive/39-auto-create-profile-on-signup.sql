-- Migration: Auto-create profile on user signup
-- Description: Creates a database trigger that automatically creates a basic profile
--              when a new user signs up via Supabase Auth
-- Date: 2024-11-23

-- ============================================================================
-- Function: Create basic profile for new users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a basic profile for the new user
  INSERT INTO public.profiles (
    user_id,
    full_name,
    membership_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), -- Use email as fallback
    NULL, -- membership_status is NULL until they apply
    NOW(),
    NOW()
  );

  -- Insert default user role as 'athlete'
  INSERT INTO public.user_roles (
    user_id,
    role
  )
  VALUES (
    NEW.id,
    'athlete' -- Default role for new signups
  )
  ON CONFLICT (user_id) DO NOTHING; -- Prevent duplicate if role already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger: Auto-create profile on auth.users insert
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Verification
-- ============================================================================

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
  AND routine_schema = 'public';

COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates a basic profile and user_role when a new user signs up via Supabase Auth. 
The profile starts with membership_status = NULL (not yet applied for membership).';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Triggers handle_new_user() function to create profile and user_role for new signups.';
