-- ============================================================================
-- Test Script for expire_old_applications Function
-- ============================================================================
-- Description: Create test data and verify the expire_old_applications function
-- ============================================================================

-- ============================================================================
-- Setup: Create test data
-- ============================================================================

-- Create a test user if not exists
DO $$
DECLARE
  v_test_user_id UUID;
  v_test_club_id UUID;
BEGIN
  -- Get or create a test club
  SELECT id INTO v_test_club_id FROM clubs LIMIT 1;
  
  IF v_test_club_id IS NULL THEN
    RAISE NOTICE 'No clubs found. Please create a club first.';
    RETURN;
  END IF;

  -- Create a test application that is 31 days old (should be expired)
  INSERT INTO membership_applications (
    id,
    user_id,
    club_id,
    personal_info,
    status,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    auth.uid(),
    v_test_club_id,
    '{"full_name": "Test Old Application", "phone_number": "081-234-5678"}'::jsonb,
    'pending',
    NOW() - INTERVAL '31 days',
    NOW() - INTERVAL '31 days'
  FROM auth.users
  LIMIT 1
  ON CONFLICT (user_id, club_id) DO NOTHING;

  -- Create a test application that is 15 days old (should NOT be expired)
  INSERT INTO membership_applications (
    id,
    user_id,
    club_id,
    personal_info,
    status,
    created_at,
    updated_at
  )
  SELECT
    gen_random_uuid(),
    auth.uid(),
    v_test_club_id,
    '{"full_name": "Test Recent Application", "phone_number": "081-234-5679"}'::jsonb,
    'pending',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  FROM auth.users
  WHERE auth.uid() NOT IN (
    SELECT user_id FROM membership_applications WHERE club_id = v_test_club_id
  )
  LIMIT 1
  ON CONFLICT (user_id, club_id) DO NOTHING;

  RAISE NOTICE 'Test data created successfully';
END $$;

-- ============================================================================
-- Check: Show pending applications before expiry
-- ============================================================================
SELECT 
  id,
  user_id,
  club_id,
  status,
  created_at,
  EXTRACT(DAY FROM (NOW() - created_at)) as days_old
FROM membership_applications
WHERE status = 'pending'
ORDER BY created_at;

-- ============================================================================
-- Execute: Run the expire_old_applications function
-- ============================================================================
SELECT * FROM expire_old_applications();

-- ============================================================================
-- Verify: Check applications after expiry
-- ============================================================================
SELECT 
  id,
  user_id,
  club_id,
  status,
  rejection_reason,
  created_at,
  EXTRACT(DAY FROM (NOW() - created_at)) as days_old
FROM membership_applications
WHERE created_at < NOW() - INTERVAL '25 days'
ORDER BY created_at;

-- ============================================================================
-- Verify: Check that profiles were updated
-- ============================================================================
SELECT 
  p.id,
  p.membership_status,
  ma.status as application_status,
  ma.rejection_reason
FROM profiles p
JOIN membership_applications ma ON ma.user_id = p.id
WHERE ma.created_at < NOW() - INTERVAL '25 days'
ORDER BY ma.created_at;
