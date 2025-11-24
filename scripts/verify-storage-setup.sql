-- ============================================================================
-- Verify Storage Bucket and RLS Policies Setup
-- ============================================================================

-- Check bucket configuration
SELECT 
  '=== Storage Bucket ===' as section,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'membership-documents';

-- Check RLS policies
SELECT 
  '=== RLS Policies ===' as section,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN policyname LIKE '%upload%' THEN 'Allow users to upload files'
    WHEN policyname LIKE '%view%' AND policyname LIKE '%own%' THEN 'Allow users to view their files'
    WHEN policyname LIKE '%update%' THEN 'Allow users to update their files'
    WHEN policyname LIKE '%delete%' THEN 'Allow users to delete their files'
    WHEN policyname LIKE '%coach%' THEN 'Allow coaches to view applicant files'
    WHEN policyname LIKE '%admin%' THEN 'Allow admins to view all files'
    ELSE 'Other policy'
  END as description
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%documents%'
ORDER BY cmd, policyname;

-- Summary
SELECT 
  '=== Summary ===' as section,
  (SELECT COUNT(*) FROM storage.buckets WHERE id = 'membership-documents') as bucket_exists,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%documents%') as policy_count;
