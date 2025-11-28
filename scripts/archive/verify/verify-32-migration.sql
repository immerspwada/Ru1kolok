-- Verify migration 32: profiles table updates

-- Check columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('membership_status', 'coach_id', 'club_id')
ORDER BY column_name;

-- Check enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'membership_status'::regtype
ORDER BY enumsortorder;

-- Check existing data distribution
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN membership_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN membership_status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN membership_status = 'suspended' THEN 1 END) as suspended,
  COUNT(coach_id) as with_coach,
  COUNT(club_id) as with_club
FROM profiles;
