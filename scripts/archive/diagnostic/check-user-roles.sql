-- Check user_roles data
SELECT 
  ur.user_id,
  u.email,
  ur.role,
  COUNT(*) OVER (PARTITION BY ur.user_id) as role_count
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
ORDER BY u.email;
