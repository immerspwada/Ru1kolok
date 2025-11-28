-- Check approved applications and their assigned_coach_id status
SELECT 
  ma.id,
  ma.user_id,
  ma.status,
  ma.club_id,
  ma.assigned_coach_id,
  ma.reviewed_by,
  p.coach_id as profile_coach_id,
  p.club_id as profile_club_id,
  p.membership_status as profile_status
FROM membership_applications ma
LEFT JOIN profiles p ON ma.user_id = p.id
WHERE ma.status = 'approved'
ORDER BY ma.created_at DESC;
