-- แก้ไขปัญหา infinite recursion ใน RLS policies
-- ปัญหา: policies ที่เรียกใช้ helper functions ซึ่ง query user_roles อีกที

-- ลบ policies เก่าที่มีปัญหา
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- สร้าง policies ใหม่ที่ไม่มี recursion
-- ใช้ auth.uid() โดยตรงแทนการเรียก helper function

-- 1. ผู้ใช้ดูบทบาทของตัวเองได้
CREATE POLICY "Users can view own role"
ON user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 2. Admin ดูและจัดการบทบาททั้งหมดได้
-- ใช้ subquery แทน helper function เพื่อหลีกเลี่ยง recursion
CREATE POLICY "Admins can manage all roles"
ON user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- ตรวจสอบ policies อื่นๆ ที่อาจมีปัญหา
-- profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- สร้าง policies ใหม่สำหรับ profiles
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
  )
);

-- Coaches can view profiles in their club
CREATE POLICY "Coaches can view club profiles"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'coach'
  )
  AND
  EXISTS (
    SELECT 1 FROM coaches c
    WHERE c.user_id = auth.uid()
    AND c.club_id = profiles.club_id
  )
);

-- ตรวจสอบผลลัพธ์
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('user_roles', 'profiles')
ORDER BY tablename, policyname;
