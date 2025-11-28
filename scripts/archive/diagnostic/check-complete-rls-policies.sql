-- Check all RLS policies for auth-related tables

-- Profiles policies
SELECT 
  'profiles' as table_name,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY cmd, policyname;

-- User_roles policies
SELECT 
  'user_roles' as table_name,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'user_roles'
ORDER BY cmd, policyname;

-- Login_sessions policies
SELECT 
  'login_sessions' as table_name,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'login_sessions'
ORDER BY cmd, policyname;

-- Summary: Check which operations are covered
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_roles', 'login_sessions')
GROUP BY tablename, cmd
ORDER BY tablename, cmd;
