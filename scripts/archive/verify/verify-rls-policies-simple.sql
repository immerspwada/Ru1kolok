-- ============================================================================
-- RLS Policy Verification (Simple API Compatible Version)
-- ============================================================================
-- Description: Verify all RLS policies for membership approval system
-- Task: 5.3 - Verify RLS policies work correctly
-- ============================================================================

-- Check 1: Verify RLS is enabled
SELECT 
  'RLS Status' AS check_name,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END AS status
FROM pg_tables
WHERE tablename = 'membership_applications';

-- Check 2: Count policies
SELECT 
  'Policy Count' AS check_name,
  COUNT(*)::text || ' policies found (expected 6)' AS status
FROM pg_policies
WHERE tablename = 'membership_applications';

-- Check 3: List all policies
SELECT 
  'Policy: ' || policyname AS check_name,
  '✓ EXISTS (' || cmd || ')' AS status
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

-- Check 4: CP5 - Single Active Application
SELECT 
  'CP5: Single Active Application' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - No users with multiple pending applications'
    ELSE '✗ FAIL - ' || COUNT(*)::text || ' users have multiple pending applications'
  END AS status
FROM (
  SELECT user_id
  FROM membership_applications
  WHERE status = 'pending'
  GROUP BY user_id
  HAVING COUNT(*) > 1
) violations;

-- Check 5: CP1 - Club-Coach Consistency
SELECT 
  'CP1: Club-Coach Consistency' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All approved applications have consistent club_id'
    ELSE '✗ FAIL - ' || COUNT(*)::text || ' approved applications have inconsistent club_id'
  END AS status
FROM membership_applications ma
JOIN profiles p ON p.id = ma.user_id
LEFT JOIN profiles coach_profile ON coach_profile.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND (ma.club_id != p.club_id OR ma.club_id != coach_profile.club_id);

-- Check 6: BR4 - Rejection Reason Required
SELECT 
  'BR4: Rejection Reason Required' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All rejected applications have reasons'
    ELSE '✗ FAIL - ' || COUNT(*)::text || ' rejected applications missing reasons'
  END AS status
FROM membership_applications
WHERE status = 'rejected'
  AND (rejection_reason IS NULL OR rejection_reason = '');

-- Check 7: CP2 - Status Transition Validity
SELECT 
  'CP2: Status Transition Validity' AS check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ PASS - All applications have valid status values'
    ELSE '✗ FAIL - ' || COUNT(*)::text || ' applications have invalid status'
  END AS status
FROM membership_applications
WHERE status NOT IN ('pending', 'approved', 'rejected');

-- Summary: Count applications by status
SELECT 
  'Summary: Applications by Status' AS info,
  status,
  COUNT(*) AS count
FROM membership_applications
GROUP BY status
ORDER BY status;

-- Summary: Total policy count
SELECT 
  'Summary: Total Policies' AS info,
  COUNT(*) AS policy_count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✓ Sufficient'
    ELSE '✗ Insufficient'
  END AS assessment
FROM pg_policies
WHERE tablename = 'membership_applications';
