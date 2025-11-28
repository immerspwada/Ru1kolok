-- ============================================================================
-- Verify Coach-Club Consistency (Correctness Property CP1)
-- ============================================================================
-- Task 5.3: Check coach-club consistency
-- Correctness Property CP1: If application is approved, then:
--   athlete.club_id === coach.club_id === application.club_id
-- ============================================================================

-- Check 1: Verify all three club_ids match for approved applications
SELECT 
  '1. CP1: Club-Coach Consistency (All 3 match)' as check_name,
  COUNT(*) as violations,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All approved applications have consistent club assignments'
    ELSE '❌ FAIL - Found ' || COUNT(*) || ' approved applications with inconsistent club assignments'
  END as status
FROM membership_applications ma
JOIN profiles athlete ON athlete.id = ma.user_id
JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND NOT (
    ma.club_id = athlete.club_id 
    AND athlete.club_id = coach.club_id
  );

-- Check 2: Show detailed breakdown of any inconsistencies
SELECT 
  '2. Detailed Inconsistency Report' as report_section,
  ma.id as application_id,
  ma.user_id as athlete_user_id,
  athlete_user.email as athlete_email,
  ma.club_id as application_club_id,
  app_club.name as application_club_name,
  athlete.club_id as athlete_profile_club_id,
  athlete_club.name as athlete_profile_club_name,
  ma.assigned_coach_id,
  coach_user.email as coach_email,
  coach.club_id as coach_profile_club_id,
  coach_club.name as coach_profile_club_name,
  CASE 
    WHEN ma.club_id != athlete.club_id THEN 'Application club ≠ Athlete club'
    WHEN ma.club_id != coach.club_id THEN 'Application club ≠ Coach club'
    WHEN athlete.club_id != coach.club_id THEN 'Athlete club ≠ Coach club'
    ELSE 'Unknown inconsistency'
  END as inconsistency_type
FROM membership_applications ma
JOIN profiles athlete ON athlete.id = ma.user_id
JOIN profiles coach ON coach.id = ma.assigned_coach_id
LEFT JOIN auth.users athlete_user ON athlete_user.id = ma.user_id
LEFT JOIN auth.users coach_user ON coach_user.id = coach.id
LEFT JOIN clubs app_club ON app_club.id = ma.club_id
LEFT JOIN clubs athlete_club ON athlete_club.id = athlete.club_id
LEFT JOIN clubs coach_club ON coach_club.id = coach.club_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND NOT (
    ma.club_id = athlete.club_id 
    AND athlete.club_id = coach.club_id
  )
LIMIT 20;

-- Check 3: Verify coach belongs to application's club
SELECT 
  '3. Coach-Application Club Match' as check_name,
  COUNT(*) as violations,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All coaches belong to application club'
    ELSE '❌ FAIL - Found ' || COUNT(*) || ' coaches not in application club'
  END as status
FROM membership_applications ma
JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND ma.club_id != coach.club_id;

-- Check 4: Verify athlete belongs to application's club
SELECT 
  '4. Athlete-Application Club Match' as check_name,
  COUNT(*) as violations,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All athletes belong to application club'
    ELSE '❌ FAIL - Found ' || COUNT(*) || ' athletes not in application club'
  END as status
FROM membership_applications ma
JOIN profiles athlete ON athlete.id = ma.user_id
WHERE ma.status = 'approved'
  AND athlete.club_id IS NOT NULL
  AND ma.club_id != athlete.club_id;

-- Check 5: Verify athlete and coach are in same club
SELECT 
  '5. Athlete-Coach Club Match' as check_name,
  COUNT(*) as violations,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All athletes and coaches in same club'
    ELSE '❌ FAIL - Found ' || COUNT(*) || ' athlete-coach pairs in different clubs'
  END as status
FROM membership_applications ma
JOIN profiles athlete ON athlete.id = ma.user_id
JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND athlete.club_id IS NOT NULL
  AND coach.club_id IS NOT NULL
  AND athlete.club_id != coach.club_id;

-- Check 6: Statistics summary
SELECT 
  'Statistics' as report_section,
  COUNT(*) as total_approved_applications,
  COUNT(*) FILTER (WHERE ma.assigned_coach_id IS NOT NULL) as with_assigned_coach,
  COUNT(*) FILTER (WHERE athlete.club_id IS NOT NULL) as athlete_has_club,
  COUNT(*) FILTER (WHERE coach.club_id IS NOT NULL) as coach_has_club,
  COUNT(*) FILTER (
    WHERE ma.club_id = athlete.club_id 
    AND athlete.club_id = coach.club_id
  ) as fully_consistent,
  COUNT(*) FILTER (
    WHERE NOT (
      ma.club_id = athlete.club_id 
      AND athlete.club_id = coach.club_id
    )
  ) as inconsistent
FROM membership_applications ma
LEFT JOIN profiles athlete ON athlete.id = ma.user_id
LEFT JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved';

-- Check 7: Show sample of consistent approved applications (for verification)
SELECT 
  'Sample Consistent Applications' as report_section,
  ma.id as application_id,
  athlete_user.email as athlete_email,
  coach_user.email as coach_email,
  app_club.name as club_name,
  ma.club_id as app_club_id,
  athlete.club_id as athlete_club_id,
  coach.club_id as coach_club_id,
  '✅ Consistent' as status
FROM membership_applications ma
JOIN profiles athlete ON athlete.id = ma.user_id
JOIN profiles coach ON coach.id = ma.assigned_coach_id
LEFT JOIN auth.users athlete_user ON athlete_user.id = ma.user_id
LEFT JOIN auth.users coach_user ON coach_user.id = coach.id
LEFT JOIN clubs app_club ON app_club.id = ma.club_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND ma.club_id = athlete.club_id 
  AND athlete.club_id = coach.club_id
LIMIT 10;

-- Check 8: Identify NULL club_id cases (edge cases)
SELECT 
  '8. NULL club_id Cases' as check_name,
  COUNT(*) FILTER (WHERE athlete.club_id IS NULL) as athlete_null_club,
  COUNT(*) FILTER (WHERE coach.club_id IS NULL) as coach_null_club,
  COUNT(*) FILTER (WHERE ma.club_id IS NULL) as application_null_club,
  CASE 
    WHEN COUNT(*) FILTER (WHERE athlete.club_id IS NULL OR coach.club_id IS NULL OR ma.club_id IS NULL) = 0 
    THEN '✅ PASS - No NULL club_ids'
    ELSE '⚠️  WARNING - Found NULL club_ids in approved applications'
  END as status
FROM membership_applications ma
LEFT JOIN profiles athlete ON athlete.id = ma.user_id
LEFT JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved';
