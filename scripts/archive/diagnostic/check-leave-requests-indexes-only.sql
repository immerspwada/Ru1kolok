-- Check indexes on leave_requests table
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leave_requests'
ORDER BY indexname;
