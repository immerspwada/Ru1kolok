-- ============================================================================
-- Storage RLS Policies for membership-documents bucket
-- ============================================================================
-- Safe version: Only creates policies, no ALTER TABLE commands
-- ============================================================================

-- Drop existing policies if any (safe operation)
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Coaches can view documents in their club" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;

-- Policy 1: Users can upload their own documents
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own documents
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'membership-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Coaches can view documents from their club
CREATE POLICY "Coaches can view documents in their club"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents' AND
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.id
    WHERE p.id = auth.uid()
    AND ur.role = 'coach'
    AND EXISTS (
      SELECT 1 FROM membership_applications ma
      WHERE ma.user_id::text = (storage.foldername(name))[1]
      AND ma.club_id = p.club_id
    )
  )
);

-- Policy 6: Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents' AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Verification
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE '%documents%'
ORDER BY policyname;
