-- ============================================================================
-- Manual RLS Policy Testing
-- ============================================================================
-- This script manually tests RLS policies by checking the database state
-- ============================================================================

-- Test 1: Check that RLS is enabled on membership_applications
SELECT 
  '1. RLS Enabled Check' AS test,
  CASE WHEN rowsecurity THEN '✓ PASS' ELSE '✗ FAIL' END AS result
FROM pg_tables
WHERE tablename = 'membership_applications';

-- Test 2: Check that all required policies exist
SELECT 
  '2. Required Policies Check' AS test,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✓ PASS - ' || COUNT(*)::text || ' policies found'
    ELSE '✗ FAIL - Only ' || COUNT(*)::text || ' policies found (expected 6)'
  END AS result
FROM pg_policies
WHERE tablename = 'membership_applications';

-- Test 3: List all policies for verification
SELECT 
  '3. Policy List' AS test,
  policyname AS policy_name,
  cmd AS operation
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

-- Test 4: Check for duplicate pending applications (CP5)
SELECT 
  '4. CP5: Single Active Application' AS test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - No duplicate pending applications'
    ELSE '✗ FAIL - Found ' || COUNT(*)::text || ' users with multiple pending apps'
  END AS result
FROM (
  SELECT user_id, COUNT(*) as app_count
  FROM membership_applications
  WHERE status = 'pending'
  GROUP BY user_id
  HAVING COUNT(*) > 1
) duplicates;

-- Test 5: Check club-coach consistency for approved applications (CP1)
SELECT 
  '5. CP1: Club-Coach Consistency' AS test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All approved apps have consistent club_id'
    ELSE '✗ FAIL - Found ' || COUNT(*)::text || ' inconsistent approved apps'
  END AS result
FROM membership_applications ma
LEFT JOIN profiles athlete_profile ON athlete_profile.id = ma.user_id
LEFT JOIN profiles coach_profile ON coach_profile.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND (
    ma.club_id != athlete_profile.club_id 
    OR ma.club_id != coach_profile.club_id
  );

-- Test 6: Check rejection reasons are provided (BR4)
SELECT 
  '6. BR4: Rejection Reason Required' AS test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All rejected apps have reasons'
    ELSE '✗ FAIL - Found ' || COUNT(*)::text || ' rejected apps without reasons'
  END AS result
FROM membership_applications
WHERE status = 'rejected'
  AND (rejection_reason IS NULL OR rejection_reason = '');

-- Test 7: Check status values are valid (CP2)
SELECT 
  '7. CP2: Valid Status Values' AS test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All status values are valid'
    ELSE '✗ FAIL - Found ' || COUNT(*)::text || ' apps with invalid status'
  END AS result
FROM membership_applications
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- Test 8: Check that coaches have club_id set
SELECT 
  '8. Coach Setup Check' AS test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All coaches have club_id'
    ELSE '✗ FAIL - Found ' || COUNT(*)::text || ' coaches without club_id'
  END AS result
FROM user_roles ur
JOIN profiles p ON p.id = ur.user_id
WHERE ur.role = 'coach'
  AND p.club_id IS NULL;

-- Test 9: Check that approved athletes have club_id and coach_id
SELECT 
  '9. Approved Athlete Setup Check' AS test,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All approved athletes have club_id and coach_id'
    ELSE '✗ FAIL - Found ' || COUNT(*)::text || ' approved athletes with missing data'
  END AS result
FROM membership_applications ma
JOIN profiles p ON p.id = ma.user_id
WHERE ma.status = 'approved'
  AND (p.club_id IS NULL OR p.coach_id IS NULL);

-- Test 10: Summary statistics
SELECT 
  '10. Summary Statistics' AS test,
  'Total: ' || COUNT(*) || 
  ', Pending: ' || SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) ||
  ', Approved: ' || SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) ||
  ', Rejected: ' || SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS result
FROM membership_applications;

-- Final Summary
SELECT 
  'FINAL SUMMARY' AS test,
  CASE 
    WHEN (
      -- RLS enabled
      (SELECT rowsecurity FROM pg_tables WHERE tablename = 'membership_applications') = true
      -- Sufficient policies
      AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'membership_applications') >= 6
      -- No duplicate pending
      AND (SELECT COUNT(*) FROM (SELECT user_id FROM membership_applications WHERE status = 'pending' GROUP BY user_id HAVING COUNT(*) > 1) d) = 0
      -- No inconsistent approved
      AND (SELECT COUNT(*) FROM membership_applications ma LEFT JOIN profiles ap ON ap.id = ma.user_id LEFT JOIN profiles cp ON cp.id = ma.assigned_coach_id WHERE ma.status = 'approved' AND ma.assigned_coach_id IS NOT NULL AND (ma.club_id != ap.club_id OR ma.club_id != cp.club_id)) = 0
      -- No missing rejection reasons
      AND (SELECT COUNT(*) FROM membership_applications WHERE status = 'rejected' AND (rejection_reason IS NULL OR rejection_reason = '')) = 0
      -- No invalid statuses
      AND (SELECT COUNT(*) FROM membership_applications WHERE status NOT IN ('pending', 'approved', 'rejected')) = 0
    ) THEN '✓✓✓ ALL TESTS PASSED ✓✓✓'
    ELSE '✗✗✗ SOME TESTS FAILED ✗✗✗'
  END AS result;
