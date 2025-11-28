-- ============================================================================
-- Membership Approval System - Migrate Existing Data
-- ============================================================================
-- Description: Set membership_status = 'active' for existing athletes with profiles
-- Task: 5.2 - Migrate existing data
-- Author: System
-- Created: 2024-11-23
-- ============================================================================

-- ============================================================================
-- Step 1: Update existing athletes with profiles to 'active' status
-- ============================================================================
-- Athletes who already have profiles should be considered active members
-- This handles the case where profiles existed before the membership approval system

UPDATE profiles
SET membership_status = 'active'
WHERE role = 'athlete'
  AND membership_status = 'pending'
  AND id IS NOT NULL;

-- ============================================================================
-- Step 2: Update existing approved applications with assigned_coach_id
-- ============================================================================
-- For applications that were approved before the assigned_coach_id field existed,
-- set the assigned_coach_id from the athlete's current coach_id

UPDATE membership_applications ma
SET assigned_coach_id = p.coach_id
FROM profiles p
WHERE ma.user_id = p.id
  AND ma.status = 'approved'
  AND ma.assigned_coach_id IS NULL
  AND p.coach_id IS NOT NULL;

-- ============================================================================
-- Step 3: Handle edge cases - profiles without club_id
-- ============================================================================
-- If an athlete profile exists but has no club_id, try to get it from their application

UPDATE profiles p
SET club_id = ma.club_id
FROM membership_applications ma
WHERE p.id = ma.user_id
  AND p.role = 'athlete'
  AND p.club_id IS NULL
  AND ma.club_id IS NOT NULL
  AND ma.status = 'approved';

-- ============================================================================
-- Step 4: Ensure coaches and admins are always active
-- ============================================================================
-- Coaches and admins should always have active status

UPDATE profiles
SET membership_status = 'active'
WHERE role IN ('coach', 'admin')
  AND membership_status != 'active';

-- ============================================================================
-- Verification Queries (for manual review if needed)
-- ============================================================================

-- Check profiles by role and status
-- SELECT 
--   role,
--   membership_status,
--   COUNT(*) as count
-- FROM profiles
-- GROUP BY role, membership_status
-- ORDER BY role, membership_status;

-- Check athletes without club_id (may need manual intervention)
-- SELECT 
--   p.id,
--   p.user_id,
--   p.full_name,
--   p.role,
--   p.membership_status,
--   p.coach_id,
--   p.club_id
-- FROM profiles p
-- WHERE p.role = 'athlete'
--   AND p.club_id IS NULL;

-- Check approved applications without assigned_coach_id
-- SELECT 
--   ma.id,
--   ma.user_id,
--   ma.status,
--   ma.assigned_coach_id,
--   ma.club_id,
--   p.coach_id as profile_coach_id
-- FROM membership_applications ma
-- LEFT JOIN profiles p ON ma.user_id = p.user_id
-- WHERE ma.status = 'approved'
--   AND ma.assigned_coach_id IS NULL;

