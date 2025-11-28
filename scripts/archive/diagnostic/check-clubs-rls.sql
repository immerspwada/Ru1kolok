-- Check RLS policies on clubs table
SELECT 
  'Clubs RLS Status' AS check_name,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END AS status
FROM pg_tables
WHERE tablename = 'clubs';

-- List all policies on clubs table
SELECT 
  policyname,
  cmd AS command,
  roles
FROM pg_policies
WHERE tablename = 'clubs'
ORDER BY policyname;
