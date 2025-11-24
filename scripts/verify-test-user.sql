-- ตรวจสอบ test user
SELECT 
    u.id,
    u.email,
    u.encrypted_password IS NOT NULL as has_password,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    u.created_at,
    p.full_name,
    p.role,
    p.membership_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'test-login@example.com';
