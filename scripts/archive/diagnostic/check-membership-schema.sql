-- Check membership_applications table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'membership_applications'
ORDER BY ordinal_position;

-- Check clubs table schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'clubs'
ORDER BY ordinal_position;

-- Check profiles table constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
AND contype = 'c';
