-- Check coach data and role
SELECT 
  u.id as user_id,
  u.email,
  ur.role,
  c.id as coach_id,
  c.first_name,
  c.last_name,
  c.club_id
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN coaches c ON c.user_id = u.id
WHERE u.email = 'coach@test.com';
