-- ============================================================================
-- Coach-Club Consistency Verification Report (CP1)
-- ============================================================================
-- Correctness Property CP1: If application is approved, then:
--   athlete.club_id === coach.club_id === application.club_id
-- ============================================================================

WITH 
check1 AS (
  SELECT 
    '1. CP1: All 3 club_ids match' as check_name,
    COUNT(*) as violations,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status
  FROM membership_applications ma
  JOIN profiles athlete ON athlete.id = ma.user_id
  JOIN profiles coach ON coach.id = ma.assigned_coach_id
  WHERE ma.status = 'approved'
    AND ma.assigned_coach_id IS NOT NULL
    AND NOT (
      ma.club_id = athlete.club_id 
      AND athlete.club_id = coach.club_id
    )
),
check2 AS (
  SELECT 
    '2. Coach-Application club match' as check_name,
    COUNT(*) as violations,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status
  FROM membership_applications ma
  JOIN profiles coach ON coach.id = ma.assigned_coach_id
  WHERE ma.status = 'approved'
    AND ma.assigned_coach_id IS NOT NULL
    AND ma.club_id != coach.club_id
),
check3 AS (
  SELECT 
    '3. Athlete-Application club match' as check_name,
    COUNT(*) as violations,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status
  FROM membership_applications ma
  JOIN profiles athlete ON athlete.id = ma.user_id
  WHERE ma.status = 'approved'
    AND athlete.club_id IS NOT NULL
    AND ma.club_id != athlete.club_id
),
check4 AS (
  SELECT 
    '4. Athlete-Coach club match' as check_name,
    COUNT(*) as violations,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status
  FROM membership_applications ma
  JOIN profiles athlete ON athlete.id = ma.user_id
  JOIN profiles coach ON coach.id = ma.assigned_coach_id
  WHERE ma.status = 'approved'
    AND ma.assigned_coach_id IS NOT NULL
    AND athlete.club_id IS NOT NULL
    AND coach.club_id IS NOT NULL
    AND athlete.club_id != coach.club_id
),
check5 AS (
  SELECT 
    '5. NULL club_id cases' as check_name,
    COUNT(*) FILTER (WHERE athlete.club_id IS NULL OR coach.club_id IS NULL OR ma.club_id IS NULL) as violations,
    CASE 
      WHEN COUNT(*) FILTER (WHERE athlete.club_id IS NULL OR coach.club_id IS NULL OR ma.club_id IS NULL) = 0 
      THEN '✅ PASS'
      ELSE '⚠️  WARNING'
    END as status
  FROM membership_applications ma
  LEFT JOIN profiles athlete ON athlete.id = ma.user_id
  LEFT JOIN profiles coach ON coach.id = ma.assigned_coach_id
  WHERE ma.status = 'approved'
),
stats AS (
  SELECT 
    'STATISTICS' as check_name,
    COUNT(*) as violations,
    'Total: ' || COUNT(*) || 
    ', Consistent: ' || COUNT(*) FILTER (
      WHERE ma.club_id = athlete.club_id 
      AND athlete.club_id = coach.club_id
    ) ||
    ', Inconsistent: ' || COUNT(*) FILTER (
      WHERE NOT (
        ma.club_id = athlete.club_id 
        AND athlete.club_id = coach.club_id
      )
    ) as status
  FROM membership_applications ma
  LEFT JOIN profiles athlete ON athlete.id = ma.user_id
  LEFT JOIN profiles coach ON coach.id = ma.assigned_coach_id
  WHERE ma.status = 'approved'
)
SELECT check_name, violations, status FROM check1
UNION ALL SELECT check_name, violations, status FROM check2
UNION ALL SELECT check_name, violations, status FROM check3
UNION ALL SELECT check_name, violations, status FROM check4
UNION ALL SELECT check_name, violations, status FROM check5
UNION ALL SELECT check_name, violations, status FROM stats
ORDER BY check_name;
