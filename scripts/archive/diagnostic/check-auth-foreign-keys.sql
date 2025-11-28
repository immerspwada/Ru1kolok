-- Check foreign keys to auth.users table

-- Check all foreign keys in the database
SELECT
  tc.table_schema,
  tc.table_name, 
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('profiles', 'user_roles', 'login_sessions')
  AND (ccu.table_name = 'users' OR kcu.column_name LIKE '%user_id%')
ORDER BY tc.table_name, kcu.column_name;

-- Check if profiles has user_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name IN ('id', 'user_id');

-- Check if user_roles has user_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_roles'
  AND column_name = 'user_id';

-- Check if login_sessions has user_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'login_sessions'
  AND column_name = 'user_id';
