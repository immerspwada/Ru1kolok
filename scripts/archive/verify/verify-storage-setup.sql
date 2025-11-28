-- ตรวจสอบ Storage Bucket และ Policies

-- 1. ตรวจสอบ bucket
SELECT 
  '=== Storage Bucket ===' as section;

SELECT 
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name = 'membership-documents';

-- 2. ตรวจสอบ policies
SELECT 
  '=== Storage Policies ===' as section;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- 3. ตรวจสอบจำนวนไฟล์ในแต่ละ bucket
SELECT 
  '=== Files per Bucket ===' as section;

SELECT 
  bucket_id,
  COUNT(*) as file_count,
  SUM((metadata->>'size')::bigint) / 1024 / 1024 as total_size_mb
FROM storage.objects
GROUP BY bucket_id
ORDER BY file_count DESC;
