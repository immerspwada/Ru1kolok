-- ============================================================================
-- Comprehensive Verification Script for Membership Approval System Migrations
-- ============================================================================
-- This script verifies that all migrations (31-35) have been successfully applied
-- Task: 5.1 - Verify all migrations successful
-- ============================================================================

-- ============================================================================
-- Migration 31: membership_applications columns
-- ============================================================================
DO $$
DECLARE
  v_column_count INTEGER;
  v_index_count INTEGER;
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'MEMBERSHIP APPROVAL SYSTEM - MIGRATION VERIFICATION';
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE '';
  
  RAISE NOTICE '1. Verifying Migration 31: membership_applications columns...';
  RAISE NOTICE '----------------------------------------------------------------------';
  
  -- Check columns
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_name = 'membership_applications'
    AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason');
  
  IF v_column_count = 3 THEN
    RAISE NOTICE '✓ PASS: All 3 columns exist (assigned_coach_id, reviewed_by, rejection_reason)';
  ELSE
    RAISE WARNING '✗ FAIL: Missing columns (found % of 3)', v_column_count;
  END IF;
  
  -- Check indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'membership_applications'
    AND indexname IN ('idx_applications_club_status', 'idx_applications_assigned_coach', 'idx_applications_reviewed_by');
  
  IF v_index_count = 3 THEN
    RAISE NOTICE '✓ PASS: All 3 indexes exist';
  ELSE
    RAISE WARNING '✗ FAIL: Missing indexes (found % of 3)', v_index_count;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Migration 32: profiles membership_status
-- ============================================================================
DO $$
DECLARE
  v_enum_exists BOOLEAN;
  v_enum_count INTEGER;
  v_column_count INTEGER;
  v_index_count INTEGER;
BEGIN
  RAISE NOTICE '2. Verifying Migration 32: profiles membership_status...';
  RAISE NOTICE '----------------------------------------------------------------------';
  
  -- Check enum type exists
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') INTO v_enum_exists;
  
  IF v_enum_exists THEN
    RAISE NOTICE '✓ PASS: membership_status enum type exists';
  ELSE
    RAISE WARNING '✗ FAIL: membership_status enum type missing';
  END IF;
  
  -- Check enum values
  SELECT COUNT(*) INTO v_enum_count
  FROM pg_enum 
  WHERE enumtypid = 'membership_status'::regtype;
  
  IF v_enum_count = 4 THEN
    RAISE NOTICE '✓ PASS: All 4 enum values exist (pending, active, rejected, suspended)';
  ELSE
    RAISE WARNING '✗ FAIL: Missing enum values (found % of 4)', v_enum_count;
  END IF;
  
  -- Check columns
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_name = 'profiles'
    AND column_name IN ('membership_status', 'coach_id');
  
  IF v_column_count >= 2 THEN
    RAISE NOTICE '✓ PASS: membership_status and coach_id columns exist';
  ELSE
    RAISE WARNING '✗ FAIL: Missing columns (found % of 2)', v_column_count;
  END IF;
  
  -- Check indexes
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename = 'profiles'
    AND indexname IN ('idx_profiles_membership_status', 'idx_profiles_coach_id');
  
  IF v_index_count >= 2 THEN
    RAISE NOTICE '✓ PASS: Required indexes exist';
  ELSE
    RAISE WARNING '✗ FAIL: Missing indexes (found % of 2)', v_index_count;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Migration 33: RLS Policies
-- ============================================================================
DO $$
DECLARE
  v_policy_count INTEGER;
  v_policy_names TEXT;
BEGIN
  RAISE NOTICE '3. Verifying Migration 33: RLS Policies...';
  RAISE NOTICE '----------------------------------------------------------------------';
  
  SELECT COUNT(*) INTO v_policy_count
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
  
  IF v_policy_count >= 6 THEN
    RAISE NOTICE '✓ PASS: All required RLS policies exist (% policies)', v_policy_count;
  ELSE
    RAISE WARNING '✗ FAIL: Missing policies (found % of 6)', v_policy_count;
  END IF;
  
  -- List existing policies
  SELECT string_agg(policyname, ', ' ORDER BY policyname) INTO v_policy_names
  FROM pg_policies
  WHERE tablename = 'membership_applications';
  
  RAISE NOTICE 'Existing policies: %', v_policy_names;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Migration 34: Helper Functions
-- ============================================================================
DO $$
DECLARE
  v_function_count INTEGER;
  v_function_names TEXT;
