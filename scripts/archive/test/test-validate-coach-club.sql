-- ============================================================================
-- Test Script for validate_coach_club_relationship Function
-- ============================================================================
-- Description: Comprehensive test of the coach-club validation function
-- Related: Task 1.4 - Function to validate coach-club relationship
-- ============================================================================

-- Test 1: Non-existent coach and club (should return FALSE)
SELECT 
  'Test 1: Non-existent coach and club' as test_name,
  validate_coach_club_relationship(
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID
  ) as result,
  FALSE as expected,
  CASE 
    WHEN validate_coach_club_relationship(
      '00000000-0000-0000-0000-000000000000'::UUID,
      '00000000-0000-0000-0000-000000000000'::UUID
    ) = FALSE THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status;

-- Test 2: Get actual coach and club data for testing
SELECT 
  'Test 2: Finding real coach-club relationships' as test_name,
  p.id as coach_id,
  p.full_name as coach_name,
  p.club_id,
  c.name as club_name,
  ur.role
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN clubs c ON c.id = p.club_id
WHERE ur.role = 'coach'
  AND p.club_id IS NOT NULL
LIMIT 3;

-- Test 3: Valid coach-club relationship (should return TRUE)
WITH coach_data AS (
  SELECT 
    p.id as coach_id,
    p.club_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'coach'
    AND p.club_id IS NOT NULL
  LIMIT 1
)
SELECT 
  'Test 3: Valid coach-club relationship' as test_name,
  coach_id,
  club_id,
  validate_coach_club_relationship(coach_id, club_id) as result,
  TRUE as expected,
  CASE 
    WHEN validate_coach_club_relationship(coach_id, club_id) = TRUE THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM coach_data;

-- Test 4: Coach with wrong club (should return FALSE)
WITH test_data AS (
  SELECT 
    p.id as coach_id,
    (SELECT id FROM clubs WHERE id != p.club_id LIMIT 1) as wrong_club_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'coach'
    AND p.club_id IS NOT NULL
  LIMIT 1
)
SELECT 
  'Test 4: Coach with wrong club' as test_name,
  coach_id,
  wrong_club_id,
  validate_coach_club_relationship(coach_id, wrong_club_id) as result,
  FALSE as expected,
  CASE 
    WHEN validate_coach_club_relationship(coach_id, wrong_club_id) = FALSE THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM test_data
WHERE wrong_club_id IS NOT NULL;

-- Test 5: Non-coach user (should return FALSE)
WITH athlete_data AS (
  SELECT 
    p.id as athlete_id,
    p.club_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'athlete'
    AND p.club_id IS NOT NULL
  LIMIT 1
)
SELECT 
  'Test 5: Non-coach user (athlete)' as test_name,
  athlete_id,
  club_id,
  validate_coach_club_relationship(athlete_id, club_id) as result,
  FALSE as expected,
  CASE 
    WHEN validate_coach_club_relationship(athlete_id, club_id) = FALSE THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM athlete_data;

-- Test 6: Coach with NULL club_id (should return FALSE)
WITH coach_no_club AS (
  SELECT 
    p.id as coach_id
  FROM profiles p
  JOIN user_roles ur ON ur.user_id = p.id
  WHERE ur.role = 'coach'
    AND p.club_id IS NULL
  LIMIT 1
)
SELECT 
  'Test 6: Coach with NULL club_id' as test_name,
  coach_id,
  validate_coach_club_relationship(
    coach_id, 
    '00000000-0000-0000-0000-000000000000'::UUID
  ) as result,
  FALSE as expected,
  CASE 
    WHEN validate_coach_club_relationship(
      coach_id, 
      '00000000-0000-0000-0000-000000000000'::UUID
    ) = FALSE THEN '✓ PASS'
    ELSE '✗ FAIL'
  END as status
FROM coach_no_club;
