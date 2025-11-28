-- ============================================================================
-- Verify Assigned Coach Migration Logic
-- ============================================================================
-- Description: Verify that approved applications have assigned_coach_id set
-- ============================================================================

-- Check 1: Count of approved applications by assigned_coach_id status
SELECT 
  '1. Approved Applications Status' as check_name,
  COUNT(*) as total_approved,
  COUNT(assigned_coach_id) as with_assigned_coach,
  COUNT(*) - COUNT(assigned_coach_id) as without_assigned_coach
FROM membership_applications
WHERE status = 'approved';

-- Check 2: Approved applications with details
SELECT 
  '2. Approved Applications Details' as check_name,
  ma.id,
  ma.user_id,
  ma.status,
  ma.club_id,
  ma.assigned_coach_id,
  ma.reviewed_by,
  p.coach_id as profile_coach_id,
  p.club_id as profile_club_id,
  CASE 
    WHEN ma.assigned_coach_id IS NOT NULL THEN 'Has assigned coach'
    WHEN p.coach_id IS NOT NULL THEN 'Profile has coach (should be migrated)'
    ELSE 'No coach available'
  END as migration_status
FROM membership_applications ma
LEFT JOIN profiles p ON ma.user_id = p.id
WHERE ma.status = 'approved'
ORDER BY ma.created_at DESC
LIMIT 20;

-- Check 3: Approved applications missing assigned_coach_id but profile has coach
SELECT 
  '3. Applications Needing Migration' as check_name,
  COUNT(*) as count
FROM membership_applications ma
INNER JOIN profiles p ON ma.user_id = p.id
WHERE ma.status = 'approved'
  AND ma.assigned_coach_id IS NULL
  AND p.coach_id IS NOT NULL;

-- Check 4: Summary of all applications by status
SELECT 
  '4. All Applications Summary' as check_name,
  status,
  COUNT(*) as count,
  COUNT(assigned_coach_id) as with_assigned_coach
FROM membership_applications
GROUP BY status
ORDER BY status;

-- Check 5: Verify migration script logic would work
-- This simulates what the migration script does
SELECT 
  '5. Migration Script Simulation' as check_name,
  ma.id as application_id,
  ma.user_id,
  ma.assigned_coach_id as current_assigned_coach,
  p.coach_id as would_be_set_to,
  CASE 
    WHEN ma.assigned_coach_id IS NULL AND p.coach_id IS NOT NULL 
    THEN 'Would be updated'
    WHEN ma.assigned_coach_id IS NOT NULL 
    THEN 'Already has assigned coach'
    ELSE 'No coach to assign'
  END as migration_action
FROM membership_applications ma
LEFT JOIN profiles p ON ma.user_id = p.id
WHERE ma.status = 'approved'
ORDER BY ma.created_at DESC
LIMIT 10;
