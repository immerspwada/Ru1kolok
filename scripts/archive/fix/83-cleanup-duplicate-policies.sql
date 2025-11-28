-- ลบ policies ที่ซ้ำกัน
DROP POLICY IF EXISTS "Coaches can view own club tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches can create tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches can update own club tournaments" ON tournaments;
DROP POLICY IF EXISTS "Coaches can delete own club tournaments" ON tournaments;
DROP POLICY IF EXISTS "Athletes can view tournaments they're in" ON tournaments;
DROP POLICY IF EXISTS "Athletes can view tournaments they're registered for" ON tournaments;
DROP POLICY IF EXISTS "Admins can view all tournaments" ON tournaments;

-- เก็บเฉพาะ policies ใหม่ที่ใช้ helper function
SELECT 'Cleanup complete' as status;

SELECT tablename, policyname
FROM pg_policies 
WHERE tablename = 'tournaments'
ORDER BY policyname;
