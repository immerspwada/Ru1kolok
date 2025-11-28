-- List all policies on membership_applications
SELECT 
  policyname,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Yes'
    ELSE 'No'
  END as has_with_check_clause
FROM pg_policies
WHERE tablename = 'membership_applications'
ORDER BY policyname;
