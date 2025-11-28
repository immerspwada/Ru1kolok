-- สร้างผู้ใช้ทดสอบแบบง่าย (ใช้กับ Supabase Remote)
-- คัดลอกทั้งหมดแล้ววางใน Supabase Dashboard > SQL Editor

-- ลบผู้ใช้เก่าถ้ามี (ถ้าไม่มีก็ไม่เป็นไร)
DELETE FROM auth.users WHERE email IN ('admin@test.com', 'coach@test.com', 'athlete@test.com');

-- สร้าง Admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@test.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  ''
);

-- สร้าง Coach
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'coach@test.com',
  crypt('Coach123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  ''
);

-- สร้าง Athlete
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'athlete@test.com',
  crypt('Athlete123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  ''
);

-- แสดงผลลัพธ์
SELECT 
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email IN ('admin@test.com', 'coach@test.com', 'athlete@test.com')
ORDER BY email;
