-- ============================================================================
-- Verification Script for Migration 40
-- ============================================================================
-- Purpose: Verify that constraints, triggers, and functions were created

-- ============================================================================
-- 1. Check Constraint
-- ============================================================================
SELECT 
  'CHECK Constraint' as verification_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'check_active_requires_club'
  AND conrelid = 'profiles'::regclass;

-- ============================================================================
-- 2. Check Trigger
-- ============================================================================
SELECT 
  'Trigger' as verification_type,
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'trigger_sync_membership_status';

-- ============================================================================
-- 3. Check Functions
-- ============================================================================
SELECT 
  'Function' as verification_type,
  proname as function_name,
  pg_get_function_arguments(oid) as arguments,
  pg_get_functiondef(oid) LIKE '%TRIGGER%' as is_trigger_function
FROM pg_proc
WHERE proname IN (
  'sync_membership_status_on_application_change',
  'validate_membership_data_consistency'
)
ORDER BY proname;

-- ============================================================================
-- 4. Run Data Consistency Validation
-- ============================================================================
SELECT 
  'Data Consistency' as verification_type,
  issue_type,
  issue_count,
  issue_description
FROM validate_membership_data_consistency()
ORDER BY issue_type;

-- ============================================================================
-- 5. Summary
-- ============================================================================
DO $$
DECLARE
  constraint_exists BOOLEAN;
  trigger_exists BOOLEAN;
  sync_function_exists BOOLEAN;
  validate_function_exists BOOLEAN;
BEGIN
  -- Check constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_active_requires_club'
  ) INTO constraint_exists;
  
  -- Check trigger
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_sync_membership_status'
  ) INTO trigger_exists;
  
  -- Check sync function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'sync_membership_status_on_application_change'
  ) INTO sync_function_exists;
  
  -- Check validate function
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'validate_membership_data_consistency'
  ) INTO validate_function_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migration 40 Verification Summary';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'CHECK Constraint (check_active_requires_club): %', 
    CASE WHEN constraint_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'Trigger (trigger_sync_membership_status): %', 
    CASE WHEN trigger_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'Function (sync_membership_status_on_application_change): %', 
    CASE WHEN sync_function_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE 'Function (validate_membership_data_consistency): %', 
    CASE WHEN validate_function_exists THEN '✓ EXISTS' ELSE '✗ MISSING' END;
  RAISE NOTICE '============================================================================';
  
  IF constraint_exists AND trigger_exists AND sync_function_exists AND validate_function_exists THEN
    RAISE NOTICE 'All components verified successfully!';
  ELSE
    RAISE WARNING 'Some components are missing!';
  END IF;
  RAISE NOTICE '============================================================================';
END $$;
