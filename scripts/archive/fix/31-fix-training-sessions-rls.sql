-- Fix training_sessions RLS policies for coach insert

-- Drop existing policies
DROP POLICY IF EXISTS "Coaches manage own sessions" ON training_sessions;
DROP POLICY IF EXISTS "Athletes view team sessions" ON training_sessions;
DROP POLICY IF EXISTS "Admins manage all sessions" ON training_sessions;

-- Policy 1: Coaches can manage sessions where they are the coach
CREATE POLICY "Coaches manage own sessions"
  ON training_sessions
  FOR ALL
  USING (
    coach_id = auth.uid()
  )
  WITH CHECK (
    coach_id = auth.uid()
  );

-- Policy 2: Athletes can view sessions in their club
CREATE POLICY "Athletes view club sessions"
  ON training_sessions
  FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM athletes WHERE user_id = auth.uid()
    )
  );

-- Policy 3: Admins can do everything
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
