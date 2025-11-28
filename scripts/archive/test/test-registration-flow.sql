-- Test Registration Flow on Production
-- This script verifies the complete registration flow works correctly

-- 1. Check clubs table has active clubs
SELECT 
  id,
  name,
  sport_type,
  (SELECT COUNT(*) FROM coaches WHERE club_id = clubs.id) as coach_count
FROM clubs
ORDER BY name;

-- 2. Check RLS policies for membership_applications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

-- 3. Check helper functions exist
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_duplicate_pending_application',
    'update_application_status',
    'add_activity_log',
    'validate_coach_club'
  )
ORDER BY routine_name;

-- 4. Check storage bucket exists and has correct policies
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'membership-documents';

-- 5. Check storage policies
SELECT 
  name,
  bucket_id,
  definition
FROM storage.policies
WHERE bucket_id = 'membership-documents'
ORDER BY name;

-- 6. Test duplicate check function
-- This should return false for a new user
SELECT check_duplicate_pending_application('00000000-0000-0000-0000-000000000000'::uuid);

-- 7. Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'membership_status', 'role')
ORDER BY ordinal_position;

-- 8. Check athletes table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'athletes'
  AND column_name IN ('user_id', 'club_id', 'first_name', 'last_name', 'gender', 'date_of_birth')
ORDER BY ordinal_position;

-- 9. Verify indexes exist for performance
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'membership_applications'
  AND indexname LIKE '%user%' OR indexname LIKE '%club%' OR indexname LIKE '%status%'
ORDER BY indexname;

-- 10. Check recent applications (last 24 hours)
SELECT 
  ma.id,
  ma.status,
  ma.created_at,
  c.name as club_name,
  (ma.personal_info->>'full_name') as applicant_name
FROM membership_applications ma
JOIN clubs c ON c.id = ma.club_id
WHERE ma.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ma.created_at DESC
LIMIT 10;
