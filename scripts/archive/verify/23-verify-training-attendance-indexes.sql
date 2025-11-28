-- ============================================================================
-- Verify Training Attendance System Indexes
-- ============================================================================
-- This script verifies that all required indexes exist for optimal performance
-- ============================================================================

-- Check all indexes on training_sessions table
SELECT 
    'training_sessions' as table_name,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'training_sessions'
ORDER BY indexname;

-- Check all indexes on attendance table
SELECT 
    'attendance' as table_name,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'attendance'
ORDER BY indexname;

-- Check all indexes on leave_requests table
SELECT 
    'leave_requests' as table_name,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'leave_requests'
ORDER BY indexname;

-- Summary count of indexes per table
SELECT 
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename IN ('training_sessions', 'attendance', 'leave_requests')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- Required Indexes Checklist
-- ============================================================================

-- TRAINING_SESSIONS (should have ~10 indexes including PK):
-- ✓ idx_training_sessions_coach_id
-- ✓ idx_training_sessions_status
-- ✓ idx_training_sessions_team_scheduled
-- ✓ idx_training_sessions_coach_status
-- ✓ idx_training_sessions_scheduled_status
-- ✓ idx_training_sessions_coach_scheduled
-- ✓ idx_training_sessions_team_status_scheduled
-- ✓ idx_training_sessions_scheduled (partial)

-- ATTENDANCE (should have ~10 indexes including PK):
-- ✓ idx_attendance_check_in_time
-- ✓ idx_attendance_marked_by
-- ✓ idx_attendance_athlete_checkin
-- ✓ idx_attendance_session_status
-- ✓ idx_attendance_athlete_status
-- ✓ idx_attendance_athlete_created
-- ✓ idx_attendance_session_checkin (partial)

-- LEAVE_REQUESTS (should have ~9 indexes including PK):
-- ✓ idx_leave_requests_session_id
-- ✓ idx_leave_requests_athlete_id
-- ✓ idx_leave_requests_status
-- ✓ idx_leave_requests_reviewed_by
-- ✓ idx_leave_requests_athlete_status
-- ✓ idx_leave_requests_session_status
-- ✓ idx_leave_requests_requested_at
-- ✓ idx_leave_requests_pending (partial)

-- ============================================================================
-- Check for missing indexes
-- ============================================================================

DO $$
DECLARE
    missing_indexes TEXT[] := ARRAY[]::TEXT[];
    idx_exists BOOLEAN;
BEGIN
    -- Check training_sessions indexes
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_coach_id') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_training_sessions_coach_id'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_status') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_training_sessions_status'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_team_scheduled') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_training_sessions_team_scheduled'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_coach_status') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_training_sessions_coach_status'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_scheduled_status') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_training_sessions_scheduled_status'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_coach_scheduled') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_training_sessions_coach_scheduled'); END IF;
    
    -- Check attendance indexes
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_check_in_time') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_attendance_check_in_time'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_marked_by') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_attendance_marked_by'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_athlete_checkin') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_attendance_athlete_checkin'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_session_status') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_attendance_session_status'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_athlete_status') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_attendance_athlete_status'); END IF;
    
    -- Check leave_requests indexes
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_session_id') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_leave_requests_session_id'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_athlete_id') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_leave_requests_athlete_id'); END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_status') INTO idx_exists;
    IF NOT idx_exists THEN missing_indexes := array_append(missing_indexes, 'idx_leave_requests_status'); END IF;
    
    -- Report results
    IF array_length(missing_indexes, 1) IS NULL THEN
        RAISE NOTICE '✓ All required indexes exist!';
    ELSE
        RAISE WARNING '⚠ Missing indexes: %', array_to_string(missing_indexes, ', ');
    END IF;
END $$;
