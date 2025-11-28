-- ตรวจสอบโครงสร้างตาราง membership_applications
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'membership_applications'
  AND column_name IN ('user_id', 'personal_info', 'documents')
ORDER BY ordinal_position;

-- ตรวจสอบข้อมูลเอกสารในตาราง membership_applications
SELECT 
  id,
  user_id,
  status,
  jsonb_array_length(documents) as document_count,
  documents
FROM membership_applications
WHERE status = 'approved'
LIMIT 5;

-- นับจำนวนนักกีฬาที่มีเอกสาร
SELECT 
  COUNT(*) as total_athletes_with_documents,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(jsonb_array_length(documents)) as avg_documents_per_athlete
FROM membership_applications
WHERE status = 'approved'
  AND documents IS NOT NULL
  AND jsonb_array_length(documents) > 0;
