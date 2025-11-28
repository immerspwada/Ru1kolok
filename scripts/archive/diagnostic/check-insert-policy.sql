SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'membership_applications' AND cmd = 'INSERT';
