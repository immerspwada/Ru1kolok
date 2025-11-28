-- Simple RLS for user_roles - no recursion
-- Just allow users to view their own role

-- Drop ALL existing policies on user_roles
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can do everything on user_roles" ON user_roles;

-- Create simple policy: users can view their own role
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Verify
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;
