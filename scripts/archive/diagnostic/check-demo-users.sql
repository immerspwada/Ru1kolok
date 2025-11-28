-- Check if demo users exist in auth.users and profiles

SELECT 
    '🔍 Checking Demo Users' as status;

-- Check auth.users
SELECT 
    'auth.users' as table_name,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users
WHERE email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com')
ORDER BY email;

-- Check profiles
SELECT 
    'profiles' as table_name,
    email,
    full_name,
    role,
    membership_status,
    club_id
FROM profiles
WHERE email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com')
ORDER BY email;

-- Check coaches table
SELECT 
    'coaches' as table_name,
    email,
    first_name,
    last_name,
    club_id
FROM coaches
WHERE email = 'demo.coach@test.com';

-- Summary
SELECT 
    CASE 
        WHEN COUNT(*) = 3 THEN '✅ All 3 demo users exist'
        ELSE '❌ Missing demo users - need to recreate'
    END as summary
FROM auth.users
WHERE email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com');
