-- ============================================================================
-- Synchronize Membership Status Across Tables
-- ============================================================================
-- Description: Ensure consistency between profiles.membership_status and
--              membership_applications.status. Also sync club_id and coach_id
--              from applications to profiles.
-- Task: 3.3 - Create migration for status synchronization
-- Author: System
-- Created: 2024-11-23
-- ============================================================================

-- ============================================================================
-- Step 1: Report current inconsistencies
-- ============================================================================
-- Count profiles with status mismatch
SELECT COUNT(*) as status_mismatch
FROM profiles p
LEFT JOIN membership_applications ma ON ma.user_id = p.id
WHERE p.role = 'athlete'
  AND (
    (ma.status = 'approved' AND p.membership_status != 'active')
    OR (ma.status = 'pending' AND p.membership_status = 'active')
    OR (ma.status = 'rejected' AND p.membership_status = 'active')
  );

-- Count active profiles missing club_id
SELECT COUNT(*) as missing_club
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.club_id IS NULL;

-- Count active profiles missing coach_id
SELECT COUNT(*) as missing_coach
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.coach_id IS NULL;

-- ============================================================================
-- Step 2: Sync membership_status from approved applications
-- ============================================================================
-- Update profiles to 'active' when application is approved
UPDATE profiles p
SET 
  membership_status = 'active'
FROM membership_applications ma
WHERE ma.user_id = p.id
  AND ma.status = 'approved'
  AND p.membership_status != 'active'
  AND p.role = 'athlete';

