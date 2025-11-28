-- ตรวจสอบและแก้ไข profiles table

-- 1. ตรวจสอบว่ามี column role หรือยัง
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

-- 2. ตรวจสอบ profiles records ที่มีอยู่
SELECT id, email, full_name, role 
FROM profiles 
ORDER BY email;

-- 3. ตรวจสอบ users ที่ยังไม่มี profile
SELECT 
  u.id,
  u.email,
  'Missing profile' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. สร้าง profiles สำหรับ users ที่ยังไม่มี
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  CASE 
    WHEN u.email LIKE '%admin%' THEN 'admin'::user_role
    WHEN u.email LIKE '%coach%' THEN 'coach'::user_role
    ELSE 'athlete'::user_role
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. อัพเดท role ให้ถูกต้อง
UPDATE profiles SET role = 'admin'::user_role WHERE email LIKE '%admin%';
UPDATE profiles SET role = 'coach'::user_role WHERE email LIKE '%coach%';
UPDATE profiles SET role = 'athlete'::user_role WHERE email NOT LIKE '%admin%' AND email NOT LIKE '%coach%';

-- 6. แสดงผลลัพธ์สุดท้าย
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
ORDER BY role, email;
