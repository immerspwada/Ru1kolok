-- Quick diagnostic to get current counts
-- This version returns simple counts that work with Management API

-- Count orphaned athletes
SELECT COUNT(*) as orphaned_athletes
FROM athletes a
LEFT JOIN membership_applications ma ON ma.user_id = a.user_id AND ma.club_id = a.club_id
WHERE ma.id IS NULL;

-- Count approved applications without athlete profiles
SELECT COUNT(*) as approved_without_profile
FROM membership_applications ma
LEFT JOIN athletes a ON a.user_id = ma.user_id AND a.club_id = ma.club_id
WHERE ma.status = 'approved' AND a.id IS NULL;

-- Count profiles without applications
SELECT COUNT(*) as profiles_without_apps
FROM profiles p
LEFT JOIN membership_applications ma ON ma.user_id = p.id
WHERE p.role = 'athlete' AND ma.id IS NULL;

-- Count status mismatches
SELECT COUNT(*) as status_mismatches
FROM profiles p
LEFT JOIN membership_applications ma ON ma.user_id = p.id
WHERE p.role = 'athlete'
  AND (
    (p.membership_status = 'active' AND (ma.status IS NULL OR ma.status != 'approved'))
    OR (p.membership_status = 'pending' AND ma.status = 'approved')
    OR (p.membership_status = 'rejected' AND (ma.status IS NULL OR ma.status != 'rejected'))
  );

-- Overall counts
SELECT 
  (SELECT COUNT(*) FROM profiles WHERE role = 'athlete') as total_athlete_profiles,
  (SELECT COUNT(*) FROM athletes) as total_athlete_records,
  (SELECT COUNT(*) FROM membership_applications) as total_applications,
  (SELECT COUNT(*) FROM membership_applications WHERE status = 'pending') as pending_applications,
  (SELECT COUNT(*) FROM membership_applications WHERE status = 'approved') as approved_applications,
  (SELECT COUNT(*) FROM membership_applications WHERE status = 'rejected') as rejected_applications;
