-- ============================================================================
-- Verify RLS Policies for Membership Applications
-- ============================================================================

-- Check all policies on membership_applications table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'membership_applications';
