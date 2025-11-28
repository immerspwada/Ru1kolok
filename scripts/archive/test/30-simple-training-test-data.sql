-- ============================================
-- Simple Training Test Data
-- ============================================
-- สร้างตารางฝึกซ้อมทดสอบแบบง่าย

DO $$
DECLARE
  v_coach_user_id UUID;
  v_club_id UUID;
BEGIN
  -- Get coach user
  SELECT user_id INTO v_coach_user_id
  FROM user_roles
  WHERE role = 'coach'
  LIMIT 1;

  IF v_coach_user_id IS NULL THEN
    RAISE NOTICE 'No coach found. Please run test user setup first.';
    RETURN;
  END IF;

  -- Get club_id from coaches table
  SELECT club_id INTO v_club_id
  FROM coaches
  WHERE user_id = v_coach_user_id
  LIMIT 1;

  IF v_club_id IS NULL THEN
    RAISE NOTICE 'No club found for coach.';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating training sessions for coach: %, club: %', v_coach_user_id, v_club_id;

  -- สร้างตารางฝึกซ้อมวันพรุ่งนี้
  INSERT INTO training_sessions (
    club_id,
    coach_id,
    title,
    description,
    session_date,
    start_time,
    end_time,
    location,
    status
  ) VALUES
  (
    v_club_id,
    v_coach_user_id,
    'ฝึกซ้อมประจำวัน - พรุ่งนี้',
    'ฝึกซ้อมทักษะและกลยุทธ์',
    CURRENT_DATE + INTERVAL '1 day',
    '16:00:00',
    '18:00:00',
    'สนามฟุตบอล A',
    'scheduled'
  );

  -- สร้างตารางฝึกซ้อมสัปดาห์หน้า
  INSERT INTO training_sessions (
    club_id,
    coach_id,
    title,
    description,
    session_date,
    start_time,
    end_time,
    location,
    status
  ) VALUES
  (
    v_club_id,
    v_coach_user_id,
    'ฝึกซ้อมพิเศษ - สัปดาห์หน้า',
    'ฝึกซ้อมเตรียมความพร้อมสำหรับการแข่งขัน',
    CURRENT_DATE + INTERVAL '7 days',
    '14:00:00',
    '16:00:00',
    'สนามฟุตบอล B',
    'scheduled'
  );

  RAISE NOTICE '✅ Training sessions created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Ready for testing!';
  RAISE NOTICE '  1. Login as coach@test.com to create more sessions';
  RAISE NOTICE '  2. Login as athlete@test.com to check-in and request leave';
  RAISE NOTICE '  3. Go to /dashboard/coach/leave-requests to review requests';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
END $$;
