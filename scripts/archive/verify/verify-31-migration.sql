-- Verify migration 31: membership_applications columns and indexes

-- Check new columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'membership_applications'
  AND column_name IN ('assigned_coach_id', 'reviewed_by', 'rejection_reason')
ORDER BY column_name;

-- Check indexes exist
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'membership_applications'
  AND indexname IN ('idx_applications_club_status', 'idx_applications_assigned_coach', 'idx_applications_reviewed_by')
ORDER BY indexname;
