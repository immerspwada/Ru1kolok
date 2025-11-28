-- ===================================================================
-- Fix Tournaments RLS Infinite Recursion
-- ===================================================================
-- Problem: The RLS policies cause infinite recursion
-- Solution: Simplify policies to avoid nested EXISTS on same table
-- ===================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Coaches can view own club tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches can update own club tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches can delete own club tournaments" ON tournaments;
DROP POLICY IF EXISTS "Athletes can view tournaments they're registered for" ON tournaments;
DROP POLICY IF EXISTS "Admins can view all tournaments" ON tournaments;

DROP POLICY IF EXISTS "Coaches can view own club tournament registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Coaches can register athletes" ON tournament_registrations;
DROP POLICY IF EXISTS "Coaches can update registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Coaches can delete registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Athletes can view own registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "Admins can manage all registrations" ON tournament_registrations;

-- ===================================================================
-- TOURNAMENTS POLICIES (Simplified)
-- ===================================================================

-- Coaches can view tournaments in their club
CREATE POLICY "Coaches can view own club tournaments"
    ON tournaments FOR SELECT
    TO authenticated
    USING (
        club_id IN (
            SELECT club_id FROM profiles
            WHERE id = auth.uid()
            AND role = 'coach'
        )
    );

-- Coaches can create tournaments for their club
CREATE POLICY "Coaches can create tournaments"
    ON tournaments FOR INSERT
    TO authenticated
    WITH CHECK (
        club_id IN (
            SELECT club_id FROM profiles
            WHERE id = auth.uid()
            AND role = 'coach'
        )
        AND created_by = auth.uid()
    );

-- Coaches can update their club's tournaments
CREATE POLICY "Coaches can update own club tournaments"
    ON tournaments FOR UPDATE
    TO authenticated
    USING (
        club_id IN (
            SELECT club_id FROM profiles
            WHERE id = auth.uid()
            AND role = 'coach'
        )
    );

-- Coaches can delete their club's tournaments
CREATE POLICY "Coaches can delete own club tournaments"
    ON tournaments FOR DELETE
    TO authenticated
    USING (
        club_id IN (
            SELECT club_id FROM profiles
            WHERE id = auth.uid()
            AND role = 'coach'
        )
    );

-- Athletes can view tournaments they're registered for
CREATE POLICY "Athletes can view tournaments they're registered for"
    ON tournaments FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT tournament_id FROM tournament_registrations
            WHERE athlete_id = auth.uid()
        )
        AND auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'athlete'
        )
    );

-- Admins can view all tournaments
CREATE POLICY "Admins can view all tournaments"
    ON tournaments FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- ===================================================================
-- TOURNAMENT REGISTRATIONS POLICIES (Simplified)
-- ===================================================================

-- Coaches can view registrations for their club's tournaments
CREATE POLICY "Coaches can view own club tournament registrations"
    ON tournament_registrations FOR SELECT
    TO authenticated
    USING (
        tournament_id IN (
            SELECT t.id FROM tournaments t
            INNER JOIN profiles p ON p.club_id = t.club_id
            WHERE p.id = auth.uid()
            AND p.role = 'coach'
        )
    );

-- Coaches can register athletes from their club
CREATE POLICY "Coaches can register athletes"
    ON tournament_registrations FOR INSERT
    TO authenticated
    WITH CHECK (
        tournament_id IN (
            SELECT t.id FROM tournaments t
            INNER JOIN profiles p ON p.club_id = t.club_id
            WHERE p.id = auth.uid()
            AND p.role = 'coach'
        )
        AND athlete_id IN (
            SELECT p.id FROM profiles p
            INNER JOIN profiles coach ON coach.club_id = p.club_id
            WHERE coach.id = auth.uid()
            AND p.role = 'athlete'
        )
        AND registered_by = auth.uid()
    );

-- Coaches can update registrations
CREATE POLICY "Coaches can update registrations"
    ON tournament_registrations FOR UPDATE
    TO authenticated
    USING (
        tournament_id IN (
            SELECT t.id FROM tournaments t
            INNER JOIN profiles p ON p.club_id = t.club_id
            WHERE p.id = auth.uid()
            AND p.role = 'coach'
        )
    );

-- Coaches can delete registrations
CREATE POLICY "Coaches can delete registrations"
    ON tournament_registrations FOR DELETE
    TO authenticated
    USING (
        tournament_id IN (
            SELECT t.id FROM tournaments t
            INNER JOIN profiles p ON p.club_id = t.club_id
            WHERE p.id = auth.uid()
            AND p.role = 'coach'
        )
    );

-- Athletes can view their own registrations
CREATE POLICY "Athletes can view own registrations"
    ON tournament_registrations FOR SELECT
    TO authenticated
    USING (
        athlete_id = auth.uid()
        AND auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'athlete'
        )
    );

-- Admins can manage all registrations
CREATE POLICY "Admins can manage all registrations"
    ON tournament_registrations FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- ===================================================================
-- VERIFICATION
-- ===================================================================

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('tournaments', 'tournament_registrations')
ORDER BY tablename, policyname;
