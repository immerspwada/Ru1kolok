-- ===================================================================
-- Fix Tournaments RLS Infinite Recursion - FINAL
-- ===================================================================
-- ใช้กับตาราง tournaments และ tournament_participants ที่มีอยู่
-- ===================================================================

-- Drop policies ที่สร้างจาก script 80
DROP POLICY IF EXISTS "Coaches view own club tournaments" ON tournaments;
DROP POLICY IF EXISTS "Athletes view their tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches update tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches delete tournaments" ON tournaments;

DROP POLICY IF EXISTS "Coaches view participants" ON tournament_participants;
DROP POLICY IF EXISTS "Athletes view own participation" ON tournament_participants;
DROP POLICY IF EXISTS "Coaches add participants" ON tournament_participants;
DROP POLICY IF EXISTS "Coaches update participants" ON tournament_participants;
DROP POLICY IF EXISTS "Coaches remove participants" ON tournament_participants;

-- ===================================================================
-- HELPER FUNCTION เพื่อหลีกเลี่ยง recursion
-- ===================================================================

CREATE OR REPLACE FUNCTION is_coach_of_club(p_club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'coach'
      AND club_id = p_club_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ===================================================================
-- TOURNAMENTS POLICIES (ใช้ helper function)
-- ===================================================================

CREATE POLICY "Coaches view own club tournaments"
    ON tournaments FOR SELECT
    TO authenticated
    USING (is_coach_of_club(club_id));

CREATE POLICY "Coaches create tournaments"
    ON tournaments FOR INSERT
    TO authenticated
    WITH CHECK (
        is_coach_of_club(club_id)
        AND created_by = auth.uid()
    );

CREATE POLICY "Coaches update tournaments"
    ON tournaments FOR UPDATE
    TO authenticated
    USING (is_coach_of_club(club_id));

CREATE POLICY "Coaches delete tournaments"
    ON tournaments FOR DELETE
    TO authenticated
    USING (is_coach_of_club(club_id));

-- Athletes ดูทัวร์นาเมนต์ที่ตัวเองลงทะเบียน
CREATE POLICY "Athletes view their tournaments"
    ON tournaments FOR SELECT
    TO authenticated
    USING (
        id IN (
            SELECT tournament_id 
            FROM tournament_participants
            WHERE athlete_id = auth.uid()
        )
    );

-- ===================================================================
-- TOURNAMENT_PARTICIPANTS POLICIES
-- ===================================================================

CREATE POLICY "Coaches view participants"
    ON tournament_participants FOR SELECT
    TO authenticated
    USING (
        tournament_id IN (
            SELECT id FROM tournaments
            WHERE is_coach_of_club(club_id)
        )
    );

CREATE POLICY "Athletes view own participation"
    ON tournament_participants FOR SELECT
    TO authenticated
    USING (athlete_id = auth.uid());

CREATE POLICY "Coaches add participants"
    ON tournament_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        tournament_id IN (
            SELECT id FROM tournaments
            WHERE is_coach_of_club(club_id)
        )
        AND athlete_id IN (
            SELECT p.id FROM profiles p
            INNER JOIN tournaments t ON t.id = tournament_id
            WHERE p.club_id = t.club_id
              AND p.role = 'athlete'
        )
        AND added_by = auth.uid()
    );

CREATE POLICY "Coaches update participants"
    ON tournament_participants FOR UPDATE
    TO authenticated
    USING (
        tournament_id IN (
            SELECT id FROM tournaments
            WHERE is_coach_of_club(club_id)
        )
    );

CREATE POLICY "Coaches remove participants"
    ON tournament_participants FOR DELETE
    TO authenticated
    USING (
        tournament_id IN (
            SELECT id FROM tournaments
            WHERE is_coach_of_club(club_id)
        )
    );

-- ===================================================================
-- VERIFICATION
-- ===================================================================

SELECT 'Policies created successfully' as status;

SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN ('tournaments', 'tournament_participants')
ORDER BY tablename, policyname;
