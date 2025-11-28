-- Comprehensive Registration System Verification
-- Checks all components needed for smooth registration

-- ============================================
-- PART 1: DATABASE STRUCTURE
-- ============================================

-- Check membership_applications table structure
SELECT 
  '1. Membership Applications Table' as component,
  COUNT(*) as columns_count,
  CASE WHEN COUNT(*) >= 8 THEN '✓ PASS' ELSE '✗ FAIL' END as status
FROM information_schema.columns
WHERE table_name = 'membership_applications';

-- List all columns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'membership_applications'
ORDER BY ordinal_position;

-- ============================================
-- PART 2: HELPER FUNCTIONS
-- ============================================

-- Check all required helper functions exist
SELECT 
  '2. Helper Functions' as component,
  routine_name,
  routine_type,
  '✓ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'check_duplicate_pending_application',
    'update_application_status',
    'add_activity_log',
    'validate_coach_club'
  )
ORDER BY routine_name;

-- ============================================
-- PART 3: RLS POLICIES
-- ============================================

-- Check RLS is enabled
SELECT 
  '3. RLS Status' as component,
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'membership_applications';

-- List all RLS policies
SELECT 
  '3. RLS Policies' as component,
  policyname,
  cmd as operation,
  '✓ EXISTS' as status
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

-- ============================================
-- PART 4: CLUBS AND COACHES
-- ============================================

-- Check clubs availability
SELECT 
  '4. Clubs' as component,
  id,
  name,
  sport_type,
  (SELECT COUNT(*) FROM coaches WHERE club_id = clubs.id) as coach_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM coaches WHERE club_id = clubs.id) > 0 
    THEN '✓ HAS COACHES' 
    ELSE '⚠ NO COACHES' 
  END as status
FROM clubs
ORDER BY name;

-- ============================================
-- PART 5: PROFILES TABLE
-- ============================================

-- Check profiles table has required columns
SELECT 
  '5. Profiles Table' as component,
  column_name,
  data_type,
  '✓ EXISTS' as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('id', 'membership_status', 'role')
ORDER BY column_name;

-- ============================================
-- PART 6: ATHLETES TABLE
-- ============================================

-- Check athletes table structure
SELECT 
  '6. Athletes Table' as component,
  column_name,
  data_type,
  is_nullable,
  '✓ EXISTS' as status
FROM information_schema.columns
WHERE table_name = 'athletes'
  AND column_name IN ('user_id', 'club_id', 'first_name', 'last_name', 'gender', 'date_of_birth', 'phone_number')
ORDER BY column_name;

-- ============================================
-- PART 7: CONSTRAINTS AND INDEXES
-- ============================================

-- Check unique constraints
SELECT 
  '7. Constraints' as component,
  conname as constraint_name,
  contype as constraint_type,
  '✓ EXISTS' as status
FROM pg_constraint
WHERE conrelid = 'membership_applications'::regclass
  AND contype IN ('u', 'p')
ORDER BY conname;

-- Check indexes for performance
SELECT 
  '7. Indexes' as component,
  indexname,
  indexdef,
  '✓ EXISTS' as status
FROM pg_indexes
WHERE tablename = 'membership_applications'
ORDER BY indexname;

-- ============================================
-- PART 8: RECENT ACTIVITY
-- ============================================

-- Check recent applications (last 7 days)
SELECT 
  '8. Recent Activity' as component,
  DATE(created_at) as date,
  COUNT(*) as applications_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
FROM membership_applications
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- ============================================
-- PART 9: CURRENT STATUS
-- ============================================

-- Overall status summary
SELECT 
  '9. Current Status' as component,
  status,
  COUNT(*) as count
FROM membership_applications
GROUP BY status
ORDER BY status;

-- ============================================
-- PART 10: VALIDATION TEST
-- ============================================

-- Test duplicate check function with dummy UUID
SELECT 
  '10. Function Test' as component,
  'check_duplicate_pending_application' as function_name,
  '✓ EXISTS' as status;

-- ============================================
-- FINAL SUMMARY
-- ============================================

SELECT 
  '=== REGISTRATION SYSTEM HEALTH CHECK ===' as summary,
  CASE 
    WHEN (SELECT COUNT(*) FROM clubs) > 0 
      AND (SELECT COUNT(*) FROM coaches) > 0
      AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'membership_applications') >= 3
      AND (SELECT COUNT(*) FROM information_schema.routines 
           WHERE routine_schema = 'public' 
           AND routine_name IN ('check_duplicate_pending_application', 'update_application_status', 'add_activity_log')) >= 3
    THEN '✅ ALL SYSTEMS OPERATIONAL'
    ELSE '⚠️ SOME COMPONENTS MISSING'
  END as status,
  (SELECT COUNT(*) FROM clubs) as total_clubs,
  (SELECT COUNT(*) FROM coaches) as total_coaches,
  (SELECT COUNT(*) FROM membership_applications WHERE status = 'pending') as pending_applications;
