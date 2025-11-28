-- ============================================================================
-- Fix Orphaned Athletes - Create Missing Membership Applications
-- ============================================================================
-- Description: Create membership_applications for athletes who exist in the
--              athletes table but have no corresponding application record.
--              This handles legacy data from before the membership system.
-- Task: 3.1 - Create migration for orphaned athletes
-- Author: System
-- Created: 2024-11-23
-- ============================================================================

-- ============================================================================
-- Step 1: Identify orphaned athletes (count only)
-- ============================================================================
-- Count orphaned athletes
SELECT COUNT(*) as orphaned_count
FROM athletes a
LEFT JOIN membership_applications ma 
  ON ma.user_id = a.user_id AND ma.club_id = a.club_id
WHERE ma.id IS NULL;

-- ============================================================================
-- Step 2: Create membership applications for orphaned athletes
-- ============================================================================
-- For each orphaned athlete:
-- 1. Create an 'approved' application (since they already have access)
-- 2. Set reviewed_at = created_at (backdated approval)
-- 3. Use system as reviewer (no specific coach)
-- 4. Link to existing profile if it exists

INSERT INTO membership_applications (
  user_id,
  club_id,
  personal_info,
  documents,
  status,
  review_info,
  activity_log,
  profile_id,
  created_at,
  updated_at
)
SELECT 
  a.user_id,
  a.club_id,
  -- Build personal_info from athlete data
  jsonb_build_object(
    'full_name', COALESCE(a.first_name || ' ' || a.last_name, a.email),
    'phone_number', COALESCE(a.phone_number, ''),
    'address', '',
    'emergency_contact', '',
    'date_of_birth', a.date_of_birth,
    'migrated_from_legacy', true
  ),
  -- Empty documents array (legacy data)
  '[]'::jsonb,
  -- Status: approved (they already have access)
  'approved',
  -- Review info: system migration
  jsonb_build_object(
    'reviewed_by', a.user_id,
    'reviewed_at', a.created_at,
    'reviewer_role', 'system',
    'notes', 'Migrated from legacy athlete record - auto-approved'
  ),
  -- Activity log: record the migration
  jsonb_build_array(
    jsonb_build_object(
      'timestamp', a.created_at,
      'action', 'submitted',
      'by_user', a.user_id,
      'by_role', 'athlete',
      'details', jsonb_build_object('migrated', true)
    ),
    jsonb_build_object(
      'timestamp', a.created_at,
      'action', 'approved',
      'by_user', a.user_id,
      'by_role', 'system',
      'details', jsonb_build_object('auto_approved', true, 'reason', 'legacy_migration')
    )
  ),
  -- Link to profile if exists
  (SELECT id FROM profiles WHERE id = a.user_id LIMIT 1),
  -- Timestamps: use athlete creation date
  a.created_at,
  a.created_at
FROM athletes a
LEFT JOIN membership_applications ma 
  ON ma.user_id = a.user_id AND ma.club_id = a.club_id
WHERE ma.id IS NULL;

-- ============================================================================
-- Step 3: Update profiles to match approved status
-- ============================================================================
-- Update membership_status to 'active' for these orphaned athletes
UPDATE profiles p
SET 
  membership_status = 'active',
  club_id = a.club_id
FROM athletes a
WHERE p.id = a.user_id
  AND p.role = 'athlete'
  AND (p.membership_status IS NULL OR p.membership_status != 'active');

-- ============================================================================
-- Step 4: Report results
-- ============================================================================
-- Count newly created applications
SELECT COUNT(*) as created_applications
FROM membership_applications
WHERE (review_info->>'notes')::text LIKE '%legacy%';

-- Count updated profiles
SELECT COUNT(*) as updated_profiles
FROM profiles p
INNER JOIN athletes a ON a.user_id = p.id
WHERE p.membership_status = 'active';

-- ============================================================================
-- Verification Query (run separately to verify)
-- ============================================================================
-- SELECT 
--   a.email,
--   a.first_name,
--   a.last_name,
--   c.name as club_name,
--   ma.status as application_status,
--   p.membership_status as profile_status,
--   ma.created_at as application_created
-- FROM athletes a
-- LEFT JOIN membership_applications ma ON ma.user_id = a.user_id AND ma.club_id = a.club_id
-- LEFT JOIN profiles p ON p.id = a.user_id
-- LEFT JOIN clubs c ON c.id = a.club_id
-- ORDER BY a.created_at;
