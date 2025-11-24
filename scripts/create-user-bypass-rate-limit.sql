-- ===================================================================
-- สร้าง User โดยไม่ถูก Rate Limit (ใช้ SQL โดยตรง)
-- ===================================================================
-- หมายเหตุ: วิธีนี้ bypass rate limiting เพราะไม่ผ่าน auth API
-- ใช้สำหรับ development/testing เท่านั้น
-- ===================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_club_id UUID;
  v_email TEXT;
  v_password TEXT;
BEGIN
  -- กำหนด email และ password
  v_email := 'bypass-' || floor(random() * 1000000) || '@example.com';
  v_password := 'TestPassword123!';
  
  -- ลบ user เก่าถ้ามี (ถ้าต้องการ)
  -- DELETE FROM auth.users WHERE email = v_email;
  
  -- สร้าง user ใหม่
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    v_email,
    crypt(v_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('full_name', 'Bypass User'),
    false,
    'authenticated',
    'authenticated'
  )
  RETURNING id INTO v_user_id;
  
  -- หา club ที่มีอยู่
  SELECT id INTO v_club_id FROM clubs LIMIT 1;
  
  -- สร้าง profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    club_id,
    membership_status
  ) VALUES (
    v_user_id,
    v_email,
    'Bypass User',
    'athlete',
    v_club_id,
    'active'
  );
  
  -- สร้าง athlete record
  IF v_club_id IS NOT NULL THEN
    INSERT INTO athletes (
      user_id,
      club_id,
      email,
      first_name,
      last_name,
      date_of_birth,
      phone_number
    ) VALUES (
      v_user_id,
      v_club_id,
      v_email,
      'Bypass',
      'User',
      '2000-01-01',
      '0812345678'
    );
  END IF;
  
  -- แสดงผลลัพธ์
  RAISE NOTICE '✅ สร้าง user สำเร็จ (bypass rate limit)';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Password: %', v_password;
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  หมายเหตุ: Password ที่เข้ารหัสด้วย crypt() อาจไม่ทำงานกับ Supabase Auth';
  RAISE NOTICE '💡 แนะนำให้ใช้ scripts/create-test-user-via-api.js แทน';
  
END $$;

-- แสดงข้อมูล user ที่สร้างล่าสุด
SELECT 
    'User Created' as status,
    id,
    email,
    created_at,
    email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users
ORDER BY created_at DESC
LIMIT 1;
