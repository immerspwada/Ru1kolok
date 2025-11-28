-- Check indexes on leave_requests table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leave_requests'
ORDER BY indexname;

-- Check RLS policies on leave_requests table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'leave_requests'
ORDER BY policyname;
