-- ============================================================================
-- Verification Script with Result Sets
-- ============================================================================

-- Migration 31: Check membership_applications columns
SELECT 
  '31' as migration,
  'membership_applications columns' as check_name,
  COUNT(*) as found,
  3 as expected,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'membership_applications'
  AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason')

UNION ALL

-- Migration 31: Check indexes
SELECT 
  '31' as migration,
  'membership_applications indexes' as check_name,
  COUNT(*) as found,
  3 as expected,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_indexes
WHERE tablename = 'membership_applications'
  AND indexname IN ('idx_applications_club_status', 'idx_applications_assigned_coach', 'idx_applications_reviewed_by')

UNION ALL

-- Migration 32: Check enum type
SELECT 
  '32' as migration,
  'membership_status enum' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN 1 ELSE 0 END as found,
  1 as expected,
  CASE WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN 'PASS' ELSE 'FAIL' END as status

UNION ALL

-- Migration 32: Check enum values
SELECT 
  '32' as migration,
  'membership_status enum values' as check_name,
  COUNT(*) as found,
  4 as expected,
  CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_enum 
WHERE enumtypid = 'membership_status'::regtype

UNION ALL

-- Migration 32: Check profiles columns
SELECT 
  '32' as migration,
  'profiles columns' as check_name,
  COUNT(*) as found,
  2 as expected,
  CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('membership_status', 'coach_id')

UNION ALL

-- Migration 32: Check profiles indexes
SELECT 
  '32' as migration,
  'profiles indexes' as check_name,
  COUNT(*) as found,
  2 as expected,
  CASE WHEN COUNT(*) >= 2 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname IN ('idx_profiles_membership_status', 'idx_profiles_coach_id')

UNION ALL

-- Migration 33: Check RLS policies
SELECT 
  '33' as migration,
  'RLS policies' as check_name,
  COUNT(*) as found,
  6 as expected,
  CASE WHEN COUNT(*) >= 6 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_policies
WHERE tablename = 'membership_applications'
  AND policyname IN (
    'coach_view_own_club_applications',
    'coach_approve_own_club_applications',
    'athlete_view_own_applications',
    'admin_view_all_applications',
    'admin_update_all_applications',
    'admin_insert_applications'
  )

UNION ALL

-- Migration 34: Check helper functions
SELECT 
  '34' as migration,
  'helper functions' as check_name,
  COUNT(*) as found,
  3 as expected,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'expire_old_applications',
    'check_duplicate_pending_application',
    'validate_coach_club_relationship'
  )

UNION ALL

-- Migration 35: Check sport_type column
SELECT 
  '35' as migration,
  'sport_type column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'sport_type'
  ) THEN 1 ELSE 0 END as found,
  1 as expected,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clubs' AND column_name = 'sport_type'
  ) THEN 'PASS' ELSE 'FAIL' END as status

UNION ALL

-- Migration 35: Check sport_type index
SELECT 
  '35' as migration,
  'sport_type index' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'clubs' AND indexname = 'idx_clubs_sport_type'
  ) THEN 1 ELSE 0 END as found,
  1 as expected,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'clubs' AND indexname = 'idx_clubs_sport_type'
  ) THEN 'PASS' ELSE 'FAIL' END as status

ORDER BY migration, check_name;
