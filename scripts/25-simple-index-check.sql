-- ============================================================================
-- Simple Index Verification for Training Attendance System
-- ============================================================================

-- Check training_sessions indexes
SELECT 
    'training_sessions' as table_name,
    indexname,
    CASE 
        WHEN indexname LIKE '%coach%' THEN 'Coach queries'
        WHEN indexname LIKE '%team%' THEN 'Team/Club queries'
        WHEN indexname LIKE '%scheduled%' THEN 'Date/time queries'
        WHEN indexname LIKE '%status%' THEN 'Status filtering'
        ELSE 'Other'
    END as purpose
FROM pg_indexes 
WHERE tablename = 'training_sessions'
  AND indexname NOT LIKE '%pkey%'
ORDER BY indexname;

-- Check attendance indexes  
SELECT 
    'attendance' as table_name,
    indexname,
    CASE 
        WHEN indexname LIKE '%athlete%' THEN 'Athlete queries'
        WHEN indexname LIKE '%session%' THEN 'Session queries'
        WHEN indexname LIKE '%checkin%' OR indexname LIKE '%check_in%' THEN 'Check-in tracking'
        WHEN indexname LIKE '%status%' THEN 'Status filtering'
        ELSE 'Other'
    END as purpose
FROM pg_indexes 
WHERE tablename = 'attendance'
  AND indexname NOT LIKE '%pkey%'
ORDER BY indexname;

-- Check leave_requests indexes
SELECT 
    'leave_requests' as table_name,
    indexname,
    CASE 
        WHEN indexname LIKE '%athlete%' THEN 'Athlete queries'
        WHEN indexname LIKE '%session%' THEN 'Session queries'
        WHEN indexname LIKE '%status%' THEN 'Status filtering'
        WHEN indexname LIKE '%reviewed%' THEN 'Review tracking'
        ELSE 'Other'
    END as purpose
FROM pg_indexes 
WHERE tablename = 'leave_requests'
  AND indexname NOT LIKE '%pkey%'
ORDER BY indexname;

-- Summary
SELECT 
    tablename,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE indexname NOT LIKE '%pkey%') as custom_indexes
FROM pg_indexes 
WHERE tablename IN ('training_sessions', 'attendance', 'leave_requests')
GROUP BY tablename
ORDER BY tablename;