-- ============================================================================
-- Step 3: Sync membership_status from pending applications
-- ============================================================================
-- Update profiles to 'pending' when application is pending
-- (only if they don't have an approved application)
UPDATE profiles p
SET 
  membership_status = 'pending'
FROM membership_applications ma
WHERE ma.user_id = p.id
  AND ma.status = 'pending'
  AND p.membership_status = 'active'
  AND p.role = 'athlete'
  AND NOT EXISTS (
    SELECT 1 FROM membership_applications ma2
    WHERE ma2.user_id = p.id AND ma2.status = 'approved'
  );

-- ============================================================================
-- Step 4: Sync membership_status from rejected applications
-- ============================================================================
-- Update profiles to 'rejected' when application is rejected
-- (only if they don't have an approved application)
UPDATE profiles p
SET 
  membership_status = 'rejected'
FROM membership_applications ma
WHERE ma.user_id = p.id
  AND ma.status = 'rejected'
  AND p.membership_status = 'active'
  AND p.role = 'athlete'
  AND NOT EXISTS (
    SELECT 1 FROM membership_applications ma2
    WHERE ma2.user_id = p.id AND ma2.status = 'approved'
  );

-- ============================================================================
-- Step 5: Sync club_id from applications to profiles
-- ============================================================================
-- Update profiles.club_id from approved applications
UPDATE profiles p
SET 
  club_id = ma.club_id
FROM membership_applications ma
WHERE ma.user_id = p.id
  AND ma.status = 'approved'
  AND p.club_id IS NULL
  AND p.role = 'athlete';

-- Also sync from athletes table if still missing
UPDATE profiles p
SET 
  club_id = a.club_id
FROM athletes a
WHERE a.user_id = p.id
  AND p.club_id IS NULL
  AND p.role = 'athlete';

-- ============================================================================
-- Step 6: Sync coach_id from review_info to profiles
-- ============================================================================
-- Extract coach_id from application review_info and update profiles
UPDATE profiles p
SET 
  coach_id = (ma.review_info->>'reviewed_by')::uuid
FROM membership_applications ma
WHERE ma.user_id = p.id
  AND ma.status = 'approved'
  AND ma.review_info->>'reviewed_by' IS NOT NULL
  AND (ma.review_info->>'reviewer_role')::text IN ('coach', 'admin')
  AND p.coach_id IS NULL
  AND p.role = 'athlete';

-- If still missing, try to get coach from club
UPDATE profiles p
SET 
  coach_id = (
    SELECT pr.id 
    FROM profiles pr
    WHERE pr.role = 'coach' 
      AND pr.club_id = p.club_id
    LIMIT 1
  )
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.club_id IS NOT NULL
  AND p.coach_id IS NULL
  AND EXISTS (
    SELECT 1 FROM profiles pr
    WHERE pr.role = 'coach' AND pr.club_id = p.club_id
  );

-- ============================================================================
-- Step 7: Handle profiles without any application
-- ============================================================================
-- For active profiles without any application, create a legacy application
INSERT INTO membership_applications (
  user_id,
  club_id,
  personal_info,
  documents,
  status,
  review_info,
  activity_log,
  profile_id,
  created_at
)
SELECT 
  p.id,
  COALESCE(p.club_id, (SELECT id FROM clubs LIMIT 1)), -- Use profile club or first club
  jsonb_build_object(
    'full_name', p.full_name,
    'phone_number', '',
    'address', '',
    'emergency_contact', '',
    'migrated_from_legacy', true
  ),
  '[]'::jsonb,
  'approved',
  jsonb_build_object(
    'reviewed_by', p.id,
    'reviewed_at', p.created_at,
    'reviewer_role', 'system',
    'notes', 'Auto-created for legacy active profile without application'
  ),
  jsonb_build_array(
    jsonb_build_object(
      'timestamp', p.created_at,
      'action', 'submitted',
      'by_user', p.id,
      'by_role', 'athlete',
      'details', jsonb_build_object('migrated', true)
    ),
    jsonb_build_object(
      'timestamp', p.created_at,
      'action', 'approved',
      'by_user', p.id,
      'by_role', 'system',
      'details', jsonb_build_object('auto_approved', true, 'reason', 'legacy_profile_migration')
    )
  ),
  p.id,
  p.created_at
FROM profiles p
LEFT JOIN membership_applications ma ON ma.user_id = p.id
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND ma.id IS NULL;

-- ============================================================================
-- Step 8: Report results
-- ============================================================================
-- Count profiles with active status and approved applications
SELECT COUNT(*) as active_synced
FROM profiles p
INNER JOIN membership_applications ma ON ma.user_id = p.id
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND ma.status = 'approved';

-- Count profiles with pending status
SELECT COUNT(*) as pending_synced
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'pending';

-- Count profiles with rejected status
SELECT COUNT(*) as rejected_synced
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'rejected';

-- Count profiles with club_id
SELECT COUNT(*) as club_synced
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.club_id IS NOT NULL;

-- Count profiles with coach_id
SELECT COUNT(*) as coach_synced
FROM profiles p
WHERE p.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.coach_id IS NOT NULL;

-- Count legacy applications created
SELECT COUNT(*) as legacy_apps_created
FROM membership_applications
WHERE (review_info->>'notes')::text LIKE '%legacy%profile%';

-- ============================================================================
-- Step 9: Final consistency check
-- ============================================================================
DO $$
DECLARE
  v_remaining_issues INTEGER;
BEGIN
  -- Check for remaining inconsistencies
  SELECT COUNT(*) INTO v_remaining_issues
  FROM profiles p
  LEFT JOIN membership_applications ma ON ma.user_id = p.id
  WHERE p.role = 'athlete'
    AND (
      (p.membership_status = 'active' AND p.club_id IS NULL)
      OR (p.membership_status = 'active' AND ma.id IS NULL)
      OR (p.membership_status = 'active' AND ma.status != 'approved')
    );
  
  IF v_remaining_issues > 0 THEN
    RAISE WARNING 'Still have % profiles with inconsistencies', v_remaining_issues;
  ELSE
    RAISE NOTICE 'All profiles are now consistent!';
  END IF;
END $$;

-- ============================================================================
-- Verification Queries (run separately to verify)
-- ============================================================================
-- Check status consistency:
-- SELECT 
--   p.email,
--   p.full_name,
--   p.membership_status as profile_status,
--   ma.status as application_status,
--   p.club_id,
--   c.name as club_name,
--   p.coach_id,
--   coach.full_name as coach_name
-- FROM profiles p
-- LEFT JOIN membership_applications ma ON ma.user_id = p.id
-- LEFT JOIN clubs c ON c.id = p.club_id
-- LEFT JOIN profiles coach ON coach.id = p.coach_id
-- WHERE p.role = 'athlete'
-- ORDER BY p.membership_status, p.created_at;

-- Check for remaining issues:
-- SELECT 
--   'Active without club' as issue,
--   COUNT(*) as count
-- FROM profiles
-- WHERE role = 'athlete' AND membership_status = 'active' AND club_id IS NULL
-- UNION ALL
-- SELECT 
--   'Active without application' as issue,
--   COUNT(*) as count
-- FROM profiles p
-- LEFT JOIN membership_applications ma ON ma.user_id = p.id
-- WHERE p.role = 'athlete' AND p.membership_status = 'active' AND ma.id IS NULL
-- UNION ALL
-- SELECT 
--   'Status mismatch' as issue,
--   COUNT(*) as count
-- FROM profiles p
-- INNER JOIN membership_applications ma ON ma.user_id = p.id
-- WHERE p.role = 'athlete' 
--   AND p.membership_status = 'active' 
--   AND ma.status != 'approved';
