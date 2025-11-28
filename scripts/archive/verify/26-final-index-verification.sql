-- ============================================================================
-- Final Index Verification for Training Attendance System
-- ============================================================================
-- This script provides a comprehensive verification of all required indexes
-- ============================================================================

-- Check if all required indexes exist
DO $$
DECLARE
    missing_count INTEGER := 0;
    total_required INTEGER := 24; -- Total required custom indexes
    idx_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== TRAINING ATTENDANCE SYSTEM INDEX VERIFICATION ===';
    RAISE NOTICE '';
    
    -- TRAINING_SESSIONS INDEXES
    RAISE NOTICE '--- Training Sessions Indexes ---';
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_coach_id') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_coach_id'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_coach_id'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_status'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_team_scheduled') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_team_scheduled'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_team_scheduled'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_coach_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_coach_status'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_coach_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_scheduled_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_scheduled_status'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_scheduled_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_coach_scheduled') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_coach_scheduled'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_coach_scheduled'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_team_status_scheduled') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_team_status_scheduled'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_team_status_scheduled'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'training_sessions' AND indexname = 'idx_training_sessions_scheduled') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_training_sessions_scheduled (partial)'; ELSE RAISE WARNING '✗ MISSING: idx_training_sessions_scheduled'; missing_count := missing_count + 1; END IF;
    
    RAISE NOTICE '';
    
    -- ATTENDANCE INDEXES
    RAISE NOTICE '--- Attendance Indexes ---';
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_check_in_time') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_attendance_check_in_time'; ELSE RAISE WARNING '✗ MISSING: idx_attendance_check_in_time'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_marked_by') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_attendance_marked_by'; ELSE RAISE WARNING '✗ MISSING: idx_attendance_marked_by'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_athlete_checkin') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_attendance_athlete_checkin'; ELSE RAISE WARNING '✗ MISSING: idx_attendance_athlete_checkin'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_session_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_attendance_session_status'; ELSE RAISE WARNING '✗ MISSING: idx_attendance_session_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_athlete_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_attendance_athlete_status'; ELSE RAISE WARNING '✗ MISSING: idx_attendance_athlete_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_athlete_created') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_attendance_athlete_created'; ELSE RAISE WARNING '✗ MISSING: idx_attendance_athlete_created'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'attendance' AND indexname = 'idx_attendance_session_checkin') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_attendance_session_checkin (partial)'; ELSE RAISE WARNING '✗ MISSING: idx_attendance_session_checkin'; missing_count := missing_count + 1; END IF;
    
    RAISE NOTICE '';
    
    -- LEAVE_REQUESTS INDEXES
    RAISE NOTICE '--- Leave Requests Indexes ---';
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_session_id') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_session_id'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_session_id'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_athlete_id') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_athlete_id'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_athlete_id'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_status'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_reviewed_by') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_reviewed_by'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_reviewed_by'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_athlete_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_athlete_status'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_athlete_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_session_status') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_session_status'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_session_status'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_requested_at') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_requested_at'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_requested_at'; missing_count := missing_count + 1; END IF;
    
    SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'leave_requests' AND indexname = 'idx_leave_requests_pending') INTO idx_exists;
    IF idx_exists THEN RAISE NOTICE '✓ idx_leave_requests_pending (partial)'; ELSE RAISE WARNING '✗ MISSING: idx_leave_requests_pending'; missing_count := missing_count + 1; END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION SUMMARY ===';
    RAISE NOTICE 'Required indexes: %', total_required;
    RAISE NOTICE 'Missing indexes: %', missing_count;
    RAISE NOTICE 'Present indexes: %', total_required - missing_count;
    
    IF missing_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ SUCCESS: All required indexes are present!';
        RAISE NOTICE 'The database is properly optimized for the training attendance system.';
    ELSE
        RAISE WARNING '';
        RAISE WARNING '⚠️  WARNING: % indexes are missing!', missing_count;
        RAISE WARNING 'Run script 13-create-training-attendance-indexes.sql to create missing indexes.';
    END IF;
END $$;

-- Show index counts per table
SELECT 
    tablename,
    COUNT(*) as total_indexes,
    COUNT(*) FILTER (WHERE indexname NOT LIKE '%_pkey%') as custom_indexes
FROM pg_indexes 
WHERE tablename IN ('training_sessions', 'attendance', 'leave_requests')
GROUP BY tablename
ORDER BY tablename;
