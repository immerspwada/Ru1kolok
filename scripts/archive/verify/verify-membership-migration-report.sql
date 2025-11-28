-- ============================================================================
-- Comprehensive Membership Migration Data Integrity Report
-- ============================================================================
-- Task 5.3: Verify data integrity after production migration
-- ============================================================================

-- CHECK 1: All profiles have membership_status set
SELECT 
  '1. Profiles with NULL membership_status' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as count
FROM profiles
WHERE membership_status IS NULL;

-- CHECK 2: Approved applications have assigned_coach_id
SELECT 
  '2. Approved apps missing assigned_coach_id' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as count
FROM membership_applications
WHERE status = 'approved'
  AND assigned_coach_id IS NULL;

-- CHECK 3: Coach-club consistency
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
  AND ma.club_id != coach.club_id;

-- CHECK 4a: Active athletes have club_id
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
  AND club_id IS NULL;

-- CHECK 4b: Active athletes have coach_id
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
  AND coach_id IS NULL;

-- CHECK 5a: Coaches have active status
SELECT 
  '5a. Coaches without active status' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as count
FROM profiles
WHERE role = 'coach'
  AND membership_status != 'active';

-- CHECK 5b: Admins have active status
SELECT 
  '5b. Admins without active status' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as count
FROM profiles
WHERE role = 'admin'
  AND membership_status != 'active';

-- CHECK 7a: Applications with invalid club_id
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
);

-- CHECK 7b: Applications with invalid user_id
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
);

-- CHECK 7c: Profiles with invalid club_id
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
  );

-- CHECK 8a: Active athletes have approved applications
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
  );

-- CHECK 9: No duplicate pending applications
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
) duplicates;

-- CHECK 10: Rejected applications have rejection_reason
SELECT 
  '10. Rejected apps missing reason' as check_name,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ PASS'
    ELSE '⚠️  WARNING'
  END as status,
  COUNT(*) as count
FROM membership_applications
WHERE status = 'rejected'
  AND (rejection_reason IS NULL OR rejection_reason = '');
