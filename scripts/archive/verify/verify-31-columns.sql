-- Verify columns only
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'membership_applications'
ORDER BY ordinal_position;
