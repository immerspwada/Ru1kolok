-- ===================================================================
-- ตรวจสอบสถานะ Rate Limiting
-- ===================================================================

-- 1. ตรวจสอบ auth users ที่สร้างล่าสุด (24 ชั่วโมง)
SELECT 
    'Recent Signups (24h)' as check_name,
    COUNT(*) as total_signups,
    COUNT(DISTINCT email) as unique_emails,
    MIN(created_at) as first_signup,
    MAX(created_at) as last_signup
FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours';

-- 2. ตรวจสอบ users ที่สร้างในช่วง 1 ชั่วโมงล่าสุด
SELECT 
    'Recent Signups (1h)' as check_name,
    COUNT(*) as total_signups,
    COUNT(DISTINCT email) as unique_emails
FROM auth.users
WHERE created_at > NOW() - INTERVAL '1 hour';

-- 3. แสดง users ล่าสุด 10 คน
SELECT 
    'Last 10 Users' as info,
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 4. ตรวจสอบ failed auth attempts (ถ้ามีตาราง)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' 
        AND table_name = 'audit_log_entries'
    ) THEN
        RAISE NOTICE 'Checking auth audit logs...';
    ELSE
        RAISE NOTICE 'No audit log table found';
    END IF;
END $$;

-- 5. สรุปสถานะ
SELECT 
    'Rate Limit Summary' as summary,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '1 hour') > 5 
        THEN 'อาจถูก rate limit (มีการสมัครมากกว่า 5 ครั้งใน 1 ชั่วโมง)'
        ELSE 'ปกติ (ไม่น่าจะถูก rate limit)'
    END as status,
    (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '1 hour') as signups_last_hour,
    (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '24 hours') as signups_last_24h;
