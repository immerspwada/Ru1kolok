-- ตรวจสอบ schema ของ membership_applications

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'membership_applications'
ORDER BY ordinal_position;
