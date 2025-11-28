-- Verify progress reports system tables exist

-- Check progress_snapshots table
SELECT 
  'progress_snapshots' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'progress_snapshots';

-- Check progress_reports table
SELECT 
  'progress_reports' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'progress_reports';

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('progress_snapshots', 'progress_reports');

-- Check function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'calculate_progress_snapshot';

-- Check view exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_name = 'athlete_progress_summary';

SELECT '✅ Progress Reports System verification complete!' as status;
