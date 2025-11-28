-- Fix RLS for user_roles table
-- Allow users to read their own role

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;

-- Create policy for users to view their own role
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for admins to manage all roles
CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Verify
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;
