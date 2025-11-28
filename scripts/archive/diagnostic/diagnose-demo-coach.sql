-- Diagnose demo coach issue
-- Check for duplicate coach records

-- 1. Check auth.users for demo coach
SELECT 
    'auth.users' as table_name,
    id,
    email,
    created_at
FROM auth.users
WHERE email = 'demo.coach@test.com';

-- 2. Check profiles for demo coach
SELECT 
    'profiles' as table_name,
    id,
    email,
    full_name,
    role,
    club_id,
    membership_status
FROM profiles
WHERE email = 'demo.coach@test.com';

-- 3. Check coaches table for demo coach
SELECT 
    'coaches' as table_name,
    id,
    user_id,
    club_id,
    email,
    first_name,
    last_name,
    specialization
FROM coaches
WHERE email = 'demo.coach@test.com';

-- 4. Count coaches records by user_id
SELECT 
    user_id,
    COUNT(*) as record_count,
    array_agg(id) as coach_ids
FROM coaches
WHERE email = 'demo.coach@test.com'
GROUP BY user_id;

-- 5. Check if there are multiple coaches with same user_id
SELECT 
    user_id,
    COUNT(*) as duplicate_count
FROM coaches
GROUP BY user_id
HAVING COUNT(*) > 1;
