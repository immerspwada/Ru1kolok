-- ============================================================================
-- Verification Script for Membership Helper Functions
-- ============================================================================
-- Description: Verify that all helper functions were created and work correctly
-- Related: Task 1.4 - Create helper functions
-- ============================================================================

-- ============================================================================
-- 1. Check that all functions exist
-- ============================================================================
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'expire_old_applications',
    'check_duplicate_pending_application',
    'validate_coach_club_relationship'
  )
ORDER BY p.proname;

-- ============================================================================
-- 2. Test expire_old_applications function
-- ============================================================================
-- This should return 0 expired applications if no old pending applications exist
SELECT * FROM expire_old_applications();

-- ============================================================================
-- 3. Test check_duplicate_pending_application function
-- ============================================================================
-- Test with a non-existent user (should return has_pending = false)
SELECT * FROM check_duplicate_pending_application('00000000-0000-0000-0000-000000000000'::UUID);

-- ============================================================================
-- 4. Test validate_coach_club_relationship function
-- ============================================================================
-- Test with non-existent coach and club (should return false)
SELECT validate_coach_club_relationship(
  '00000000-0000-0000-0000-000000000000'::UUID,
  '00000000-0000-0000-0000-000000000000'::UUID
) as is_valid;

-- ============================================================================
-- 5. Check function comments
-- ============================================================================
SELECT 
  p.proname as function_name,
  d.description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
LEFT JOIN pg_description d ON d.objoid = p.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'expire_old_applications',
    'check_duplicate_pending_application',
    'validate_coach_club_relationship'
  )
ORDER BY p.proname;
