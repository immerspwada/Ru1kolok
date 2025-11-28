-- ตรวจสอบ Storage Bucket และ RLS Policies สำหรับเอกสาร

-- 1. ตรวจสอบว่ามี bucket membership-documents หรือไม่
SELECT 
  '=== Storage Buckets ===' as section;

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name = 'membership-documents';

-- 2. ตรวจสอบ RLS Policies ของ bucket
SELECT 
  '=== Storage Policies ===' as section;

SELECT 
  policyname as policy_name,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%membership%'
ORDER BY policyname;

-- 3. ตรวจสอบไฟล์ที่อัพโหลดแล้ว (ถ้ามี)
SELECT 
  '=== Uploaded Files ===' as section;

SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  last_accessed_at,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type
FROM storage.objects
WHERE bucket_id = 'membership-documents'
ORDER BY created_at DESC
LIMIT 20;

-- 4. ตรวจสอบ membership_applications ที่มีเอกสาร
SELECT 
  '=== Applications with Documents ===' as section;

SELECT 
  id,
  user_id,
  club_id,
  status,
  jsonb_array_length(documents) as document_count,
  documents,
  created_at
FROM membership_applications
WHERE jsonb_array_length(documents) > 0
ORDER BY created_at DESC
LIMIT 10;

-- 5. สรุปสถิติการอัพโหลด
SELECT 
  '=== Upload Statistics ===' as section;

SELECT 
  COUNT(*) as total_applications,
  COUNT(*) FILTER (WHERE jsonb_array_length(documents) > 0) as with_documents,
  AVG(jsonb_array_length(documents)) as avg_documents_per_app,
  ROUND(100.0 * COUNT(*) FILTER (WHERE jsonb_array_length(documents) > 0) / NULLIF(COUNT(*), 0), 2) as document_upload_percentage
FROM membership_applications
WHERE created_at > NOW() - INTERVAL '30 days';

-- 6. ตรวจสอบประเภทเอกสารที่อัพโหลด
SELECT 
  '=== Document Types ===' as section;

SELECT 
  doc->>'type' as document_type,
  COUNT(*) as count
FROM membership_applications,
  jsonb_array_elements(documents) as doc
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY doc->>'type'
ORDER BY count DESC;
