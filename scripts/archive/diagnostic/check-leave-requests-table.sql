-- Check if leave_requests table exists and show its structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'leave_requests'
ORDER BY ordinal_position;
