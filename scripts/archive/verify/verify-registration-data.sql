-- ตรวจสอบว่าหลังสมัครแล้วข้อมูลถูกบันทึกครบถ้วนหรือไม่

-- 1. ตรวจสอบการสมัครล่าสุด 20 รายการ
SELECT 
  '=== การสมัครล่าสุด 20 รายการ ===' as section;

WITH recent_signups AS (
  SELECT 
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    p.id as profile_id,
    p.full_name,
    p.role,
    p.membership_status,
    a.id as athlete_id,
    a.club_id,
    c.name as club_name
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN athletes a ON a.user_id = au.id
  LEFT JOIN clubs c ON c.id = a.club_id
  WHERE au.created_at > NOW() - INTERVAL '7 days'
  ORDER BY au.created_at DESC
  LIMIT 20
)
SELECT 
  email,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅'
    ELSE '❌'
  END as email_confirmed,
  CASE 
    WHEN profile_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_profile,
  CASE 
    WHEN athlete_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_athlete,
  CASE 
    WHEN club_id IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_club,
  full_name,
  role,
  membership_status,
  club_name
FROM recent_signups;

-- 2. สรุปความสมบูรณ์ของข้อมูล
SELECT 
  '=== สรุปความสมบูรณ์ของข้อมูล (7 วัน) ===' as section;

WITH signup_stats AS (
  SELECT 
    COUNT(*) as total_signups,
    COUNT(p.id) as with_profile,
    COUNT(a.id) as with_athlete,
    COUNT(a.club_id) as with_club
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN athletes a ON a.user_id = au.id
  WHERE au.created_at > NOW() - INTERVAL '7 days'
)
SELECT 
  total_signups,
  with_profile,
  with_athlete,
  with_club,
  ROUND(100.0 * with_profile / NULLIF(total_signups, 0), 2) as profile_completion_rate,
  ROUND(100.0 * with_athlete / NULLIF(total_signups, 0), 2) as athlete_completion_rate,
  ROUND(100.0 * with_club / NULLIF(total_signups, 0), 2) as club_completion_rate
FROM signup_stats;

-- 3. ตรวจสอบข้อมูลที่ขาดหาย
SELECT 
  '=== ข้อมูลที่ขาดหาย ===' as section;

SELECT 
  'Missing Profile' as issue_type,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
  AND au.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Missing Athlete Record' as issue_type,
  COUNT(*) as count
FROM profiles p
LEFT JOIN athletes a ON a.user_id = p.id
WHERE a.user_id IS NULL
  AND p.role = 'athlete'
  AND p.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Missing Club Assignment' as issue_type,
  COUNT(*) as count
FROM athletes a
WHERE a.club_id IS NULL
  AND a.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Unconfirmed Email' as issue_type,
  COUNT(*) as count
FROM auth.users au
WHERE au.email_confirmed_at IS NULL
  AND au.created_at > NOW() - INTERVAL '7 days';

-- 4. ตรวจสอบ Registration Audit Trail
SELECT 
  '=== Registration Audit Trail (ล่าสุด 10 รายการ) ===' as section;

SELECT 
  email,
  step,
  created_at,
  error_message,
  step_data
FROM registration_audit
ORDER BY created_at DESC
LIMIT 10;

-- 5. ตรวจสอบ Login Sessions
SELECT 
  '=== Login Sessions (24 ชั่วโมง) ===' as section;

SELECT 
  COUNT(*) as total_logins,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour
FROM login_sessions
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 6. ตรวจสอบผู้ใช้ที่สมัครแล้วแต่ยังไม่เคย Login
SELECT 
  '=== ผู้ใช้ที่สมัครแล้วแต่ยังไม่เคย Login ===' as section;

SELECT 
  au.email,
  au.created_at,
  NOW() - au.created_at as time_since_signup,
  p.role,
  p.membership_status
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
LEFT JOIN login_sessions ls ON ls.user_id = au.id
WHERE ls.id IS NULL
  AND au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC
LIMIT 20;

-- 7. ตรวจสอบความถูกต้องของ Foreign Keys
SELECT 
  '=== ตรวจสอบความถูกต้องของ Foreign Keys ===' as section;

SELECT 
  'Orphaned Profiles' as issue,
  COUNT(*) as count
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE au.id IS NULL

UNION ALL

SELECT 
  'Orphaned Athletes' as issue,
  COUNT(*) as count
FROM athletes a
LEFT JOIN profiles p ON p.id = a.user_id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Athletes with Invalid Club' as issue,
  COUNT(*) as count
FROM athletes a
LEFT JOIN clubs c ON c.id = a.club_id
WHERE a.club_id IS NOT NULL
  AND c.id IS NULL;
