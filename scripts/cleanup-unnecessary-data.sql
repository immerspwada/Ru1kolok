-- Safe cleanup script - removes unnecessary data that can be recreated
-- Run this to reduce database size

BEGIN;

-- 1. Delete demo/test users and their related data
DO $$
DECLARE
  demo_user_ids uuid[];
BEGIN
  -- Get all demo/test user IDs
  SELECT ARRAY_AGG(id) INTO demo_user_ids
  FROM auth.users 
  WHERE email LIKE '%demo%' OR email LIKE '%test%' OR email LIKE '%example%';
  
  IF demo_user_ids IS NOT NULL THEN
    -- Delete related data first (respecting foreign keys)
    DELETE FROM attendance_logs WHERE athlete_id = ANY(demo_user_ids);
    DELETE FROM leave_requests WHERE athlete_id = ANY(demo_user_ids);
    DELETE FROM membership_applications WHERE user_id = ANY(demo_user_ids);
    DELETE FROM login_sessions WHERE user_id = ANY(demo_user_ids);
    DELETE FROM audit_logs WHERE user_id = ANY(demo_user_ids);
    DELETE FROM profiles WHERE id = ANY(demo_user_ids);
    
    -- Delete auth users last
    DELETE FROM auth.users WHERE id = ANY(demo_user_ids);
    
    RAISE NOTICE 'Deleted % demo/test users', array_length(demo_user_ids, 1);
  END IF;
END $$;

-- 2. Delete old audit logs (keep only last 30 days)
DELETE FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 3. Delete old login sessions (keep only last 30 days)
DELETE FROM login_sessions 
WHERE created_at < NOW() - INTERVAL '30 days';

-- 4. Delete old attendance logs (keep only last 6 months)
DELETE FROM attendance_logs 
WHERE created_at < NOW() - INTERVAL '6 months';

-- 5. Delete rejected/expired membership applications (keep only last 3 months)
DELETE FROM membership_applications 
WHERE status IN ('rejected', 'expired') 
AND updated_at < NOW() - INTERVAL '3 months';

-- 6. Delete old announcements (keep only last 6 months)
DELETE FROM announcements 
WHERE created_at < NOW() - INTERVAL '6 months';

COMMIT;

-- Show results
SELECT 
  'Cleanup completed' as status,
  NOW() as completed_at;

-- Show remaining counts
SELECT 'auth.users' as table_name, COUNT(*) as remaining FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'attendance_logs', COUNT(*) FROM attendance_logs
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'login_sessions', COUNT(*) FROM login_sessions
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements
UNION ALL
SELECT 'membership_applications', COUNT(*) FROM membership_applications;
