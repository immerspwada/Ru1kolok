-- ============================================================================
-- Detailed Test for check_duplicate_pending_application Function
-- ============================================================================

-- Show current state
SELECT 
  'Current State' as section,
  ma.id as application_id,
  ma.user_id,
  p.email,
  ma.club_id,
  c.name as club_name,
  ma.status,
  ma.created_at
FROM membership_applications ma
JOIN profiles p ON p.id = ma.user_id
LEFT JOIN clubs c ON c.id = ma.club_id
WHERE ma.status = 'pending'
LIMIT 5;

-- Test the function with a user who has a pending application
SELECT 
  'Function Test: User WITH pending' as section,
  *
FROM check_duplicate_pending_application(
  (SELECT user_id FROM membership_applications WHERE status = 'pending' LIMIT 1)
);

-- Test the function with a user who does NOT have a pending application
SELECT 
  'Function Test: User WITHOUT pending' as section,
  *
FROM check_duplicate_pending_application(
  (SELECT id FROM profiles 
   WHERE id NOT IN (SELECT user_id FROM membership_applications WHERE status = 'pending')
   LIMIT 1)
);

-- Test with completely non-existent user
SELECT 
  'Function Test: Non-existent user' as section,
  *
FROM check_duplicate_pending_application('00000000-0000-0000-0000-000000000000'::UUID);
