-- ===================================================================
-- สร้างบัญชีทดสอบ (Demo Users) ทั้ง 3 ระดับ
-- ===================================================================
-- Admin, Coach, Athlete พร้อมข้อมูลครบถ้วน
-- Password ทั้งหมด: demo1234
-- ===================================================================

DO $$
DECLARE
    v_admin_id UUID;
    v_coach_id UUID;
    v_athlete_id UUID;
    v_club_id UUID;
    v_password_hash TEXT;
BEGIN
    -- เข้ารหัสรหัสผ่าน
    v_password_hash := crypt('demo1234', gen_salt('bf'));
    
    -- ลบ users เก่าถ้ามี
    DELETE FROM auth.users WHERE email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com');
    
    RAISE NOTICE '🗑️  ลบบัญชีเก่า (ถ้ามี)';
    
    -- หา club ที่มีอยู่ หรือสร้างใหม่
    SELECT id INTO v_club_id FROM clubs LIMIT 1;
    
    IF v_club_id IS NULL THEN
        INSERT INTO clubs (name, sport_type, description)
        VALUES ('Demo Sports Club', 'ฟุตบอล', 'สโมสรสำหรับทดสอบระบบ')
        RETURNING id INTO v_club_id;
        RAISE NOTICE '✨ สร้าง Demo Club';
    END IF;
    
    -- ===================================================================
    -- 1. สร้าง ADMIN
    -- ===================================================================
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
    ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
        'demo.admin@test.com', v_password_hash,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Admin Demo"}',
        false, 'authenticated', 'authenticated'
    ) RETURNING id INTO v_admin_id;
    
    INSERT INTO profiles (id, email, full_name, role, club_id, membership_status)
    VALUES (v_admin_id, 'demo.admin@test.com', 'Admin Demo', 'admin', v_club_id, 'active');
    
    INSERT INTO user_roles (user_id, role)
    VALUES (v_admin_id, 'admin');
    
    RAISE NOTICE '✅ สร้าง Admin: demo.admin@test.com';
    
    -- ===================================================================
    -- 2. สร้าง COACH
    -- ===================================================================
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
    ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
        'demo.coach@test.com', v_password_hash,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Coach Demo"}',
        false, 'authenticated', 'authenticated'
    ) RETURNING id INTO v_coach_id;
    
    INSERT INTO profiles (id, email, full_name, role, club_id, membership_status)
    VALUES (v_coach_id, 'demo.coach@test.com', 'Coach Demo', 'coach', v_club_id, 'active');
    
    INSERT INTO coaches (user_id, club_id, first_name, last_name, email, phone_number, specialization)
    VALUES (v_coach_id, v_club_id, 'Coach', 'Demo', 'demo.coach@test.com', '0812345678', 'ฟุตบอล');
    
    RAISE NOTICE '✅ สร้าง Coach: demo.coach@test.com';
    
    -- ===================================================================
    -- 3. สร้าง ATHLETE
    -- ===================================================================
    INSERT INTO auth.users (
        id, instance_id, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin, role, aud
    ) VALUES (
        gen_random_uuid(), '00000000-0000-0000-0000-000000000000',
        'demo.athlete@test.com', v_password_hash,
        NOW(), NOW(), NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Athlete Demo"}',
        false, 'authenticated', 'authenticated'
    ) RETURNING id INTO v_athlete_id;
    
    INSERT INTO profiles (id, email, full_name, role, club_id, membership_status, coach_id)
    VALUES (v_athlete_id, 'demo.athlete@test.com', 'Athlete Demo', 'athlete', v_club_id, 'active', v_coach_id);
    
    INSERT INTO athletes (
        user_id, club_id, email, first_name, last_name,
        date_of_birth, phone_number
    ) VALUES (
        v_athlete_id, v_club_id, 'demo.athlete@test.com', 'Athlete', 'Demo',
        '2000-01-01', '0898765432'
    );
    
    RAISE NOTICE '✅ สร้าง Athlete: demo.athlete@test.com';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 สร้างบัญชีทดสอบเสร็จสมบูรณ์!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📧 บัญชีทดสอบ:';
    RAISE NOTICE '';
    RAISE NOTICE '1️⃣  ADMIN';
    RAISE NOTICE '   Email: demo.admin@test.com';
    RAISE NOTICE '   Password: demo1234';
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣  COACH';
    RAISE NOTICE '   Email: demo.coach@test.com';
    RAISE NOTICE '   Password: demo1234';
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣  ATHLETE';
    RAISE NOTICE '   Email: demo.athlete@test.com';
    RAISE NOTICE '   Password: demo1234';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
END $$;

-- แสดงผลลัพธ์
SELECT 
    'Demo Users Created' as status,
    u.email,
    p.full_name,
    p.role,
    'demo1234' as password
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com')
ORDER BY 
    CASE p.role
        WHEN 'admin' THEN 1
        WHEN 'coach' THEN 2
        WHEN 'athlete' THEN 3
    END;
