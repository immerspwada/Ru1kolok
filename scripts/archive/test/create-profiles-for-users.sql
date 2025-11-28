-- สร้าง profile records สำหรับผู้ใช้ที่มีอยู่แล้ว

-- สร้าง profiles สำหรับผู้ใช้ทั้งหมดที่ยังไม่มี profile
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
);

-- อัพเดท role สำหรับผู้ใช้ทดสอบ
UPDATE profiles SET role = 'admin'::user_role WHERE email = 'admin@test.com';
UPDATE profiles SET role = 'coach'::user_role WHERE email = 'coach@test.com';
UPDATE profiles SET role = 'athlete'::user_role WHERE email = 'athlete@test.com';

-- แสดงผลลัพธ์
SELECT id, email, full_name, role, created_at
FROM profiles
ORDER BY email;
