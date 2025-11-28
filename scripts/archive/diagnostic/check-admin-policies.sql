-- Check if admin policies exist
SELECT 
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'membership_applications'
  AND policyname LIKE '%admin%'
ORDER BY policyname;
