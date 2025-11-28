-- ===================================================================
-- ตรวจสอบการเชื่อมต่อและ Schema
-- ===================================================================

-- 1. ตรวจสอบว่าเชื่อมต่อได้หรือไม่
SELECT 
    'Connection Test' as test,
    NOW() as current_time,
    current_database() as database_name,
    current_user as current_user;

-- 2. ตรวจสอบตารางหลักที่มีอยู่
SELECT 
    'Tables Check' as test,
    schemaname,
    tablename
FROM pg_tables
WHERE schemaname IN ('public', 'auth', 'storage')
ORDER BY schemaname, tablename
LIMIT 20;

-- 3. ตรวจสอบว่ามี demo users หรือไม่
SELECT 
    'Demo Users Check' as test,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email LIKE 'demo.%@test.com' THEN 1 END) as demo_users
FROM auth.users;

-- 4. แสดง demo users ที่มีอยู่
SELECT 
    'Demo Users List' as info,
    u.email,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE 'demo.%@test.com'
ORDER BY p.role;
