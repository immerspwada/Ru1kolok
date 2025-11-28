-- Verify Athlete Features Implementation

-- 1. Check notifications table
SELECT 'Notifications Table' as check_name, 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
  THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 2. Check notification columns
SELECT 'Notification Columns' as check_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns 
WHERE table_name = 'notifications';

-- 3. Check notification triggers
SELECT 'Notification Triggers' as check_name,
  string_agg(trigger_name, ', ') as triggers
FROM information_schema.triggers
WHERE trigger_name LIKE '%notify%';

-- 4. Check leave_requests enhancements
SELECT 'Leave Request Columns' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' AND column_name = 'review_notes'
  ) THEN '✓ review_notes EXISTS' ELSE '✗ review_notes MISSING' END as status;

-- 5. Check leave_request_history view
SELECT 'Leave History View' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'leave_request_history'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 6. Check notification RLS policies
SELECT 'Notification Policies' as check_name,
  count(*) as policy_count
FROM pg_policies 
WHERE tablename = 'notifications';

-- 7. Check send_session_reminders function
SELECT 'Session Reminders Function' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'send_session_reminders'
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;
