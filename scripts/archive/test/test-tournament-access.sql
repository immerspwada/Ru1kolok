-- Check if tournaments table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'tournaments'
);

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'tournaments';

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'tournaments';

-- Try to count tournaments (as service role)
SELECT COUNT(*) as total_tournaments FROM tournaments;

-- Check a sample coach profile
SELECT id, role, club_id 
FROM profiles 
WHERE role = 'coach' 
LIMIT 1;
