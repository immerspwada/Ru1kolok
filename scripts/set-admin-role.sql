-- ===================================================================
-- ตั้งค่า Admin Role สำหรับผู้ใช้
-- ===================================================================
-- ใช้สคริปต์นี้เพื่อเพิ่ม admin role ให้กับผู้ใช้ที่ต้องการ
-- ===================================================================

-- แสดงผู้ใช้ปัจจุบันทั้งหมด
SELECT 
    'Current Users' as info,
    u.id,
    u.email,
    p.full_name,
    p.role as profile_role,
    ur.role as user_roles_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at DESC
LIMIT 10;

-- ===================================================================
-- ตั้งค่า Admin Role
-- แก้ไข email ด้านล่างเป็นอีเมลของคุณ
-- ===================================================================

DO $$
DECLARE
    v_admin_email TEXT := 'YOUR_EMAIL@example.com'; -- แก้ไขตรงนี้
    v_user_id UUID;
BEGIN
    -- หา user id จาก email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_admin_email;

    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ ไม่พบผู้ใช้ที่มีอีเมล: %', v_admin_email;
        RETURN;
    END IF;

    -- อัพเดท role ในตาราง profiles
    UPDATE profiles
    SET role = 'admin'
    WHERE id = v_user_id;

    -- เพิ่มหรืออัพเดท role ในตาราง user_roles
    INSERT INTO user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin';

    RAISE NOTICE '✅ ตั้งค่า admin role สำเร็จ!';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Email: %', v_admin_email;
END $$;

-- ตรวจสอบผลลัพธ์
SELECT 
    'Admin Users' as info,
    u.id,
    u.email,
    p.full_name,
    p.role as profile_role,
    ur.role as user_roles_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE p.role = 'admin' OR ur.role = 'admin';
