-- Check test users and their profiles
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.membership_status,
    p.club_id,
    c.name as club_name
FROM profiles p
LEFT JOIN clubs c ON p.club_id = c.id
ORDER BY p.role, p.email
LIMIT 20;
