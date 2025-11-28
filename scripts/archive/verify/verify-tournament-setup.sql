-- Verify tournament system setup

-- 1. Check tables exist
SELECT 
  'tournaments' as table_name,
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournaments') as exists
UNION ALL
SELECT 
  'tournament_registrations',
  EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tournament_registrations');

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('tournaments', 'tournament_registrations')
ORDER BY tablename;

-- 3. Count policies
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('tournaments', 'tournament_registrations')
GROUP BY tablename
ORDER BY tablename;

-- 4. Check sample data
SELECT COUNT(*) as tournament_count FROM tournaments;
SELECT COUNT(*) as registration_count FROM tournament_registrations;

-- 5. Check a coach can see tournaments
SELECT 
  p.id as coach_id,
  p.role,
  p.club_id,
  COUNT(t.id) as visible_tournaments
FROM profiles p
LEFT JOIN tournaments t ON t.club_id = p.club_id
WHERE p.role = 'coach'
GROUP BY p.id, p.role, p.club_id
LIMIT 3;
