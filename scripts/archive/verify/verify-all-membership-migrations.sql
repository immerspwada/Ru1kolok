-- ============================================================================
-- Comprehensive Verification Script for Membership Approval System Migrations
-- ============================================================================
-- This script verifies that all migrations (31-35) have been successfully applied
-- Task: 5.1 - Verify all migrations successful
-- ============================================================================

\echo '=============================================================================='
\echo 'MEMBERSHIP APPROVAL SYSTEM - MIGRATION VERIFICATION'
\echo '=============================================================================='
\echo ''

-- ============================================================================
-- Migration 31: membership_applications columns
-- ============================================================================
\echo '1. Verifying Migration 31: membership_applications columns...'
\echo '----------------------------------------------------------------------'

SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN '✓ PASS: All 3 columns exist'
    ELSE '✗ FAIL: Missing columns (found ' || COUNT(*) || ' of 3)'
  END as status,
  string_agg(column_name, ', ') as found_columns
FROM information_schema.columns
WHERE table_name = 'membership_applications'
  AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason');

-- Check indexes
SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN '✓ PASS: All 3 indexes exist'
    ELSE '✗ FAIL: Missing indexes (found ' || COUNT(*) || ' of 3)'
  END as status,
  string_agg(indexname, ', ') as found_indexes
FROM pg_indexes
WHERE tablename = 'membership_applications'
  AND indexname IN ('idx_applications_club_status', 'idx_applications_assigned_coach', 'idx_applications_reviewed_by');

\echo ''

-- ============================================================================
-- Migration 32: profiles membership_status
-- ============================================================================
\echo '2. Verifying Migration 32: profiles membership_status...'
\echo '----------------------------------------------------------------------'

-- Check enum type exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') 
    THEN '✓ PASS: membership_status enum type exists'
    ELSE '✗ FAIL: membership_status enum type missing'
  END as status;

-- Check enum values
SELECT 
  CASE 
    WHEN COUNT(*) = 4 THEN '✓ PASS: All 4 enum values exist'
    ELSE '✗ FAIL: Missing enum values (found ' || COUNT(*) || ' of 4)'
  END as status,
  string_agg(enumlabel::text, ', ' ORDER BY enumsortorder) as enum_values
FROM pg_enum 
WHERE enumtypid = 'membership_status'::regtype;

-- Check columns
SELECT 
  CASE 
    WHEN COUNT(*) >= 2 THEN '✓ PASS: membership_status and coach_id columns exist'
    ELSE '✗ FAIL: Missing columns (found ' || COUNT(*) || ' of 2)'
  END as status,
  string_agg(column_name, ', ') as found_columns
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('membership_status', 'coach_id');

-- Check indexes
SELECT 
  CASE 
    WHEN COUNT(*) >= 2 THEN '✓ PASS: Required indexes exist'
    ELSE '✗ FAIL: Missing indexes (found ' || COUNT(*) || ' of 2)'
  END as status,
  string_agg(indexname, ', ') as found_indexes
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname IN ('idx_profiles_membership_status', 'idx_profiles_coach_id');

\echo ''

-- ============================================================================
-- Migration 33: RLS Policies
-- ============================================================================
\echo '3. Verifying Migration 33: RLS Policies...'
\echo '----------------------------------------------------------------------'

SELECT 
  CASE 
    WHEN COUNT(*) >= 6 THEN '✓ PASS: All required RLS policies exist'
    ELSE '✗ FAIL: Missing policies (found ' || COUNT(*) || ' of 6)'
  END as status,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'membership_applications'
  AND policyname IN (
    'coach_view_own_club_applications',
    'coach_approve_own_club_applications',
    'athlete_view_own_applications',
    'admin_view_all_applications',
    'admin_update_all_applications',
    'admin_insert_applications'
  );

-- List all policies
\echo ''
\echo 'Existing policies on membership_applications:'
SELECT policyname, cmd as command
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

\echo ''

-- ============================================================================
-- Migration 34: Helper Functions
-- ============================================================================
\echo '4. Verifying Migration 34: Helper Functions...'
\echo '----------------------------------------------------------------------'

