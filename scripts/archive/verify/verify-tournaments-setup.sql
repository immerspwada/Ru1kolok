-- ===================================================================
-- Verify Tournaments System Setup
-- ===================================================================

-- 1. Check if tables exist
SELECT 
    'tournaments' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tournaments'
    ) as exists;

SELECT 
    'tournament_registrations' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'tournament_registrations'
    ) as exists;

-- 2. Check RLS is enabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('tournaments', 'tournament_registrations')
ORDER BY tablename;

-- 3. Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('tournaments', 'tournament_registrations')
ORDER BY tablename, policyname;

-- 4. Check indexes
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename IN ('tournaments', 'tournament_registrations')
ORDER BY tablename, indexname;

-- 5. Count existing data
SELECT 'tournaments' as table_name, COUNT(*) as count FROM tournaments
UNION ALL
SELECT 'tournament_registrations', COUNT(*) FROM tournament_registrations;

-- 6. Check if current user can access tournaments
-- This will show what the current authenticated user can see
SELECT 
    t.id,
    t.name,
    t.club_id,
    t.status,
    t.start_date
FROM tournaments t
ORDER BY t.created_at DESC
LIMIT 5;
