-- ============================================================================
-- Comprehensive Membership Migration Data Integrity Report (Single Query)
-- ============================================================================
-- Task 5.3: Verify data integrity after production migration
-- ============================================================================

WITH 
check1 AS (
  SELECT 
    '1. Profiles with NULL membership_status' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM profiles
  WHERE membership_status IS NULL
),
check2 AS (
  SELECT 
    '2. Approved apps missing assigned_coach_id' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM membership_applications
  WHERE status = 'approved'
    AND assigned_coach_id IS NULL
),
check3 AS (
  SELECT 
    '3. Coach-club consistency' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM membership_applications ma
  JOIN profiles coach ON coach.id = ma.assigned_coach_id
  WHERE ma.status = 'approved'
    AND ma.assigned_coach_id IS NOT NULL
    AND ma.club_id != coach.club_id
),
check4a AS (
  SELECT 
    '4a. Active athletes missing club_id' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '⚠️  WARNING'
    END as status,
    COUNT(*) as count
  FROM profiles
  WHERE role = 'athlete'
    AND membership_status = 'active'
    AND club_id IS NULL
),
check4b AS (
  SELECT 
    '4b. Active athletes missing coach_id' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '⚠️  WARNING'
    END as status,
    COUNT(*) as count
  FROM profiles
  WHERE role = 'athlete'
    AND membership_status = 'active'
    AND coach_id IS NULL
),
check5a AS (
  SELECT 
    '5a. Coaches without active status' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM profiles
  WHERE role = 'coach'
    AND membership_status != 'active'
),
check5b AS (
  SELECT 
    '5b. Admins without active status' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM profiles
  WHERE role = 'admin'
    AND membership_status != 'active'
),
check7a AS (
  SELECT 
    '7a. Apps with invalid club_id' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM membership_applications ma
  WHERE NOT EXISTS (
    SELECT 1 FROM clubs c WHERE c.id = ma.club_id
  )
),
check7b AS (
  SELECT 
    '7b. Apps with invalid user_id' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM membership_applications ma
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = ma.user_id
  )
),
check7c AS (
  SELECT 
    '7c. Profiles with invalid club_id' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM profiles p
  WHERE p.club_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM clubs c WHERE c.id = p.club_id
    )
),
check8a AS (
  SELECT 
    '8a. Active athletes w/o approved apps' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '⚠️  WARNING'
    END as status,
    COUNT(*) as count
  FROM profiles p
  WHERE p.role = 'athlete'
    AND p.membership_status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM membership_applications ma
      WHERE ma.user_id = p.id
        AND ma.status = 'approved'
    )
),
check9 AS (
  SELECT 
    '9. Users with multiple pending apps' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '❌ FAIL'
    END as status,
    COUNT(*) as count
  FROM (
    SELECT user_id, COUNT(*) as pending_count
    FROM membership_applications
    WHERE status = 'pending'
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) duplicates
),
check10 AS (
  SELECT 
    '10. Rejected apps missing reason' as check_name,
    CASE 
      WHEN COUNT(*) = 0 THEN '✅ PASS'
      ELSE '⚠️  WARNING'
    END as status,
    COUNT(*) as count
  FROM membership_applications
  WHERE status = 'rejected'
    AND (rejection_reason IS NULL OR rejection_reason = '')
),
summary AS (
  SELECT 
    'SUMMARY' as check_name,
    'Total Profiles: ' || COUNT(*) as status,
    0 as count
  FROM profiles
  UNION ALL
  SELECT 
    'SUMMARY' as check_name,
    'Athletes: ' || COUNT(*) as status,
    1 as count
  FROM profiles WHERE role = 'athlete'
  UNION ALL
  SELECT 
    'SUMMARY' as check_name,
    'Active Athletes: ' || COUNT(*) as status,
    2 as count
  FROM profiles WHERE role = 'athlete' AND membership_status = 'active'
  UNION ALL
  SELECT 
    'SUMMARY' as check_name,
    'Pending Athletes: ' || COUNT(*) as status,
    3 as count
  FROM profiles WHERE role = 'athlete' AND membership_status = 'pending'
  UNION ALL
  SELECT 
    'SUMMARY' as check_name,
    'Total Applications: ' || COUNT(*) as status,
    4 as count
  FROM membership_applications
  UNION ALL
  SELECT 
    'SUMMARY' as check_name,
    'Approved Apps: ' || COUNT(*) as status,
    5 as count
  FROM membership_applications WHERE status = 'approved'
  UNION ALL
  SELECT 
    'SUMMARY' as check_name,
    'Pending Apps: ' || COUNT(*) as status,
    6 as count
  FROM membership_applications WHERE status = 'pending'
)
SELECT check_name, status, count FROM check1
UNION ALL SELECT check_name, status, count FROM check2
UNION ALL SELECT check_name, status, count FROM check3
UNION ALL SELECT check_name, status, count FROM check4a
UNION ALL SELECT check_name, status, count FROM check4b
UNION ALL SELECT check_name, status, count FROM check5a
UNION ALL SELECT check_name, status, count FROM check5b
UNION ALL SELECT check_name, status, count FROM check7a
UNION ALL SELECT check_name, status, count FROM check7b
UNION ALL SELECT check_name, status, count FROM check7c
UNION ALL SELECT check_name, status, count FROM check8a
UNION ALL SELECT check_name, status, count FROM check9
UNION ALL SELECT check_name, status, count FROM check10
UNION ALL SELECT check_name, status, count FROM summary
ORDER BY count, check_name;