SELECT 
  CASE 
    WHEN COUNT(*) = 3 THEN '✓ PASS: All 3 helper functions exist'
    ELSE '✗ FAIL: Missing functions (found ' || COUNT(*) || ' of 3)'
  END as status,
  string_agg(proname, ', ') as found_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'expire_old_applications',
    'check_duplicate_pending_application',
    'validate_coach_club_relationship'
  );

-- Test function signatures
\echo ''
\echo 'Function signatures:'
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

\echo ''

-- ============================================================================
-- Migration 35: sport_type column
-- ============================================================================
\echo '5. Verifying Migration 35: sport_type column...'
\echo '----------------------------------------------------------------------'

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'clubs' AND column_name = 'sport_type'
    ) THEN '✓ PASS: sport_type column exists'
    ELSE '✗ FAIL: sport_type column missing'
  END as status;

-- Check column details
SELECT 
  column_name,
  data_type,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'clubs' AND column_name = 'sport_type';

-- Check index
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'clubs' AND indexname = 'idx_clubs_sport_type'
    ) THEN '✓ PASS: sport_type index exists'
    ELSE '✗ FAIL: sport_type index missing'
  END as status;

\echo ''

-- ============================================================================
-- Overall Summary
-- ============================================================================
\echo '=============================================================================='
\echo 'OVERALL MIGRATION STATUS SUMMARY'
\echo '=============================================================================='

WITH migration_checks AS (
  SELECT 
    '31' as migration,
    'membership_applications columns' as description,
    (SELECT COUNT(*) = 3 FROM information_schema.columns
     WHERE table_name = 'membership_applications'
     AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason')) as passed
  UNION ALL
  SELECT 
    '32' as migration,
    'profiles membership_status' as description,
    (SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'membership_status')) as passed
  UNION ALL
  SELECT 
    '33' as migration,
    'RLS policies' as description,
    (SELECT COUNT(*) >= 6 FROM pg_policies
     WHERE tablename = 'membership_applications') as passed
  UNION ALL
  SELECT 
    '34' as migration,
    'Helper functions' as description,
    (SELECT COUNT(*) = 3 FROM pg_proc p
     JOIN pg_namespace n ON p.pronamespace = n.oid
     WHERE n.nspname = 'public'
     AND p.proname IN ('expire_old_applications', 'check_duplicate_pending_application', 'validate_coach_club_relationship')) as passed
  UNION ALL
  SELECT 
    '35' as migration,
    'sport_type column' as description,
    (SELECT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'clubs' AND column_name = 'sport_type')) as passed
)
SELECT 
  migration,
  description,
  CASE WHEN passed THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM migration_checks
ORDER BY migration;

\echo ''

-- Final verdict
SELECT 
  CASE 
    WHEN COUNT(*) = 5 THEN 
      '✓✓✓ ALL MIGRATIONS SUCCESSFUL ✓✓✓'
    ELSE 
      '✗✗✗ SOME MIGRATIONS FAILED (' || COUNT(*) || ' of 5 passed) ✗✗✗'
  END as final_status
FROM (
  SELECT 
    (SELECT COUNT(*) = 3 FROM information_schema.columns
     WHERE table_name = 'membership_applications'
     AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason')) as check1
  UNION ALL
  SELECT 
    (SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status')
     AND EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'membership_status')) as check2
  UNION ALL
  SELECT 
    (SELECT COUNT(*) >= 6 FROM pg_policies
     WHERE tablename = 'membership_applications') as check3
  UNION ALL
  SELECT 
    (SELECT COUNT(*) = 3 FROM pg_proc p
     JOIN pg_namespace n ON p.pronamespace = n.oid
     WHERE n.nspname = 'public'
     AND p.proname IN ('expire_old_applications', 'check_duplicate_pending_application', 'validate_coach_club_relationship')) as check4
  UNION ALL
  SELECT 
    (SELECT EXISTS (SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'clubs' AND column_name = 'sport_type')) as check5
) checks
WHERE check1 = true OR check2 = true OR check3 = true OR check4 = true OR check5 = true;

\echo ''
\echo '=============================================================================='
\echo 'Verification Complete'
\echo '=============================================================================='
