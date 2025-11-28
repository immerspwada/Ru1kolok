-- Check profiles with their membership status and related data
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.membership_status,
  p.club_id,
  p.coach_id,
  ma.id as application_id,
  ma.status as application_status,
  ma.club_id as app_club_id,
  ma.assigned_coach_id as app_coach_id
FROM profiles p
LEFT JOIN membership_applications ma ON ma.user_id = p.id
WHERE p.role = 'athlete'
ORDER BY p.created_at DESC
LIMIT 20;
