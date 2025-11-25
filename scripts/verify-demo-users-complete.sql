-- ตรวจสอบข้อมูลบัญชี Demo แบบรวม

SELECT 
    p.email,
    p.full_name,
    p.role as profile_role,
    p.membership_status,
    ur.role as user_role,
    CASE 
        WHEN c.user_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_coach_record,
    CASE 
        WHEN a.user_id IS NOT NULL THEN 'Yes'
        ELSE 'No'
    END as has_athlete_record,
    coach.full_name as assigned_coach
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN coaches c ON p.id = c.user_id
LEFT JOIN athletes a ON p.id = a.user_id
LEFT JOIN profiles coach ON p.coach_id = coach.id
WHERE p.email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com')
ORDER BY 
    CASE p.role
        WHEN 'admin' THEN 1
        WHEN 'coach' THEN 2
        WHEN 'athlete' THEN 3
    END;
