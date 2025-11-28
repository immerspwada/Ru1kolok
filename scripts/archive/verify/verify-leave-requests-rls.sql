-- Comprehensive verification of leave_requests RLS setup
-- This script checks table structure, policies, and indexes

-- 1. Check if table exists and RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'leave_requests';

-- 2. Check all RLS policies
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'leave_requests'
ORDER BY 
  CASE cmd
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
    WHEN 'ALL' THEN 5
  END,
  policyname;

-- 3. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leave_requests'
ORDER BY indexname;

-- 4. Check constraints
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'leave_requests'::regclass
ORDER BY contype, conname;

-- 5. Count policies by operation type
SELECT 
  cmd as operation,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'leave_requests'
GROUP BY cmd
ORDER BY cmd;

-- 6. Summary
SELECT 
  'leave_requests' as table_name,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'leave_requests') as total_policies,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'leave_requests') as total_indexes,
  (SELECT COUNT(*) FROM pg_constraint WHERE conrelid = 'leave_requests'::regclass) as total_constraints,
  (SELECT rowsecurity FROM pg_tables WHERE tablename = 'leave_requests') as rls_enabled;
