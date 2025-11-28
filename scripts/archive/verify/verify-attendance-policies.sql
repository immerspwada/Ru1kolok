-- ============================================
-- Verify attendance RLS policies
-- ============================================

-- Check if RLS is enabled on attendance table
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'attendance';

-- List all policies on attendance table
SELECT 
  schemaname,
  tablename,
  policyname as "Policy Name",
  permissive as "Permissive",
  roles as "Roles",
  cmd as "Command",
  qual as "USING Expression",
  with_check as "WITH CHECK Expression"
FROM pg_policies
WHERE tablename = 'attendance'
ORDER BY policyname;
