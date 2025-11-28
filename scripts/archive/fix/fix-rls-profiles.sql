-- แก้ไข RLS policies สำหรับ profiles table

-- ปิด RLS ชั่วคราว (สำหรับการทดสอบ)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- หรือถ้าต้องการเปิด RLS แต่อนุญาตให้ทุกคนอ่านได้
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON profiles;
-- CREATE POLICY "Allow authenticated users to read profiles"
--   ON profiles FOR SELECT
--   TO authenticated
--   USING (true);

-- DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
-- CREATE POLICY "Allow users to read own profile"
--   ON profiles FOR SELECT
--   TO authenticated
--   USING (auth.uid() = id);

-- แสดงสถานะ RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'profiles';
