-- Simple Verification of Notification System Setup

SELECT '=== NOTIFICATION SYSTEM VERIFICATION ===' as status;

-- 1. Check notifications table exists
SELECT 
  '1. Notifications Table' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
  THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- 2. Check key columns
SELECT 
  '2. Notification Columns' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link')
    THEN '✓ ALL KEY COLUMNS EXIST'
    ELSE '✗ MISSING COLUMNS'
  END as status;

-- 3. Check triggers
SELECT 
  '3. Notification Triggers' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_training_session')
    AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_announcement')
    AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_new_performance_record')
    AND EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_leave_request_status')
    THEN '✓ ALL 4 TRIGGERS EXIST'
    ELSE '⚠ SOME TRIGGERS MISSING'
  END as status;

-- 4. Check RLS policies
SELECT 
  '4. Notification RLS Policies' as check_item,
  count(*)::text || ' policies' as status
FROM pg_policies 
WHERE tablename = 'notifications';

-- 5. Check leave_requests enhancements
SELECT 
  '5. Leave Request Enhancements' as check_item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'review_notes')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'updated_at')
    THEN '✓ ENHANCED COLUMNS EXIST'
    ELSE '✗ MISSING ENHANCEMENTS'
  END as status;

-- 6. Check leave_request_history view
SELECT 
  '6. Leave History View' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'leave_request_history')
  THEN '✓ VIEW EXISTS' ELSE '✗ VIEW MISSING' END as status;

-- 7. Check send_session_reminders function
SELECT 
  '7. Reminder Function' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_session_reminders')
  THEN '✓ FUNCTION EXISTS' ELSE '✗ FUNCTION MISSING' END as status;

-- 8. Check pg_cron extension (for reminders)
SELECT 
  '8. pg_cron Extension' as check_item,
  CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
  THEN '✓ ENABLED' ELSE '⚠ NOT ENABLED (optional)' END as status;

-- 9. Check cron job (if pg_cron is enabled)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM 1 FROM cron.job WHERE jobname = 'session-reminders';
    IF FOUND THEN
      RAISE NOTICE '9. Cron Job for Reminders: ✓ CONFIGURED';
    ELSE
      RAISE NOTICE '9. Cron Job for Reminders: ⚠ NOT CONFIGURED';
    END IF;
  ELSE
    RAISE NOTICE '9. Cron Job for Reminders: N/A (pg_cron not enabled)';
  END IF;
END $$;

-- Summary
SELECT '=== SUMMARY ===' as status;

SELECT 
  CASE 
    WHEN (
      SELECT count(*) FROM (
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_trigger WHERE tgname LIKE 'trigger_notify%')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'leave_request_history')
        UNION ALL
        SELECT 1 WHERE EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'send_session_reminders')
      ) x
    ) >= 4
    THEN '✅ NOTIFICATION SYSTEM IS READY!'
    ELSE '❌ SOME COMPONENTS ARE MISSING'
  END as overall_status;

-- List all notification triggers
SELECT 
  '=== NOTIFICATION TRIGGERS ===' as info,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%notify%'
ORDER BY trigger_name;
