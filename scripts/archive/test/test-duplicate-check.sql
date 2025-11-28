-- ============================================================================
-- Test Script for check_duplicate_pending_application Function
-- ============================================================================
-- Description: Test the duplicate pending application check function
-- ============================================================================

-- Test 1: Check with non-existent user (should return has_pending = false)
SELECT 
  'Test 1: Non-existent user' as test_name,
  has_pending,
  pending_application_id,
  pending_club_id,
  pending_since
FROM check_duplicate_pending_application('00000000-0000-0000-0000-000000000000'::UUID);

-- Test 2: Check current pending applications in the system
SELECT 
  'Test 2: Current pending applications' as test_name,
  COUNT(*) as pending_count,
  COUNT(DISTINCT user_id) as unique_users_with_pending
FROM membership_applications
WHERE status = 'pending';

-- Test 3: Check the function with a user who has a pending application (if any exist)
SELECT 
  'Test 3: User with pending application' as test_name,
  has_pending,
  pending_application_id IS NOT NULL as has_app_id,
  pending_club_id IS NOT NULL as has_club_id,
  pending_since IS NOT NULL as has_timestamp
FROM check_duplicate_pending_application(
  COALESCE(
    (SELECT user_id FROM membership_applications WHERE status = 'pending' LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  )
);

-- Test 4: Verify function works for users without pending applications
SELECT 
  'Test 4: User without pending application' as test_name,
  has_pending,
  pending_application_id,
  pending_club_id,
  pending_since
FROM check_duplicate_pending_application(
  COALESCE(
    (SELECT id FROM profiles WHERE id NOT IN (SELECT user_id FROM membership_applications WHERE status = 'pending') LIMIT 1),
    '00000000-0000-0000-0000-000000000000'::UUID
  )
);

-- Test 5: Summary of all applications by status
SELECT 
  'Test 5: Application status summary' as test_name,
  status,
  COUNT(*) as count
FROM membership_applications
GROUP BY status
ORDER BY status;
