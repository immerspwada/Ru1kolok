-- ============================================================================
-- Create Athlete Profiles for Test Users
-- ============================================================================

-- Create athlete profile for athlete@test.com
INSERT INTO athletes (
  user_id,
  club_id,
  first_name,
  last_name,
  nickname,
  date_of_birth,
  phone_number,
  email,
  gender,
  health_notes
)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test',
  'Athlete',
  'Athlete',
  '2000-01-01'::date,
  '0812345678',
  u.email,
  'male',
  'No health issues'
FROM auth.users u
WHERE u.email = 'athlete@test.com'
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  nickname = EXCLUDED.nickname,
  email = EXCLUDED.email;

-- Create coach profile for coach@test.com
INSERT INTO coaches (
  user_id,
  club_id,
  first_name,
  last_name,
  phone_number,
  email,
  specialization
)
SELECT 
  u.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test',
  'Coach',
  '0823456789',
  u.email,
  'General Training'
FROM auth.users u
WHERE u.email = 'coach@test.com'
ON CONFLICT (user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email;

-- Verify the data
SELECT 
  'Athletes' as table_name,
  COUNT(*) as count
FROM athletes
UNION ALL
SELECT 
  'Coaches' as table_name,
  COUNT(*) as count
FROM coaches;
