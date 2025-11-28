-- ============================================================================
-- Create Test Club and Profiles
-- ============================================================================

-- Create default test club
INSERT INTO clubs (id, name, description)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Test Sports Club',
  'Default test club for development'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

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
  club_id = EXCLUDED.club_id,
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
  club_id = EXCLUDED.club_id,
  email = EXCLUDED.email;

-- Create user roles
INSERT INTO user_roles (user_id, role)
SELECT id, 'athlete'::user_role
FROM auth.users
WHERE email = 'athlete@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'athlete'::user_role;

INSERT INTO user_roles (user_id, role)
SELECT id, 'coach'::user_role
FROM auth.users
WHERE email = 'coach@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'coach'::user_role;

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::user_role
FROM auth.users
WHERE email = 'admin@test.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin'::user_role;

-- Verify the data
SELECT 
  'Clubs' as table_name,
  COUNT(*) as count
FROM clubs
UNION ALL
SELECT 
  'Athletes' as table_name,
  COUNT(*) as count
FROM athletes
UNION ALL
SELECT 
  'Coaches' as table_name,
  COUNT(*) as count
FROM coaches
UNION ALL
SELECT 
  'User Roles' as table_name,
  COUNT(*) as count
FROM user_roles;
