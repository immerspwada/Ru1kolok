-- Verify RLS policies on training_sessions table

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'training_sessions';

-- List all policies on training_sessions
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'training_sessions'
ORDER BY policyname;
