-- ============================================================================
-- Membership Approval System - Handle Edge Cases
-- ============================================================================
-- Description: Handle edge cases in existing data migration
-- Task: 5.2 - Handle edge cases (missing club_id, etc.)
-- Author: System
-- Created: 2024-11-23
-- ============================================================================

-- ============================================================================
-- Edge Case 1: Athletes with profiles but no membership applications
-- ============================================================================
-- Create applications for athletes who have profiles but no application record
-- This ensures all athletes have a proper application trail

INSERT INTO membership_applications (
  user_id,
  club_id,
  status,
  assigned_coach_id,
  personal_info,
  documents
)
SELECT 
  p.id,
  p.club_id,
  'approved'::text,
  p.coach_id,
  jsonb_build_object(
    'full_name', COALESCE(p.full_name, 'Unknown'),
    'migrated', true
  ),
  '[]'::jsonb
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'athlete'
  AND p.club_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM membership_applications ma 
    WHERE ma.user_id = p.id
  )
ON CONFLICT (user_id, club_id) DO NOTHING;

-- ============================================================================
-- Edge Case 2: Athletes with missing coach_id but have club_id
-- ============================================================================
-- Assign a default coach from their club if the athlete has a club but no coach
-- This uses the first available coach from the club

UPDATE profiles p
SET coach_id = (
  SELECT p2.id 
  FROM profiles p2
  JOIN user_roles ur2 ON ur2.user_id = p2.id
  WHERE ur2.role = 'coach' 
    AND p2.club_id = p.club_id 
  ORDER BY p2.created_at 
  LIMIT 1
)
FROM user_roles ur
WHERE ur.user_id = p.id
  AND ur.role = 'athlete'
  AND p.club_id IS NOT NULL
  AND p.coach_id IS NULL
  AND p.membership_status = 'active'
  AND EXISTS (
    SELECT 1 FROM profiles p3
    JOIN user_roles ur3 ON ur3.user_id = p3.id
    WHERE ur3.role = 'coach' AND p3.club_id = p.club_id
  );

-- ============================================================================
-- Edge Case 3: Orphaned applications (user not in profiles)
-- ============================================================================
-- Mark applications as rejected if the user doesn't exist in profiles
-- This handles cases where users were deleted but applications remain

UPDATE membership_applications ma
SET 
  status = 'rejected',
  review_info = jsonb_build_object(
    'reviewed_at', NOW(),
    'notes', 'User profile not found'
  )
WHERE ma.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = ma.user_id
  );

-- ============================================================================
-- Edge Case 4: Applications with invalid club_id
-- ============================================================================
-- Mark applications as rejected if the club doesn't exist
-- This handles cases where clubs were deleted but applications remain

UPDATE membership_applications ma
SET 
  status = 'rejected',
  review_info = jsonb_build_object(
    'reviewed_at', NOW(),
    'notes', 'Club no longer exists'
  )
WHERE ma.status = 'pending'
  AND ma.club_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM clubs c WHERE c.id = ma.club_id
  );

-- ============================================================================
-- Edge Case 5: Multiple approved applications for same user
-- ============================================================================
-- Keep only the most recent approved application, mark others as rejected
-- This ensures one active application per user

WITH ranked_applications AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY created_at DESC
    ) as rn
  FROM membership_applications
  WHERE status = 'approved'
)
UPDATE membership_applications ma
SET 
  status = 'rejected',
  review_info = jsonb_build_object(
    'reviewed_at', NOW(),
    'notes', 'Duplicate application - newer application exists'
  )
FROM ranked_applications ra
WHERE ma.id = ra.id
  AND ra.rn > 1;

-- ============================================================================
-- Edge Case 6: Profiles with inconsistent coach-club relationship
-- ============================================================================
-- Fix profiles where coach_id is from a different club than the athlete's club_id
-- Set coach_id to NULL and let the system reassign properly

UPDATE profiles p
SET coach_id = NULL
FROM user_roles ur
WHERE ur.user_id = p.id
  AND ur.role = 'athlete'
  AND p.coach_id IS NOT NULL
  AND p.club_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles coach
    JOIN user_roles ur_coach ON ur_coach.user_id = coach.id
    WHERE coach.id = p.coach_id
      AND ur_coach.role = 'coach'
      AND coach.club_id != p.club_id
  );

-- After fixing inconsistencies, reassign coaches from the correct club
UPDATE profiles p
SET coach_id = (
  SELECT p2.id 
  FROM profiles p2
  JOIN user_roles ur2 ON ur2.user_id = p2.id
  WHERE ur2.role = 'coach' 
    AND p2.club_id = p.club_id 
  ORDER BY p2.created_at 
  LIMIT 1
)
FROM user_roles ur
WHERE ur.user_id = p.id
  AND ur.role = 'athlete'
  AND p.club_id IS NOT NULL
  AND p.coach_id IS NULL
  AND p.membership_status = 'active'
  AND EXISTS (
    SELECT 1 FROM profiles p3
    JOIN user_roles ur3 ON ur3.user_id = p3.id
    WHERE ur3.role = 'coach' AND p3.club_id = p.club_id
  );

-- ============================================================================
-- Edge Case 7: Athletes with active status but no club_id
-- ============================================================================
-- Set membership_status to 'pending' for athletes without club assignment
-- They should go through the proper approval process

UPDATE profiles p
SET membership_status = 'pending'
FROM user_roles ur
WHERE ur.user_id = p.id
  AND ur.role = 'athlete'
  AND p.membership_status = 'active'
  AND p.club_id IS NULL;

-- ============================================================================
-- Edge Case 8: Approved applications without assigned_coach_id
-- ============================================================================
-- Update approved applications to have assigned_coach_id from profile
-- This was partially handled in script 37, but we ensure completeness here

UPDATE membership_applications ma
SET assigned_coach_id = p.coach_id
FROM profiles p
WHERE ma.user_id = p.id
  AND ma.status = 'approved'
  AND ma.assigned_coach_id IS NULL
  AND p.coach_id IS NOT NULL;

-- ============================================================================
-- Edge Case 9: Pending applications older than 30 days
-- ============================================================================
-- Auto-reject applications that have been pending for more than 30 days
-- This implements the business rule BR3 from requirements

UPDATE membership_applications
SET 
  status = 'rejected',
  review_info = jsonb_build_object(
    'reviewed_at', NOW(),
    'notes', 'Application expired (pending for more than 30 days)'
  )
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '30 days';

-- Update corresponding profiles to rejected status
UPDATE profiles p
SET membership_status = 'rejected'
FROM membership_applications ma
WHERE p.id = ma.user_id
  AND ma.status = 'rejected'
  AND ma.review_info->>'notes' LIKE '%expired%'
  AND p.membership_status = 'pending';
