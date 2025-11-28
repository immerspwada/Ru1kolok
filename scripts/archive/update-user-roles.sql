-- อัพเดท role ของผู้ใช้ทดสอบ
-- รันหลังจากสร้างผู้ใช้ผ่าน Dashboard หรือ Register แล้ว

-- อัพเดท role เป็น admin
UPDATE profiles 
SET role = 'admin'
WHERE email = 'admin@test.com';

-- อัพเดท role เป็น coach
UPDATE profiles 
SET role = 'coach'
WHERE email = 'coach@test.com';

-- อัพเดท role เป็น athlete
UPDATE profiles 
SET role = 'athlete'
WHERE email = 'athlete@test.com';

-- แสดงผลลัพธ์
SELECT 
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE email IN ('admin@test.com', 'coach@test.com', 'athlete@test.com')
ORDER BY email;
