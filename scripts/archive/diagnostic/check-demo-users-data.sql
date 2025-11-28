-- ตรวจสอบข้อมูลบัญชี Demo ทั้งหมด

-- 1. ตรวจสอบ profiles
SELECT 
    'profiles' as table_name,
    email,
    full_name,
    role,
    membership_status,
    club_id,
    coach_id
FROM profiles
WHERE email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com')
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'coach' THEN 2
        WHEN 'athlete' THEN 3
    END;

-- 2. ตรวจสอบ user_roles
SELECT 
    'user_roles' as table_name,
    p.email,
    ur.role
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE p.email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com')
ORDER BY 
    CASE ur.role
        WHEN 'admin' THEN 1
        WHEN 'coach' THEN 2
        WHEN 'athlete' THEN 3
    END;

-- 3. ตรวจสอบ coaches
SELECT 
    'coaches' as table_name,
    p.email,
    c.first_name,
    c.last_name,
    c.specialization
FROM coaches c
JOIN profiles p ON c.user_id = p.id
WHERE p.email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com');

-- 4. ตรวจสอบ athletes
SELECT 
    'athletes' as table_name,
    p.email,
    a.first_name,
    a.last_name,
    a.date_of_birth
FROM athletes a
JOIN profiles p ON a.user_id = p.id
WHERE p.email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com');
