-- ============================================================================
-- Verify Training Attendance System Indexes
-- ============================================================================

-- Count indexes per table
SELECT 
  tablename,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename IN ('training_sessions', 'attendance', 'leave_requests')
  AND schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- List all indexes for training_sessions
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'training_sessions'
  AND schemaname = 'public'
ORDER BY indexname;

-- List all indexes for attendance
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'attendance'
  AND schemaname = 'public'
ORDER BY indexname;

-- List all indexes for leave_requests
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'leave_requests'
  AND schemaname = 'public'
ORDER BY indexname;
