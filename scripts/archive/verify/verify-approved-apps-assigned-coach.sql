-- ============================================================================
-- Verify Approved Applications Have assigned_coach_id
-- ============================================================================
-- Task 5.3: Check approved applications have assigned_coach_id
-- This is a critical data integrity check for the membership approval system
-- ============================================================================

-- Check 1: Count approved applications missing assigned_coach_id
SELECT 
  '❌ CRITICAL: Approved apps missing assigned_coach_id' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All approved applications have assigned_coach_id'
    ELSE '❌ FAIL - Found ' || COUNT(*) || ' approved applications without assigned_coach_id'
  END as status
FROM membership_applications
WHERE status = 'approved'
  AND assigned_coach_id IS NULL;

-- Check 2: Show all approved applications with their coach assignments
SELECT 
  'Approved Applications Summary' as report_section,
  ma.id as application_id,
  ma.user_id,
  u.email as athlete_email,
  ma.club_id,
  c.name as club_name,
  ma.assigned_coach_id,
  coach.email as coach_email,
  ma.review_info->>'reviewed_at' as reviewed_at,
  ma.created_at as applied_at
FROM membership_applications ma
LEFT JOIN auth.users u ON u.id = ma.user_id
LEFT JOIN clubs c ON c.id = ma.club_id
LEFT JOIN profiles coach_profile ON coach_profile.id = ma.assigned_coach_id
LEFT JOIN auth.users coach ON coach.id = coach_profile.id
WHERE ma.status = 'approved'
ORDER BY ma.created_at DESC
LIMIT 20;

-- Check 3: Verify coach-club consistency for approved applications
SELECT 
  '⚠️  Coach-Club Consistency Check' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS - All coaches belong to the correct club'
    ELSE '❌ FAIL - Found ' || COUNT(*) || ' mismatched coach-club assignments'
  END as status
FROM membership_applications ma
JOIN profiles coach ON coach.id = ma.assigned_coach_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NOT NULL
  AND ma.club_id != coach.club_id;

-- Check 4: Show statistics
SELECT 
  'Statistics' as report_section,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'approved' AND assigned_coach_id IS NOT NULL) as approved_with_coach,
  COUNT(*) FILTER (WHERE status = 'approved' AND assigned_coach_id IS NULL) as approved_without_coach,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) as total_applications
FROM membership_applications;

-- Check 5: Show any problematic approved applications (if any)
SELECT 
  'Problematic Approved Applications' as report_section,
  ma.id as application_id,
  ma.user_id,
  u.email as athlete_email,
  ma.club_id,
  c.name as club_name,
  ma.assigned_coach_id,
  ma.review_info->>'reviewed_at' as reviewed_at,
  'Missing assigned_coach_id' as issue
FROM membership_applications ma
LEFT JOIN auth.users u ON u.id = ma.user_id
LEFT JOIN clubs c ON c.id = ma.club_id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NULL
LIMIT 10;
