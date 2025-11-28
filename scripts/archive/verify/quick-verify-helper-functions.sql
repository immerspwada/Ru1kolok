-- Quick verification that all helper functions exist and are callable

-- 1. List all three functions
SELECT 
  p.proname as function_name,
  'EXISTS' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'expire_old_applications',
    'check_duplicate_pending_application',
    'validate_coach_club_relationship'
  )
ORDER BY p.proname;

-- 2. Test expire_old_applications (should return 0 if no old applications)
SELECT 
  'expire_old_applications' as function_name,
  expired_count,
  CASE 
    WHEN expired_count = 0 THEN 'PASS - No old applications to expire'
    ELSE 'INFO - Expired ' || expired_count || ' applications'
  END as result
FROM expire_old_applications();

-- 3. Test check_duplicate_pending_application with dummy UUID
SELECT 
  'check_duplicate_pending_application' as function_name,
  has_pending,
  CASE 
    WHEN has_pending = FALSE THEN 'PASS - Returns false for non-existent user'
    ELSE 'UNEXPECTED - Should return false for dummy UUID'
  END as result
FROM check_duplicate_pending_application('00000000-0000-0000-0000-000000000000'::UUID);

-- 4. Test validate_coach_club_relationship with dummy UUIDs
SELECT 
  'validate_coach_club_relationship' as function_name,
  validate_coach_club_relationship(
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID
  ) as is_valid,
  CASE 
    WHEN validate_coach_club_relationship(
      '00000000-0000-0000-0000-000000000000'::UUID,
      '00000000-0000-0000-0000-000000000000'::UUID
    ) = FALSE THEN 'PASS - Returns false for non-existent coach/club'
    ELSE 'UNEXPECTED - Should return false for dummy UUIDs'
  END as result;
