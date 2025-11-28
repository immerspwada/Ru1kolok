-- ============================================================================
-- Analyze Index Usage and Performance
-- ============================================================================
-- This script provides detailed information about index usage and effectiveness
-- ============================================================================

-- ============================================================================
-- PART 1: List all indexes with their definitions
-- ============================================================================

\echo '=== TRAINING_SESSIONS INDEXES ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'training_sessions'
ORDER BY indexname;

\echo ''
\echo '=== ATTENDANCE INDEXES ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'attendance'
ORDER BY indexname;

\echo ''
\echo '=== LEAVE_REQUESTS INDEXES ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'leave_requests'
ORDER BY indexname;

-- ============================================================================
-- PART 2: Index size analysis
-- ============================================================================

\echo ''
\echo '=== INDEX SIZE ANALYSIS ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('training_sessions', 'attendance', 'leave_requests')
ORDER BY tablename, indexname;

-- ============================================================================
-- PART 3: Identify unused indexes (potential candidates for removal)
-- ============================================================================

\echo ''
\echo '=== UNUSED INDEXES (idx_scan = 0) ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as times_used
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('training_sessions', 'attendance', 'leave_requests')
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey'  -- Exclude primary keys
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- PART 4: Most frequently used indexes
-- ============================================================================

\echo ''
\echo '=== MOST FREQUENTLY USED INDEXES ==='
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('training_sessions', 'attendance', 'leave_requests')
  AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 20;

-- ============================================================================
-- PART 5: Table statistics
-- ============================================================================

\echo ''
\echo '=== TABLE STATISTICS ==='
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN ('training_sessions', 'attendance', 'leave_requests')
ORDER BY tablename;

-- ============================================================================
-- PART 6: Check for duplicate or redundant indexes
-- ============================================================================

\echo ''
\echo '=== CHECKING FOR REDUNDANT INDEXES ==='
\echo 'Note: Composite indexes can make single-column indexes redundant'
\echo 'Example: idx(a,b) can serve queries on (a) alone'

-- This query identifies indexes on the same table with overlapping columns
SELECT 
    t.tablename,
    i1.indexname as index1,
    i1.indexdef as def1,
    i2.indexname as index2,
    i2.indexdef as def2
FROM pg_indexes i1
JOIN pg_indexes i2 ON i1.tablename = i2.tablename 
    AND i1.indexname < i2.indexname
JOIN pg_tables t ON t.tablename = i1.tablename
WHERE t.schemaname = 'public'
  AND i1.tablename IN ('training_sessions', 'attendance', 'leave_requests')
  AND (
    -- Check if one index definition contains the other's columns
    i1.indexdef LIKE '%' || split_part(split_part(i2.indexdef, '(', 2), ')', 1) || '%'
    OR i2.indexdef LIKE '%' || split_part(split_part(i1.indexdef, '(', 2), ')', 1) || '%'
  )
ORDER BY t.tablename, i1.indexname;
