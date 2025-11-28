-- ============================================================================
-- Verify Migration 37: Existing Membership Data Migration
-- ============================================================================
-- Description: Verify that existing athletes have been set to 'active' status
-- ============================================================================

-- Check 1: Count profiles by role and membership_status
SELECT 
  '1. Profiles by Role and Status' as check_name,
  role,
  membership_status,
  COUNT(*) as count
FROM profiles
GROUP BY role, membership_status
ORDER BY role, membership_status;

-- Check 2: Athletes without club_id (may need manual review)
SELECT 
  '2. Athletes Without Club ID' as check_name,
  COUNT(*) as count
FROM profiles
WHERE role = 'athlete'
  AND club_id IS NULL;

-- Check 3: Approved applications with assigned_coach_id
SELECT 
  '3. Approved Applications Status' as check_name,
  COUNT(*) as total_approved,
  COUNT(assigned_coach_id) as with_assigned_coach,
  COUNT(*) - COUNT(assigned_coach_id) as without_assigned_coach
FROM membership_applications
WHERE status = 'approved';

-- Check 4: Athletes with active status
SELECT 
  '4. Active Athletes' as check_name,
  COUNT(*) as total_active_athletes,
  COUNT(coach_id) as with_coach,
  COUNT(club_id) as with_club
FROM profiles
WHERE role = 'athlete'
  AND membership_status = 'active';

-- Check 5: Coaches and admins status
SELECT 
  '5. Coach/Admin Status' as check_name,
  role,
  membership_status,
  COUNT(*) as count
FROM profiles
WHERE role IN ('coach', 'admin')
GROUP BY role, membership_status
ORDER BY role, membership_status;

-- Check 6: Detailed view of athletes (first 10)
SELECT 
  '6. Sample Athletes' as check_name,
  p.id,
  p.full_name,
  p.role,
  p.membership_status,
  p.coach_id IS NOT NULL as has_coach,
  p.club_id IS NOT NULL as has_club
FROM profiles p
WHERE p.role = 'athlete'
ORDER BY p.created_at DESC
LIMIT 10;
