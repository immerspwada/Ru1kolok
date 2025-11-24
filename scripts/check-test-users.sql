-- ตรวจสอบ test users ที่มีอยู่
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.full_name,
    p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email LIKE '%test%'
ORDER BY u.created_at DESC
LIMIT 10;
