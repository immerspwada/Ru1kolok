-- Test Notification System
-- This script tests the notification triggers and functions

-- 1. Check current notifications count
SELECT 'Current Notifications' as test_name, count(*) as count 
FROM notifications;

-- 2. Test: Create a test training session (should trigger notification)
-- First, get a test club and coach
DO $$
DECLARE
  test_club_id UUID;
  test_coach_id UUID;
  test_session_id UUID;
BEGIN
  -- Get first available club
  SELECT id INTO test_club_id FROM clubs LIMIT 1;
  
  -- Get first available coach
  SELECT id INTO test_coach_id FROM coaches LIMIT 1;
  
  IF test_club_id IS NOT NULL AND test_coach_id IS NOT NULL THEN
    -- Create test session
    INSERT INTO training_sessions (
      club_id, 
      coach_id, 
      title, 
      session_date, 
      start_time,
      end_time,
      session_type
    ) VALUES (
      test_club_id,
      test_coach_id,
      'ทดสอบระบบแจ้งเตือน',
      CURRENT_DATE + 1,
      '10:00',
      '12:00',
      'training'
    )
    RETURNING id INTO test_session_id;
    
    RAISE NOTICE 'Created test session: %', test_session_id;
  ELSE
    RAISE NOTICE 'No club or coach found for testing';
  END IF;
END $$;

-- 3. Check if notifications were created
SELECT 
  'New Schedule Notifications' as test_name,
  count(*) as count,
  max(created_at) as latest_notification
FROM notifications 
WHERE type = 'new_schedule'
AND created_at > NOW() - INTERVAL '1 minute';

-- 4. View recent notifications
SELECT 
  n.type,
  n.title,
  n.message,
  n.created_at,
  u.email as user_email
FROM notifications n
JOIN auth.users u ON n.user_id = u.id
WHERE n.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY n.created_at DESC
LIMIT 10;

-- 5. Test send_session_reminders function
SELECT 'Testing Reminder Function' as test_name;
SELECT send_session_reminders();

-- 6. Check reminder notifications
SELECT 
  'Reminder Notifications' as test_name,
  count(*) as count
FROM notifications 
WHERE type = 'schedule_reminder'
AND created_at > NOW() - INTERVAL '1 minute';

-- 7. Summary
SELECT 
  type,
  count(*) as count,
  max(created_at) as latest
FROM notifications
GROUP BY type
ORDER BY type;

-- Cleanup: Delete test session (optional)
-- DELETE FROM training_sessions 
-- WHERE title = 'ทดสอบระบบแจ้งเตือน' 
-- AND created_at > NOW() - INTERVAL '5 minutes';
