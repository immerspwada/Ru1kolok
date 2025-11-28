-- ============================================
-- Cleanup duplicate RLS policies for training_sessions
-- ============================================
-- Remove old/duplicate policies, keep only the correct ones

-- Drop old/duplicate policies
DROP POLICY IF EXISTS "Coaches can manage their team sessions" ON training_sessions;
DROP POLICY IF EXISTS "Team members can view their sessions" ON training_sessions;
DROP POLICY IF EXISTS "Athletes view team sessions" ON training_sessions;

-- Verify remaining policies
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'training_sessions'
ORDER BY policyname;
