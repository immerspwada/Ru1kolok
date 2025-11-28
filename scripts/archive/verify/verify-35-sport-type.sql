-- Verify sport_type column exists and has correct properties
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'clubs' AND column_name = 'sport_type';

-- Check if index exists
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'clubs' AND indexname = 'idx_clubs_sport_type';

-- Show sample data
SELECT id, name, sport_type FROM clubs LIMIT 5;
