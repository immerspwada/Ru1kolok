-- Fix RLS policies for coaches table
-- Allow coaches to read their own data

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Coaches can view own profile" ON coaches;

-- Create new policy that allows coaches to view their own profile
CREATE POLICY "Coaches can view own profile"
  ON coaches FOR SELECT
  USING (auth.uid() = user_id);

-- Also allow coaches to update their own profile
DROP POLICY IF EXISTS "Coaches can update own profile" ON coaches;

CREATE POLICY "Coaches can update own profile"
  ON coaches FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow coaches to view athletes in their club
DROP POLICY IF EXISTS "Coaches can view athletes in their club" ON athletes;

CREATE POLICY "Coaches can view athletes in their club"
  ON athletes FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('coaches', 'athletes')
ORDER BY tablename, policyname;
