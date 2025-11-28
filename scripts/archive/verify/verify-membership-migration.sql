-- ============================================================================
-- Comprehensive Membership Migration Data Integrity Verification
-- ============================================================================
-- Task 5.3: Verify data integrity after production migration
-- ============================================================================

-- ============================================================================
-- CHECK 1: All profiles have membership_status set
-- ============================================================================
SELECT 
  '1. Profiles with NULL membership_status' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All profiles have membership_status'
    ELSE '❌ FAIL: ' || COUNT(*) || ' profiles missing membership_status'
  END as result,
  COUNT(*) as count
FROM profiles
WHERE membership_status IS NULL;

-- Show breakdown by role
SELECT 
  '1b. Profiles by role and status' as check_name,
  role,
  membership_status,
  COUNT(*) as count
FROM profiles
GROUP BY role, membership_status
ORDER BY role, membership_status;

-- ============================================================================
-- CHECK 2: Approved applications have assigned_coach_id
-- ============================================================================
SELECT 
  '2. Approved applications missing assigned_coach_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All approved applications have assigned_coach_id'
    ELSE '❌ FAIL: ' || COUNT(*) || ' approved applications missing assigned_coach_id'
  END as result,
  COUNT(*) as count
FROM membership_applications
WHERE status = 'approved'
  AND assigned_coach_id IS NULL;

-- Show statistics
SELECT 
  '2b. Approved applications statistics' as check_name,
  COUNT(*) as total_approved,
  COUNT(assigned_coach_id) as with_assigned_coach,
  COUNT(*) - COUNT(assigned_coach_id) as missing_assigned_coach
FROM membership_applications
WHERE status = 'approved';

-- ============================================================================
-- CHECK 3: Coach-club consistency
-- ============================================================================
SELECT 
  '3. Coach-club consistency check' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All approved applications have coach-club consistency'
    ELSE '❌ FAIL: ' || COUNT(*) || ' approved applications have coach-club mismatch'
  END as result,
  COUNT(*) as count
FROM membership_applications ma
JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND ma.club_id != coach.club_id;

-- Show any mismatches (limit 10)
SELECT 
  '3b. Coach-club mismatches (sample)' as check_name,
  ma.id as application_id,
  ma.club_id as application_club,
  coach.club_id as coach_club,
  coach.full_name as coach_name
FROM membership_applications ma
JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND ma.club_id != coach.club_id
LIMIT 10;

-- ============================================================================
-- CHECK 4: Active athletes have club_id and coach_id
-- ============================================================================
SELECT 
  '4a. Active athletes missing club_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All active athletes have club_id'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' active athletes missing club_id'
  END as result,
  COUNT(*) as count
FROM profiles
WHERE role = 'athlete'
  AND membership_status = 'active'
  AND club_id IS NULL;

SELECT 
  '4b. Active athletes missing coach_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All active athletes have coach_id'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' active athletes missing coach_id'
  END as result,
  COUNT(*) as count
FROM profiles
WHERE role = 'athlete'
  AND membership_status = 'active'
  AND coach_id IS NULL;

-- Show statistics
SELECT 
  '4c. Active athletes statistics' as check_name,
  COUNT(*) as total_active_athletes,
  COUNT(club_id) as with_club,
  COUNT(coach_id) as with_coach,
  COUNT(*) - COUNT(club_id) as missing_club,
  COUNT(*) - COUNT(coach_id) as missing_coach
FROM profiles
WHERE role = 'athlete'
  AND membership_status = 'active';

-- ============================================================================
-- CHECK 5: Coaches and admins are always active
-- ============================================================================
SELECT 
  '5a. Coaches without active status' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All coaches have active status'
    ELSE '❌ FAIL: ' || COUNT(*) || ' coaches without active status'
  END as result,
  COUNT(*) as count
FROM profiles
WHERE role = 'coach'
  AND membership_status != 'active';

SELECT 
  '5b. Admins without active status' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All admins have active status'
    ELSE '❌ FAIL: ' || COUNT(*) || ' admins without active status'
  END as result,
  COUNT(*) as count
FROM profiles
WHERE role = 'admin'
  AND membership_status != 'active';

-- Show any non-active coaches/admins
SELECT 
  '5c. Non-active coaches/admins' as check_name,
  role,
  membership_status,
  COUNT(*) as count
FROM profiles
WHERE role IN ('coach', 'admin')
  AND membership_status != 'active'
