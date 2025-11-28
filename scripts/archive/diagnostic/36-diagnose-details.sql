-- Get detailed information about orphaned athletes
SELECT 
  a.id,
  a.user_id,
  a.email,
  a.first_name,
  a.last_name,
  a.club_id,
  c.name as club_name
FROM athletes a
LEFT JOIN membership_applications ma ON ma.user_id = a.user_id AND ma.club_id = a.club_id
LEFT JOIN clubs c ON c.id = a.club_id
WHERE ma.id IS NULL;
