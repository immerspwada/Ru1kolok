-- ตรวจสอบปัญหาที่ผู้ใช้เจอ

-- 1. สรุปข้อผิดพลาดที่เกิดขึ้นบ่อย (24 ชั่วโมงที่แล้ว)
SELECT 
  '=== ข้อผิดพลาดที่เกิดบ่อยใน 24 ชั่วโมง ===' as section;

SELECT 
  error_type,
  error_code,
  COUNT(*) as occurrence_count,
  COUNT(DISTINCT user_id) as affected_users,
  MAX(created_at) as last_occurred
FROM error_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type, error_code
ORDER BY occurrence_count DESC
LIMIT 10;

-- 2. Rate Limit Errors
SELECT 
  '=== Rate Limit Errors (24 ชั่วโมง) ===' as section;

SELECT 
  COUNT(*) as total_rate_limit_errors,
  COUNT(DISTINCT ip_address) as affected_ips,
  COUNT(DISTINCT user_id) as affected_users
FROM error_logs
WHERE error_type = 'rate_limit'
  AND created_at > NOW() - INTERVAL '24 hours';

-- 3. การสมัครที่ไม่สมบูรณ์
SELECT 
  '=== การสมัครที่ไม่สมบูรณ์ (7 วัน) ===' as section;

SELECT * FROM incomplete_registrations
LIMIT 20;

-- 4. ตรวจสอบ Auth Users ที่ไม่มี Profile
SELECT 
  '=== Auth Users ที่ไม่มี Profile ===' as section;

SELECT 
  au.id,
  au.email,
  au.created_at,
  NOW() - au.created_at as age
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL
  AND au.created_at > NOW() - INTERVAL '7 days'
ORDER BY au.created_at DESC
LIMIT 20;

-- 5. Profiles ที่ไม่มี Athlete Record
SELECT 
  '=== Profiles ที่ไม่มี Athlete Record ===' as section;

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at,
  NOW() - p.created_at as age
FROM profiles p
LEFT JOIN athletes a ON a.user_id = p.id
WHERE a.user_id IS NULL
  AND p.role = 'athlete'
  AND p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC
LIMIT 20;

-- 6. สถิติการสมัครสมาชิก
SELECT 
  '=== สถิติการสมัครสมาชิก ===' as section;

SELECT 
  DATE(created_at) as date,
  COUNT(*) as signups,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 7. ข้อผิดพลาดล่าสุด (10 รายการ)
SELECT 
  '=== ข้อผิดพลาดล่าสุด ===' as section;

SELECT 
  created_at,
  error_type,
  error_code,
  error_message,
  COALESCE(
    (SELECT email FROM profiles WHERE id = error_logs.user_id),
    (SELECT email FROM auth.users WHERE id = error_logs.user_id),
    'Anonymous'
  ) as user_email,
  page_url
FROM error_logs
ORDER BY created_at DESC
LIMIT 10;
