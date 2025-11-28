-- Fix Admin Create User Policies
-- Allow admins to create profiles, user_roles, and athletes for other users

-- ============================================================================
-- PROFILES POLICIES - Add admin insert policy
-- ============================================================================

-- Drop existing insert policy if it conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;

-- Recreate policies
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert any profile"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================================================
-- USER_ROLES POLICIES - Already has admin insert policy
-- ============================================================================
-- No changes needed - already has "Admins can insert roles" policy

-- ============================================================================
-- ATHLETES POLICIES - Add if not exists
-- ============================================================================

-- Check if athletes table has RLS enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'athletes'
  ) THEN
    RAISE NOTICE 'athletes table does not exist, skipping';
  ELSE
    -- Enable RLS if not already enabled
    ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Athletes can view their own record" ON athletes;
    DROP POLICY IF EXISTS "Coaches can view athletes in their club" ON athletes;
    DROP POLICY IF EXISTS "Admins can view all athletes" ON athletes;
    DROP POLICY IF EXISTS "Admins can insert athletes" ON athletes;
    DROP POLICY IF EXISTS "Admins can update athletes" ON athletes;
    DROP POLICY IF EXISTS "Athletes can update their own record" ON athletes;
    
    -- Create policies
    CREATE POLICY "Athletes can view their own record"
      ON athletes FOR SELECT
      USING (user_id = auth.uid());
    
    CREATE POLICY "Coaches can view athletes in their club"
      ON athletes FOR SELECT
      USING (
        public.is_coach() AND 
        club_id = public.get_user_club_id()
      );
    
    CREATE POLICY "Admins can view all athletes"
      ON athletes FOR SELECT
      USING (public.is_admin());
    
    CREATE POLICY "Admins can insert athletes"
      ON athletes FOR INSERT
      WITH CHECK (public.is_admin());
    
    CREATE POLICY "Admins can update athletes"
      ON athletes FOR UPDATE
      USING (public.is_admin());
    
    CREATE POLICY "Athletes can update their own record"
      ON athletes FOR UPDATE
      USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================================
-- Verify policies
-- ============================================================================

-- List all policies for profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'user_roles', 'athletes')
ORDER BY tablename, policyname;
