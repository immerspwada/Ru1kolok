-- Fix clubs RLS policies to allow coaches and athletes to read their club
-- This fixes the "Cannot coerce the result to a single JSON object" error

-- Allow coaches to view their own club
DROP POLICY IF EXISTS "Coaches can view their club" ON clubs;

CREATE POLICY "Coaches can view their club"
  ON clubs FOR SELECT
  USING (
    id IN (
      SELECT club_id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- Allow athletes to view their club
DROP POLICY IF EXISTS "Athletes can view their club" ON clubs;

CREATE POLICY "Athletes can view their club"
  ON clubs FOR SELECT
  USING (
    id IN (
      SELECT club_id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Allow users to view clubs through their profile
DROP POLICY IF EXISTS "Users can view their club via profile" ON clubs;

CREATE POLICY "Users can view their club via profile"
  ON clubs FOR SELECT
  USING (
    id IN (
      SELECT club_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Verify the policies
SELECT 
    '✅ Clubs RLS Policies Updated' as status,
    policyname,
    cmd,
    CASE 
        WHEN policyname LIKE '%coach%' THEN '👨‍🏫 Coach Access'
        WHEN policyname LIKE '%athlete%' THEN '🏃 Athlete Access'
        WHEN policyname LIKE '%admin%' THEN '👨‍💼 Admin Access'
        WHEN policyname LIKE '%profile%' THEN '👤 Profile Access'
        ELSE '📋 Other'
    END as access_type
FROM pg_policies
WHERE tablename = 'clubs'
ORDER BY policyname;
