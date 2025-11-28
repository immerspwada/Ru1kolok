-- ลบบัญชี demo ทั้งหมด
DELETE FROM auth.users 
WHERE email IN (
    'demo.admin@test.com',
    'demo.coach@test.com', 
    'demo.athlete@test.com'
);

SELECT 'Deleted demo users' as status, COUNT(*) as deleted_count
FROM auth.users
WHERE email LIKE 'demo.%@test.com';
