-- ============================================================================
-- Verification Script for Task 5.1: Database Migrations
-- ============================================================================
-- This script verifies that all 5 migration scripts have been executed successfully

-- Check 1: membership_applications columns (Script 31)
SELECT 
  '✓ Script 31: membership_applications columns' as check_name,
  COUNT(*) as columns_found,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'membership_applications'
  AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason');

-- Check 2: membership_applications indexes (Script 31)
SELECT 
  '✓ Script 31: membership_applications indexes' as check_name,
  COUNT(*) as indexes_found,
  CASE WHEN COUNT(*) >= 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_indexes
WHERE tablename = 'membership_applications'
  AND indexname IN ('idx_applications_club_status', 'idx_applications_assigned_coach', 'idx_applications_reviewed_by');

-- Check 3: profiles membership_status column (Script 32)
SELECT 
  '✓ Script 32: profiles membership_status' as check_name,
  COUNT(*) as columns_found,
  CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'membership_status';

-- Check 4: membership_status enum type (Script 32)
SELECT 
  '✓ Script 32: membership_status enum' as check_name,
  COUNT(*) as enum_values,
  CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_enum
WHERE enumtypid = 'membership_status'::regtype;

-- Check 5: RLS policies (Script 33)
SELECT 
  '✓ Script 33: RLS policies' as check_name,
  COUNT(*) as policies_found,
  CASE WHEN COUNT(*) >= 6 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_policies
WHERE tablename = 'membership_applications';

-- Check 6: Helper functions (Script 34)
SELECT 
  '✓ Script 34: Helper functions' as check_name,
  COUNT(*) as functions_found,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'expire_old_applications',
    'check_duplicate_pending_application',
    'validate_coach_club_relationship'
  );

-- Check 7: clubs sport_type column (Script 35)
SELECT 
  '✓ Script 35: clubs sport_type' as check_name,
  COUNT(*) as columns_found,
  CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'clubs'
  AND column_name = 'sport_type';

-- Summary
SELECT 
  '========================================' as summary,
  'TASK 5.1 VERIFICATION COMPLETE' as result;
