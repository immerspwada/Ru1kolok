SELECT policyname, cmd FROM pg_policies WHERE tablename = 'membership_applications' ORDER BY policyname;
