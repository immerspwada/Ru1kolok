-- ============================================
-- Fix RLS Policies for training_sessions table
-- ============================================
-- Problem: The current policy checks coach_id = auth.uid()
-- But coach_id references coaches(id), not auth.users(id)
-- Solution: Check through the coaches table

-- Drop existing policies (all possible names)
DROP POLICY IF EXISTS "Coaches manage own sessions" ON training_sessions;
DROP POLICY IF EXISTS "Athletes view team sessions" ON training_sessions;
DROP POLICY IF EXISTS "Athletes view club sessions" ON training_sessions;
DROP POLICY IF EXISTS "Admins manage all sessions" ON training_sessions;

-- ============================================
-- Policy 1: Coaches can CRUD their own sessions
-- ============================================
-- Coaches can create, read, update, and delete training sessions
-- where they are the assigned coach (via coaches table)
CREATE POLICY "Coaches manage own sessions"
  ON training_sessions
  FOR ALL
  USING (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    coach_id IN (
      SELECT id FROM coaches WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Policy 2: Athletes can view sessions in their club
-- ============================================
-- Athletes can only SELECT (read) training sessions
-- that belong to their club
CREATE POLICY "Athletes view club sessions"
  ON training_sessions
  FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Policy 3: Admins can do everything
-- ============================================
-- Admins have full access to all training sessions
CREATE POLICY "Admins manage all sessions"
  ON training_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- Verification
-- ============================================
-- List all policies on training_sessions
SELECT schemaname, tablename, policyname, permissive, cmd
FROM pg_policies
WHERE tablename = 'training_sessions'
ORDER BY policyname;
