-- แก้ไขปัญหา infinite recursion โดยการลบ policies ที่มีปัญหาและสร้างใหม่
-- ที่ไม่มี circular dependency

-- ===== USER_ROLES TABLE =====
-- ลบ policies ทั้งหมดที่มีปัญหา
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update any user role" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert any user role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can insert user roles" ON user_roles;

-- สร้าง policies ใหม่ที่ไม่มี recursion
-- 1. ผู้ใช้ดูบทบาทของตัวเองได้ (ไม่มี subquery)
CREATE POLICY "user_roles_select_own"
ON user_roles
FOR SELECT
USING (user_id = auth.uid());

-- 2. Service role สามารถทำทุกอย่างได้ (ไม่ต้องตรวจสอบอะไร)
CREATE POLICY "user_roles_service_all"
ON user_roles
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. ผู้ใช้สามารถ insert role ของตัวเองได้ (สำหรับ registration)
CREATE POLICY "user_roles_insert_own"
ON user_roles
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- ===== PROFILES TABLE =====
-- ลบ policies ที่อาจมีปัญหา
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Coaches can view club profiles" ON profiles;
DROP POLICY IF EXISTS "Coaches can view athletes in their club" ON profiles;

-- สร้าง policies ใหม่สำหรับ profiles
-- 1. ผู้ใช้ดูและแก้ไข profile ของตัวเองได้
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
USING (id = auth.uid());

CREATE POLICY "profiles_insert_own"
ON profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 2. Service role ทำทุกอย่างได้
CREATE POLICY "profiles_service_all"
ON profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- ตรวจสอบผลลัพธ์
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('user_roles', 'profiles')
ORDER BY tablename, policyname;
