-- Verify Test Environment for Manual Testing
-- Run this before starting manual tests

-- 1. Check if test users exist
SELECT 
  'Test Users' as check_type,
  email,
  role,
  membership_status,
  club_id IS NOT NULL as has_club,
  coach_id IS NOT NULL as has_coach
FROM profiles
WHERE email IN ('admin@test.com', 'coach@test.com', 'athlete@test.com')
ORDER BY role;

-- 2. Check if clubs exist
SELECT 
  'Clubs' as check_type,
  id,
  name,
  sport_type,
  created_at
FROM clubs
ORDER BY created_at
LIMIT 5;

-- 3. Check coach club assignments
SELECT 
  'Coach Assignments' as check_type,
  p.email,
  p.club_id,
  c.name as club_name,
  c.sport_type
FROM profiles p
LEFT JOIN clubs c ON c.id = p.club_id
WHERE p.role = 'coach';

-- 4. Check existing membership applications
SELECT 
  'Existing Applications' as check_type,
  ma.id,
  p.email as applicant_email,
  c.name as club_name,
  ma.status,
  ma.created_at
FROM membership_applications ma
JOIN profiles p ON p.id = ma.user_id
LEFT JOIN clubs c ON c.id = ma.club_id
ORDER BY ma.created_at DESC
LIMIT 10;

-- 5. Check for pending applications
SELECT 
  'Pending Applications Count' as check_type,
  COUNT(*) as count
FROM membership_applications
WHERE status = 'pending';

-- 6. Check helper functions exist
SELECT 
  'Helper Functions' as check_type,
  proname as function_name,
  pg_get_functiondef(oid) LIKE '%check_duplicate%' as is_duplicate_check
FROM pg_proc
WHERE proname IN (
  'check_duplicate_pending_application',
  'expire_old_applications',
  'validate_coach_club_match'
)
ORDER BY proname;

-- 7. Check RLS policies on membership_applications
SELECT 
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  cmd as command,
  roles
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

-- 8. Check if membership_status constraint exists
SELECT 
  'Constraints' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname LIKE '%membership%';

-- 9. Summary of athlete statuses
SELECT 
  'Athlete Status Summary' as check_type,
  membership_status,
  COUNT(*) as count
FROM profiles
WHERE role = 'athlete'
GROUP BY membership_status
ORDER BY membership_status;

-- 10. Check for orphaned data
SELECT 
  'Data Integrity Check' as check_type,
  'Athletes without applications' as issue,
  COUNT(*) as count
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM membership_applications ma 
    WHERE ma.user_id = p.id AND ma.status = 'approved'
  );

SELECT 
  'Data Integrity Check' as check_type,
  'Approved applications without active profiles' as issue,
  COUNT(*) as count
FROM membership_applications ma
WHERE ma.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = ma.user_id AND p.membership_status = 'active'
  );
