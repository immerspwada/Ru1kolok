-- Add missing RLS policies for auth-database-integration
-- Requirements: 4.3, 10.3 - RLS policies must be active and correct

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can view athletes in their club" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow coaches to view profiles of athletes in their club
CREATE POLICY "Coaches can view athletes in their club"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN profiles coach_profile ON coach_profile.id = ur.user_id
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'coach'
    AND coach_profile.club_id = profiles.club_id
  )
);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- ============================================
-- USER_ROLES TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert any user role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update any user role" ON user_roles;

-- Allow service role to insert user roles (for registration)
CREATE POLICY "Service role can insert user roles"
ON user_roles FOR INSERT
WITH CHECK (true);

-- Allow users to insert their own role (for registration)
CREATE POLICY "Users can insert own role"
ON user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow admins to insert any user role
CREATE POLICY "Admins can insert any user role"
ON user_roles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to view all roles
CREATE POLICY "Admins can view all roles"
ON user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow admins to update any user role
CREATE POLICY "Admins can update any user role"
ON user_roles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Verify all policies are created
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_roles', 'login_sessions')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;
