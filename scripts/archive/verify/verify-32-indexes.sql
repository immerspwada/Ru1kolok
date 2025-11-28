-- Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname IN ('idx_profiles_membership_status', 'idx_profiles_coach_id', 'idx_profiles_club_id')
ORDER BY indexname;
