-- Check database size and what's taking up space
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

-- Count records in main tables (only existing tables)
SELECT 'auth.users' as table_name, COUNT(*) as record_count FROM auth.users
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'attendance_logs', COUNT(*) FROM attendance_logs
UNION ALL
SELECT 'training_sessions', COUNT(*) FROM training_sessions
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'login_sessions', COUNT(*) FROM login_sessions
UNION ALL
SELECT 'announcements', COUNT(*) FROM announcements
UNION ALL
SELECT 'membership_applications', COUNT(*) FROM membership_applications
UNION ALL
SELECT 'leave_requests', COUNT(*) FROM leave_requests;

-- Check for demo/test users
SELECT 
  'Demo/Test Users' as category,
  COUNT(*) as count
FROM auth.users 
WHERE email LIKE '%demo%' OR email LIKE '%test%' OR email LIKE '%example%';

-- Check old data
SELECT 
  'Old attendance (>6 months)' as category,
  COUNT(*) as count
FROM attendance_logs 
WHERE created_at < NOW() - INTERVAL '6 months';

SELECT 
  'Old audit logs (>3 months)' as category,
  COUNT(*) as count
FROM audit_logs 
WHERE created_at < NOW() - INTERVAL '3 months';

SELECT 
  'Old login sessions (>1 month)' as category,
  COUNT(*) as count
FROM login_sessions 
WHERE created_at < NOW() - INTERVAL '1 month';
