-- ============================================================================
-- Fix Approved Applications Without Profiles
-- ============================================================================
-- Description: Handle approved membership applications that don't have
--              corresponding athlete profiles. This shouldn't happen in normal
--              flow, but may exist due to data inconsistencies.
-- Task: 3.2 - Create migration for approved applications without profiles
-- Author: System
-- Created: 2024-11-23
-- ============================================================================

-- ============================================================================
-- Step 1: Identify approved applications without profiles
-- ============================================================================
-- Count approved applications without profile links
SELECT COUNT(*) as missing_profile_count
FROM membership_applications ma
WHERE ma.status = 'approved'
  AND ma.profile_id IS NULL;

-- ============================================================================
-- Step 2: Link existing profiles to approved applications
-- ============================================================================
-- If a profile exists for the user, link it to the application
UPDATE membership_applications ma
SET 
  profile_id = p.id
FROM profiles p
WHERE ma.user_id = p.id
  AND ma.status = 'approved'
  AND ma.profile_id IS NULL
  AND p.role = 'athlete';

-- ============================================================================
-- Step 3: Update profiles to active status for approved applications
-- ============================================================================
-- Ensure profiles linked to approved applications have active status
UPDATE profiles p
SET 
  membership_status = 'active',
  club_id = COALESCE(p.club_id, ma.club_id)
FROM membership_applications ma
WHERE ma.profile_id = p.id
  AND ma.status = 'approved'
  AND p.membership_status != 'active';

-- ============================================================================
-- Step 4: Create athlete records if missing
-- ============================================================================
-- For approved applications with profiles but no athlete record,
-- create the athlete record
INSERT INTO athletes (
  user_id,
  email,
  first_name,
  last_name,
  phone_number,
  date_of_birth,
  club_id,
  created_at
)
SELECT 
  ma.user_id,
  p.email,
  SPLIT_PART(p.full_name, ' ', 1) as first_name,
  CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(p.full_name, ' '), 1) > 1 
    THEN SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name) + 1)
    ELSE ''
  END as last_name,
  COALESCE((ma.personal_info->>'phone_number')::text, '') as phone_number,
  CASE 
    WHEN ma.personal_info->>'date_of_birth' IS NOT NULL 
    THEN (ma.personal_info->>'date_of_birth')::date
    ELSE NULL
  END as date_of_birth,
  ma.club_id,
  ma.created_at
FROM membership_applications ma
INNER JOIN profiles p ON p.id = ma.user_id
LEFT JOIN athletes a ON a.user_id = ma.user_id AND a.club_id = ma.club_id
WHERE ma.status = 'approved'
  AND a.id IS NULL
  AND p.role = 'athlete';

-- ============================================================================
-- Step 5: Report results
-- ============================================================================
-- Count linked profiles
SELECT COUNT(*) as linked_profiles
FROM membership_applications ma
INNER JOIN profiles p ON p.id = ma.profile_id
WHERE ma.status = 'approved';

-- Count active profiles with approved applications
SELECT COUNT(*) as active_profiles
FROM profiles p
INNER JOIN membership_applications ma ON ma.profile_id = p.id
WHERE ma.status = 'approved'
  AND p.membership_status = 'active';

-- Count athletes created
SELECT COUNT(*) as athlete_records
FROM athletes a
INNER JOIN membership_applications ma ON ma.user_id = a.user_id AND ma.club_id = a.club_id
WHERE ma.status = 'approved';

-- ============================================================================
-- Verification Query (run separately to verify)
-- ============================================================================
-- Check approved applications have proper profile links:
-- SELECT 
--   ma.id,
--   ma.user_id,
--   ma.status,
--   ma.profile_id,
--   p.membership_status,
--   p.club_id,
--   c.name as club_name,
--   CASE WHEN a.id IS NOT NULL THEN 'Yes' ELSE 'No' END as has_athlete_record
-- FROM membership_applications ma
-- LEFT JOIN profiles p ON p.id = ma.profile_id
-- LEFT JOIN clubs c ON c.id = ma.club_id
-- LEFT JOIN athletes a ON a.user_id = ma.user_id AND a.club_id = ma.club_id
-- WHERE ma.status = 'approved'
-- ORDER BY ma.created_at;
