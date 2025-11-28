-- Test the exact query that the coach dashboard uses
-- Simulate as the demo coach user

-- First, show the coach record
SELECT 
    'Coach Record' as info,
    c.*,
    cl.id as club_id,
    cl.name as club_name
FROM coaches c
LEFT JOIN clubs cl ON c.club_id = cl.id
WHERE c.email = 'demo.coach@test.com';

-- Check RLS policies on coaches table
SELECT 
    'RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'coaches'
ORDER BY policyname;

-- Check if the query returns multiple rows (which would cause the error)
SELECT 
    'Query Result Count' as info,
    COUNT(*) as row_count
FROM coaches
WHERE user_id = '284ad818-710a-4ea6-945f-5b560e25005e';

-- Show the actual data that would be returned
SELECT 
    'Actual Query Result' as info,
    c.id,
    c.user_id,
    c.first_name,
    c.last_name,
    c.email,
    c.specialization,
    c.club_id
FROM coaches c
WHERE c.user_id = '284ad818-710a-4ea6-945f-5b560e25005e';