GROUP BY role, membership_status;

-- ============================================================================
-- CHECK 6: RLS policies work correctly
-- ============================================================================
SELECT 
  '6a. RLS enabled on tables' as check_name,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('membership_applications', 'profiles')
  AND schemaname = 'public'
ORDER BY tablename;

-- Count RLS policies on membership_applications
SELECT 
  '6b. RLS policies on membership_applications' as check_name,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ PASS: RLS policies exist on membership_applications'
    ELSE '⚠️  WARNING: Expected at least 4 RLS policies on membership_applications'
  END as result
FROM pg_policies
WHERE tablename = 'membership_applications';

-- ============================================================================
-- CHECK 7: No orphaned data
-- ============================================================================
SELECT 
  '7a. Applications with invalid club_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No applications with invalid club_id'
    ELSE '❌ FAIL: ' || COUNT(*) || ' applications with invalid club_id'
  END as result,
  COUNT(*) as count
FROM membership_applications ma
WHERE NOT EXISTS (
  SELECT 1 FROM clubs c WHERE c.id = ma.club_id
);

SELECT 
  '7b. Applications with invalid user_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No applications with invalid user_id'
    ELSE '❌ FAIL: ' || COUNT(*) || ' applications with invalid user_id'
  END as result,
  COUNT(*) as count
FROM membership_applications ma
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = ma.user_id
);

SELECT 
  '7c. Profiles with invalid club_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No profiles with invalid club_id'
    ELSE '❌ FAIL: ' || COUNT(*) || ' profiles with invalid club_id'
  END as result,
  COUNT(*) as count
FROM profiles p
WHERE p.club_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM clubs c WHERE c.id = p.club_id
  );

-- ============================================================================
-- CHECK 8: Status consistency between profiles and applications
-- ============================================================================
SELECT 
  '8a. Active athletes without approved applications' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All active athletes have approved applications'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' active athletes without approved applications'
  END as result,
  COUNT(*) as count
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM membership_applications ma
    WHERE ma.user_id = p.id
      AND ma.status = 'approved'
  );

SELECT 
  '8b. Pending athletes without pending applications' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All pending athletes have pending applications'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' pending athletes without pending applications'
  END as result,
  COUNT(*) as count
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM membership_applications ma
    WHERE ma.user_id = p.id
      AND ma.status = 'pending'
  );

-- ============================================================================
-- CHECK 9: No duplicate pending applications
-- ============================================================================
SELECT 
  '9. Users with multiple pending applications' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: No users with multiple pending applications'
    ELSE '❌ FAIL: ' || COUNT(*) || ' users have multiple pending applications'
  END as result,
  COUNT(*) as count
FROM (
  SELECT user_id, COUNT(*) as pending_count
  FROM membership_applications
  WHERE status = 'pending'
  GROUP BY user_id
  HAVING COUNT(*) > 1
) duplicates;

-- ============================================================================
-- CHECK 10: Rejected applications have rejection_reason
-- ============================================================================
SELECT 
  '10. Rejected applications missing rejection_reason' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS: All rejected applications have rejection_reason'
    ELSE '⚠️  WARNING: ' || COUNT(*) || ' rejected applications missing rejection_reason'
  END as result,
  COUNT(*) as count
FROM membership_applications
WHERE status = 'rejected'
  AND (rejection_reason IS NULL OR rejection_reason = '');

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================
SELECT 
  'SUMMARY' as section,
  'Total Profiles' as metric,
  COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Athletes' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'athlete'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Coaches' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'coach'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Admins' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'admin'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Active Athletes' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'athlete' AND membership_status = 'active'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Pending Athletes' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'athlete' AND membership_status = 'pending'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Rejected Athletes' as metric,
  COUNT(*) as count
FROM profiles WHERE role = 'athlete' AND membership_status = 'rejected'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Total Applications' as metric,
  COUNT(*) as count
FROM membership_applications
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Approved Applications' as metric,
  COUNT(*) as count
FROM membership_applications WHERE status = 'approved'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Pending Applications' as metric,
  COUNT(*) as count
FROM membership_applications WHERE status = 'pending'
UNION ALL
SELECT 
  'SUMMARY' as section,
  'Rejected Applications' as metric,
  COUNT(*) as count
FROM membership_applications WHERE status = 'rejected'
ORDER BY section, metric;
