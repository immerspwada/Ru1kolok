-- Test the clubs relation that might be causing the issue

-- 1. Check the coach's club_id
SELECT 
    'Coach Club ID' as info,
    c.id as coach_id,
    c.club_id,
    c.email
FROM coaches c
WHERE c.email = 'demo.coach@test.com';

-- 2. Check if the club exists
SELECT 
    'Club Record' as info,
    cl.*
FROM clubs cl
WHERE cl.id = (
    SELECT club_id FROM coaches WHERE email = 'demo.coach@test.com'
);

-- 3. Check for duplicate clubs with same ID (shouldn't happen but let's verify)
SELECT 
    'Duplicate Clubs Check' as info,
    id,
    COUNT(*) as count
FROM clubs
GROUP BY id
HAVING COUNT(*) > 1;

-- 4. Check RLS policies on clubs table
SELECT 
    'Clubs RLS Policies' as info,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'clubs';
