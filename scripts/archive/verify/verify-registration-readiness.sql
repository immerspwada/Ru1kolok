-- Verify Registration System Readiness
-- Check all components needed for registration flow

-- 1. Check clubs are available
SELECT 
  'Clubs Available' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM clubs;

-- 2. Check clubs have coaches
SELECT 
  c.name as club_name,
  c.sport_type,
  COUNT(co.id) as coach_count,
  CASE WHEN COUNT(co.id) > 0 THEN '✓ Has Coaches' ELSE '✗ No Coaches' END as status
FROM clubs c
LEFT JOIN coaches co ON co.club_id = c.id
GROUP BY c.id, c.name, c.sport_type
ORDER BY c.name;

-- 3. Check helper functions exist
SELECT 
  'Helper Functions' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) >= 4 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_duplicate_pending_application',
    'update_application_status',
    'add_activity_log',
    'validate_coach_club'
  );

-- 4. List all helper functions
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_duplicate_pending_application',
    'update_application_status',
    'add_activity_log',
    'validate_coach_club'
  )
ORDER BY routine_name;

-- 5. Check RLS policies for membership_applications
SELECT 
  'RLS Policies' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) > 0 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM pg_policies
WHERE tablename = 'membership_applications';

-- 6. List RLS policies
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%insert%' THEN 'Allow Insert'
    WHEN policyname LIKE '%select%' THEN 'Allow Select'
    WHEN policyname LIKE '%update%' THEN 'Allow Update'
    ELSE 'Other'
  END as purpose
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

-- 7. Check profiles table has membership_status column
SELECT 
  'Profiles Table' as check_name,
  COUNT(*) as columns_found,
  CASE WHEN COUNT(*) >= 2 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('membership_status', 'role');

-- 8. Check athletes table structure
SELECT 
  'Athletes Table' as check_name,
  COUNT(*) as columns_found,
  CASE WHEN COUNT(*) >= 6 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'athletes'
  AND column_name IN ('user_id', 'club_id', 'first_name', 'last_name', 'gender', 'date_of_birth');

-- 9. Check recent applications (last 7 days)
SELECT 
  'Recent Applications' as check_name,
  COUNT(*) as count,
  '✓ INFO' as status
FROM membership_applications
WHERE created_at > NOW() - INTERVAL '7 days';

-- 10. Show recent applications details
SELECT 
  ma.id,
  ma.status,
  ma.created_at,
  c.name as club_name,
  (ma.personal_info->>'full_name') as applicant_name
FROM membership_applications ma
JOIN clubs c ON c.id = ma.club_id
WHERE ma.created_at > NOW() - INTERVAL '7 days'
ORDER BY ma.created_at DESC
LIMIT 10;

-- 11. Check for pending applications
SELECT 
  'Pending Applications' as check_name,
  COUNT(*) as count,
  '✓ INFO' as status
FROM membership_applications
WHERE status = 'pending';

-- 12. Summary
SELECT 
  '=== REGISTRATION SYSTEM STATUS ===' as summary,
  CASE 
    WHEN (SELECT COUNT(*) FROM clubs) > 0 
      AND (SELECT COUNT(*) FROM coaches) > 0
      AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'membership_applications') > 0
    THEN '✓ READY FOR PRODUCTION'
    ELSE '✗ NOT READY - Missing Components'
  END as status;
