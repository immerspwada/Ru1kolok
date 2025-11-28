-- Verify that coach can now access their club data
-- Simulate the query from the coach dashboard

-- Set the session to simulate the demo coach user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "284ad818-710a-4ea6-945f-5b560e25005e"}';

-- Test the query that was failing
SELECT 
    '✅ Coach Profile Query' as test,
    c.id,
    c.first_name,
    c.last_name,
    c.specialization,
    c.club_id,
    cl.id as club_id_from_join,
    cl.name as club_name
FROM coaches c
LEFT JOIN clubs cl ON c.club_id = cl.id
WHERE c.user_id = '284ad818-710a-4ea6-945f-5b560e25005e';

-- Reset
RESET role;
RESET request.jwt.claims;

SELECT '✅ Verification Complete - Coach should now be able to access dashboard' as status;
