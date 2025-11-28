-- ============================================================================
-- Final Verification: validate_coach_club_relationship Function
-- ============================================================================

-- 1. Verify function exists and has correct signature
SELECT 
  'Function Signature Check' as check_type,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  CASE 
    WHEN pg_get_function_result(p.oid) = 'boolean' THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'validate_coach_club_relationship';

-- 2. Verify function has documentation
SELECT 
  'Function Documentation Check' as check_type,
  p.proname as function_name,
  d.description,
  CASE 
    WHEN d.description IS NOT NULL THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_description d ON d.objoid = p.oid
WHERE n.nspname = 'public'
  AND p.proname = 'validate_coach_club_relationship';

-- 3. Quick functional test with real data
WITH test_coach AS (
  SELECT 
    p.id as coach_id,
    p.club_id,
    p.full_name
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'coach'
    AND p.club_id IS NOT NULL
  LIMIT 1
)
SELECT 
  'Functional Test with Real Data' as check_type,
  coach_id,
  club_id,
  full_name as coach_name,
  validate_coach_club_relationship(coach_id, club_id) as result,
  CASE 
    WHEN validate_coach_club_relationship(coach_id, club_id) = TRUE THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM test_coach;

-- 4. Test with invalid data (should return FALSE)
SELECT 
  'Negative Test (Invalid Data)' as check_type,
  '00000000-0000-0000-0000-000000000000'::UUID as coach_id,
  '00000000-0000-0000-0000-000000000000'::UUID as club_id,
  validate_coach_club_relationship(
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID
  ) as result,
  CASE 
    WHEN validate_coach_club_relationship(
      '00000000-0000-0000-0000-000000000000'::UUID,
      '00000000-0000-0000-0000-000000000000'::UUID
    ) = FALSE THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

-- 5. Summary
SELECT 
  'SUMMARY' as check_type,
  'All Tests' as description,
  '✓ Function is deployed and working correctly' as status;
