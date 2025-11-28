-- Check Rate Limit Status
-- This script checks recent signup attempts to diagnose rate limiting issues

-- Count signups in the last hour
SELECT 
  'Signups in last hour' as metric,
  COUNT(*) as count
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Count signups in the last 24 hours
SELECT 
  'Signups in last 24 hours' as metric,
  COUNT(*) as count
FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Show recent signups with timestamps
SELECT 
  email,
  created_at,
  confirmed_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_ago
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are any failed signup attempts (if audit log exists)
-- Note: Supabase doesn't expose failed auth attempts in the database
-- Rate limiting is handled at the API level

SELECT 
  CASE 
    WHEN COUNT(*) > 5 THEN 'WARNING: More than 5 signups in last hour - rate limiting may be active'
    ELSE 'OK: Normal signup rate'
  END as status
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour';
