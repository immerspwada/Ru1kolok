-- สคริปต์สร้างผู้ใช้ทดสอบสำหรับแต่ละระดับสิทธิ์
-- ใช้สำหรับการทดสอบระบบ

-- ⚠️ หมายเหตุ: ไฟล์นี้ใช้สำหรับการทดสอบเท่านั้น
-- ห้ามใช้ในระบบ Production

-- ============================================
-- ผู้ใช้ทดสอบที่จะสร้าง:
-- ============================================
-- 1. Admin: admin@test.com / Admin123!
-- 2. Coach: coach@test.com / Coach123!
-- 3. Athlete: athlete@test.com / Athlete123!
-- ============================================

-- สร้าง Admin User
DO $$
DECLARE
  admin_user_id uuid;
  admin_club_id uuid;
BEGIN
  -- สร้าง auth user สำหรับ admin
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'admin@test.com',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    false,
    'authenticated'
  )
  ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Admin123!', gen_salt('bf')),
      email_confirmed_at = now()
  RETURNING id INTO admin_user_id;

  -- สร้าง club สำหรับ admin
  INSERT INTO public.clubs (name, description, created_by)
  VALUES ('สโมสรทดสอบ Admin', 'สโมสรสำหรับการทดสอบระบบ', admin_user_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO admin_club_id;

  -- สร้าง profile สำหรับ admin
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    club_id,
    created_at,
    updated_at
  ) VALUES (
    admin_user_id,
    'admin@test.com',
    'ผู้ดูแลระบบทดสอบ',
    'admin',
    admin_club_id,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin',
      full_name = 'ผู้ดูแลระบบทดสอบ',
      club_id = admin_club_id;

  RAISE NOTICE '✓ สร้าง Admin User สำเร็จ: admin@test.com / Admin123!';
END $$;

-- สร้าง Coach User
DO $$
DECLARE
  coach_user_id uuid;
  coach_club_id uuid;
BEGIN
  -- สร้าง auth user สำหรับ coach
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'coach@test.com',
    crypt('Coach123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"coach"}',
    false,
    'authenticated'
  )
  ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Coach123!', gen_salt('bf')),
      email_confirmed_at = now()
  RETURNING id INTO coach_user_id;

  -- ใช้ club ที่มีอยู่แล้ว หรือสร้างใหม่
  SELECT id INTO coach_club_id FROM public.clubs LIMIT 1;
  
  IF coach_club_id IS NULL THEN
    INSERT INTO public.clubs (name, description, created_by)
    VALUES ('สโมสรทดสอบ Coach', 'สโมสรสำหรับการทดสอบโค้ช', coach_user_id)
    RETURNING id INTO coach_club_id;
  END IF;

  -- สร้าง profile สำหรับ coach
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    club_id,
    specialization,
    created_at,
    updated_at
  ) VALUES (
    coach_user_id,
    'coach@test.com',
    'โค้ชทดสอบ',
    'coach',
    coach_club_id,
    'ฟุตบอล',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'coach',
      full_name = 'โค้ชทดสอบ',
      club_id = coach_club_id,
      specialization = 'ฟุตบอล';

  RAISE NOTICE '✓ สร้าง Coach User สำเร็จ: coach@test.com / Coach123!';
END $$;

-- สร้าง Athlete User
DO $$
DECLARE
  athlete_user_id uuid;
  athlete_club_id uuid;
BEGIN
  -- สร้าง auth user สำหรับ athlete
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
  ) VALUES (
    gen_random_uuid(),
    'athlete@test.com',
    crypt('Athlete123!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"athlete"}',
    false,
    'authenticated'
  )
  ON CONFLICT (email) DO UPDATE
  SET encrypted_password = crypt('Athlete123!', gen_salt('bf')),
      email_confirmed_at = now()
  RETURNING id INTO athlete_user_id;

  -- ใช้ club ที่มีอยู่แล้ว
  SELECT id INTO athlete_club_id FROM public.clubs LIMIT 1;
  
  IF athlete_club_id IS NULL THEN
    INSERT INTO public.clubs (name, description, created_by)
    VALUES ('สโมสรทดสอบ Athlete', 'สโมสรสำหรับการทดสอบนักกีฬา', athlete_user_id)
    RETURNING id INTO athlete_club_id;
  END IF;

  -- สร้าง profile สำหรับ athlete
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    club_id,
    date_of_birth,
    phone_number,
    emergency_contact,
    emergency_phone,
    created_at,
    updated_at
  ) VALUES (
    athlete_user_id,
    'athlete@test.com',
    'นักกีฬาทดสอบ',
    'athlete',
    athlete_club_id,
    '2000-01-01',
    '0812345678',
    'ผู้ปกครอง',
    '0898765432',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'athlete',
      full_name = 'นักกีฬาทดสอบ',
      club_id = athlete_club_id,
      date_of_birth = '2000-01-01',
      phone_number = '0812345678',
      emergency_contact = 'ผู้ปกครอง',
      emergency_phone = '0898765432';

  RAISE NOTICE '✓ สร้าง Athlete User สำเร็จ: athlete@test.com / Athlete123!';
END $$;

-- แสดงสรุปผู้ใช้ที่สร้าง
SELECT 
  '=== ผู้ใช้ทดสอบที่สร้างเรียบร้อยแล้ว ===' as message
UNION ALL
SELECT ''
UNION ALL
SELECT '1. Admin:'
UNION ALL
SELECT '   Email: admin@test.com'
UNION ALL
SELECT '   Password: Admin123!'
UNION ALL
SELECT ''
UNION ALL
SELECT '2. Coach:'
UNION ALL
SELECT '   Email: coach@test.com'
UNION ALL
SELECT '   Password: Coach123!'
UNION ALL
SELECT ''
UNION ALL
SELECT '3. Athlete:'
UNION ALL
SELECT '   Email: athlete@test.com'
UNION ALL
SELECT '   Password: Athlete123!'
UNION ALL
SELECT ''
UNION ALL
SELECT '=== ใช้ข้อมูลเหล่านี้เพื่อเข้าสู่ระบบและทดสอบ ===';
