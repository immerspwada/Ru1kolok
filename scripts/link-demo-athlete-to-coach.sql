-- เชื่อมโยง Demo Athlete กับ Demo Coach
UPDATE profiles
SET coach_id = (
    SELECT id FROM profiles WHERE email = 'demo.coach@test.com'
)
WHERE email = 'demo.athlete@test.com';

-- แสดงผลลัพธ์
SELECT 
    p.email,
    p.full_name,
    p.role,
    c.full_name as coach_name
FROM profiles p
LEFT JOIN profiles c ON p.coach_id = c.id
WHERE p.email IN ('demo.admin@test.com', 'demo.coach@test.com', 'demo.athlete@test.com')
ORDER BY 
    CASE p.role
        WHEN 'admin' THEN 1
        WHEN 'coach' THEN 2
        WHEN 'athlete' THEN 3
    END;