BEGIN
  RAISE NOTICE '4. Verifying Migration 34: Helper Functions...';
  RAISE NOTICE '----------------------------------------------------------------------';
  
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'expire_old_applications',
      'check_duplicate_pending_application',
      'validate_coach_club_relationship'
    );
  
  IF v_function_count = 3 THEN
    RAISE NOTICE '✓ PASS: All 3 helper functions exist';
  ELSE
    RAISE WARNING '✗ FAIL: Missing functions (found % of 3)', v_function_count;
  END IF;
  
  -- List existing functions
  SELECT string_agg(proname, ', ' ORDER BY proname) INTO v_function_names
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'expire_old_applications',
      'check_duplicate_pending_application',
      'validate_coach_club_relationship'
    );
  
  RAISE NOTICE 'Existing functions: %', v_function_names;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Migration 35: sport_type column
-- ============================================================================
DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_index_exists BOOLEAN;
  v_data_type TEXT;
  v_is_nullable TEXT;
BEGIN
  RAISE NOTICE '5. Verifying Migration 35: sport_type column...';
  RAISE NOTICE '----------------------------------------------------------------------';
  
  -- Check column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'sport_type'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✓ PASS: sport_type column exists';
    
    -- Get column details
    SELECT data_type, is_nullable INTO v_data_type, v_is_nullable
    FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'sport_type';
    
    RAISE NOTICE '  Column details: type=%, nullable=%', v_data_type, v_is_nullable;
  ELSE
    RAISE WARNING '✗ FAIL: sport_type column missing';
  END IF;
  
  -- Check index
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'clubs' AND indexname = 'idx_clubs_sport_type'
  ) INTO v_index_exists;
  
  IF v_index_exists THEN
    RAISE NOTICE '✓ PASS: sport_type index exists';
  ELSE
    RAISE WARNING '✗ FAIL: sport_type index missing';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================================================
-- Overall Summary
-- ============================================================================
DO $$
DECLARE
  v_migration_31 BOOLEAN;
  v_migration_32 BOOLEAN;
  v_migration_33 BOOLEAN;
  v_migration_34 BOOLEAN;
  v_migration_35 BOOLEAN;
  v_total_passed INTEGER := 0;
BEGIN
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'OVERALL MIGRATION STATUS SUMMARY';
  RAISE NOTICE '==============================================================================';
  
  -- Check Migration 31
  SELECT COUNT(*) = 3 INTO v_migration_31
  FROM information_schema.columns
  WHERE table_name = 'membership_applications'
    AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason');
  
  IF v_migration_31 THEN
    RAISE NOTICE '✓ Migration 31: membership_applications columns - PASS';
    v_total_passed := v_total_passed + 1;
  ELSE
    RAISE NOTICE '✗ Migration 31: membership_applications columns - FAIL';
  END IF;
  
  -- Check Migration 32
  SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status')
    AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'profiles' AND column_name = 'membership_status')
  INTO v_migration_32;
  
  IF v_migration_32 THEN
    RAISE NOTICE '✓ Migration 32: profiles membership_status - PASS';
    v_total_passed := v_total_passed + 1;
  ELSE
    RAISE NOTICE '✗ Migration 32: profiles membership_status - FAIL';
  END IF;
  
  -- Check Migration 33
  SELECT COUNT(*) >= 6 INTO v_migration_33
  FROM pg_policies
  WHERE tablename = 'membership_applications';
  
  IF v_migration_33 THEN
    RAISE NOTICE '✓ Migration 33: RLS policies - PASS';
    v_total_passed := v_total_passed + 1;
  ELSE
    RAISE NOTICE '✗ Migration 33: RLS policies - FAIL';
  END IF;
  
  -- Check Migration 34
  SELECT COUNT(*) = 3 INTO v_migration_34
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN ('expire_old_applications', 'check_duplicate_pending_application', 'validate_coach_club_relationship');
  
  IF v_migration_34 THEN
    RAISE NOTICE '✓ Migration 34: Helper functions - PASS';
    v_total_passed := v_total_passed + 1;
  ELSE
    RAISE NOTICE '✗ Migration 34: Helper functions - FAIL';
  END IF;
  
  -- Check Migration 35
  SELECT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'clubs' AND column_name = 'sport_type')
  INTO v_migration_35;
  
  IF v_migration_35 THEN
    RAISE NOTICE '✓ Migration 35: sport_type column - PASS';
    v_total_passed := v_total_passed + 1;
  ELSE
    RAISE NOTICE '✗ Migration 35: sport_type column - FAIL';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '----------------------------------------------------------------------';
  
  IF v_total_passed = 5 THEN
    RAISE NOTICE '✓✓✓ ALL MIGRATIONS SUCCESSFUL (5/5) ✓✓✓';
  ELSE
    RAISE WARNING '✗✗✗ SOME MIGRATIONS FAILED (% of 5 passed) ✗✗✗', v_total_passed;
  END IF;
  
  RAISE NOTICE '==============================================================================';
  RAISE NOTICE 'Verification Complete';
  RAISE NOTICE '==============================================================================';
END $$;
