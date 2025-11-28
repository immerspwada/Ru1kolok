-- Check coaches table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'coaches'
ORDER BY ordinal_position;

-- Check profiles table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if we have any coaches
SELECT id, user_id, club_id FROM coaches LIMIT 3;

-- Check if we have any profiles with role coach
SELECT id, role, club_id FROM profiles WHERE role = 'coach' LIMIT 3;
