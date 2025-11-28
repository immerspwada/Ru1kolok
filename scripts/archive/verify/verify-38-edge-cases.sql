-- ============================================================================
-- Verify Edge Case Handling - Migration 38
-- ============================================================================
-- Description: Verify all edge cases have been properly handled
-- ============================================================================

-- Summary Report Header
SELECT '============================================' as separator;
SELECT 'EDGE CASE VERIFICATION REPORT' as title;
SELECT '============================================' as separator;
SELECT NOW() as verification_time;
SELECT '============================================' as separator;

-- Check 1: Athletes without applications
SELECT 
  '1. Athletes Without Applications' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Athletes exist without applications'
  END as status
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'athlete'
  AND NOT EXISTS (
    SELECT 1 FROM membership_applications ma WHERE ma.user_id = p.id
  );

-- Check 2: Active athletes without coach
SELECT 
  '2. Active Athletes Without Coach' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    WHEN COUNT(*) <= 2 THEN '⚠️  WARNING - Few athletes without coach'
    ELSE '❌ FAIL - Many athletes without coach'
  END as status
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.coach_id IS NULL;

-- Check 3: Orphaned applications
SELECT 
  '3. Orphaned Applications' as check_name,
  COUNT(*) as total_orphaned,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN status != 'rejected' THEN 1 END) as not_rejected,
  CASE 
    WHEN COUNT(CASE WHEN status != 'rejected' THEN 1 END) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Orphaned applications not rejected'
  END as status
FROM membership_applications ma
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = ma.user_id
);

-- Check 4: Applications with invalid clubs
SELECT 
  '4. Applications with Invalid Clubs' as check_name,
  COUNT(*) as total_invalid,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN status != 'rejected' THEN 1 END) as not_rejected,
  CASE 
    WHEN COUNT(CASE WHEN status != 'rejected' THEN 1 END) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Invalid club applications not rejected'
  END as status
FROM membership_applications ma
WHERE ma.club_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM clubs c WHERE c.id = ma.club_id
  );

-- Check 5: Multiple approved applications per user
SELECT 
  '5. Users with Multiple Approved Applications' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Users have multiple approved applications'
  END as status
FROM (
  SELECT user_id, COUNT(*) as app_count
  FROM membership_applications
  WHERE status = 'approved'
  GROUP BY user_id
  HAVING COUNT(*) > 1
) subq;

-- Check 6: Coach-club inconsistencies
SELECT 
  '6. Athletes with Coach from Different Club' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Coach-club inconsistencies exist'
  END as status
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'athlete'
  AND p.coach_id IS NOT NULL
  AND p.club_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles coach
    JOIN user_roles ur_coach ON ur_coach.user_id = coach.id
    WHERE coach.id = p.coach_id
      AND ur_coach.role = 'coach'
      AND coach.club_id != p.club_id
  );

-- Check 7: Active athletes without club
SELECT 
  '7. Active Athletes Without Club' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Active athletes without club assignment'
  END as status
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.club_id IS NULL;

-- Check 8: Approved applications without assigned_coach_id
SELECT 
  '8. Approved Applications Without Assigned Coach' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    WHEN COUNT(*) <= 2 THEN '⚠️  WARNING - Few applications without assigned coach'
    ELSE '❌ FAIL - Many applications without assigned coach'
  END as status
FROM membership_applications
WHERE status = 'approved'
  AND assigned_coach_id IS NULL;

-- Check 9: Old pending applications (should be rejected)
SELECT 
  '9. Old Pending Applications' as check_name,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as still_pending,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  CASE 
    WHEN COUNT(CASE WHEN status = 'pending' THEN 1 END) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL - Old applications still pending'
  END as status
FROM membership_applications
WHERE created_at < NOW() - INTERVAL '30 days';

-- Summary Statistics
SELECT '============================================' as separator;
SELECT 'SUMMARY STATISTICS' as title;
SELECT '============================================' as separator;

-- Profile statistics by role and status
SELECT 
  'Profile Statistics' as category,
  ur.role,
  p.membership_status,
  COUNT(*) as count
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
GROUP BY ur.role, p.membership_status
ORDER BY ur.role, p.membership_status;

-- Application statistics by status
SELECT 
  'Application Statistics' as category,
  status,
  COUNT(*) as count,
  COUNT(assigned_coach_id) as with_assigned_coach,
  COUNT(club_id) as with_club
FROM membership_applications
GROUP BY status
ORDER BY status;

-- Athletes with complete data
SELECT 
  'Athletes with Complete Data' as category,
  COUNT(*) as total_athletes,
  COUNT(CASE WHEN p.coach_id IS NOT NULL THEN 1 END) as with_coach,
  COUNT(CASE WHEN p.club_id IS NOT NULL THEN 1 END) as with_club,
  COUNT(CASE WHEN p.coach_id IS NOT NULL AND p.club_id IS NOT NULL THEN 1 END) as with_both
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'athlete'
  AND p.membership_status = 'active';

-- Final Summary
SELECT '============================================' as separator;
SELECT 'END OF VERIFICATION REPORT' as title;
SELECT '============================================' as separator;
