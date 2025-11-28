-- Check if athlete profile exists for athlete@test.com
-- This will show us if the user exists and if they have an athlete profile

SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'role' as user_role,
  a.id as athlete_id,
  a.first_name,
  a.last_name,
  a.club_id,
  c.name as club_name
FROM auth.users u
LEFT JOIN public.athletes a ON a.user_id = u.id
LEFT JOIN public.clubs c ON c.id = a.club_id
WHERE u.email = 'athlete@test.com';

-- Also check if there are any clubs available
SELECT id, name FROM public.clubs LIMIT 5;
