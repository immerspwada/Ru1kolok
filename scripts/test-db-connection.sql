-- Test database connection and basic queries

-- Test 1: Simple query
SELECT 'Database connection successful' as status, NOW() as timestamp;

-- Test 2: Check auth.users table access
SELECT COUNT(*) as user_count FROM auth.users;

-- Test 3: Check profiles table
SELECT COUNT(*) as profile_count FROM profiles;

-- Test 4: Check user_roles table
SELECT COUNT(*) as role_count FROM user_roles;

-- Test 5: Check login_sessions table
SELECT COUNT(*) as session_count FROM login_sessions;

-- Test 6: Verify RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_roles', 'login_sessions');
