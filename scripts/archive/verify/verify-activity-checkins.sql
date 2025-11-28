-- ตรวจสอบข้อมูลในตาราง activity_checkins
SELECT 
  'activity_checkins' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT athlete_id) as unique_athletes,
  COUNT(DISTINCT activity_id) as unique_activities,
  MIN(checked_in_at) as earliest_checkin,
  MAX(checked_in_at) as latest_checkin
FROM activity_checkins;

-- ตรวจสอบ check-ins ล่าสุด 10 รายการ
SELECT 
  ac.id,
  ac.athlete_id,
  a.title as activity_title,
  ac.status,
  ac.checked_in_at,
  ac.checkin_method,
  ac.created_at
FROM activity_checkins ac
JOIN activities a ON a.id = ac.activity_id
ORDER BY ac.checked_in_at DESC
LIMIT 10;

-- ตรวจสอบสถิติการเช็คอินแต่ละนักกีฬา
SELECT 
  athlete_id,
  COUNT(*) as total_checkins,
  COUNT(CASE WHEN status = 'on_time' THEN 1 END) as on_time_count,
  COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
  MAX(checked_in_at) as last_checkin
FROM activity_checkins
GROUP BY athlete_id
ORDER BY total_checkins DESC
LIMIT 10;
