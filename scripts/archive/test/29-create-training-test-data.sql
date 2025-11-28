-- ============================================
-- Training Attendance Test Data
-- ============================================
-- สร้างข้อมูลทดสอบสำหรับระบบ Training Attendance
-- รวม: training sessions, attendance records, leave requests

-- ============================================
-- 1. สร้างตารางฝึกซ้อมทดสอบ
-- ============================================

-- ดึง coach_id และ club_id จาก test users
DO $$
DECLARE
  v_coach_user_id UUID;
  v_coach_id UUID;
  v_club_id UUID;
  v_athlete_id UUID;
  v_session_id UUID;
  v_session_tomorrow UUID;
  v_session_next_week UUID;
BEGIN
  -- Get coach user
  SELECT user_id INTO v_coach_user_id
  FROM user_roles
  WHERE role = 'coach'
  LIMIT 1;

  -- Get coach profile
  SELECT id, club_id INTO v_coach_id, v_club_id
  FROM coaches
  WHERE user_id = v_coach_user_id
  LIMIT 1;

  -- Get athlete
  SELECT id INTO v_athlete_id
  FROM athletes
  WHERE club_id = v_club_id
  LIMIT 1;

  IF v_coach_id IS NULL OR v_club_id IS NULL THEN
    RAISE NOTICE 'No coach found. Please run test user setup first.';
    RETURN;
  END IF;

  RAISE NOTICE 'Creating training sessions for coach: %, club: %', v_coach_id, v_club_id;

  -- ตารางฝึกซ้อมที่ผ่านมาแล้ว (สำหรับทดสอบประวัติ)
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
    'ฝึกซ้อมพื้นฐาน - สัปดาห์ที่แล้ว',
    'ฝึกซ้อมทักษะพื้นฐานและการเคลื่อนไหว',
    CURRENT_DATE - INTERVAL '7 days',
    '16:00:00',
    '18:00:00',
    'สนามฟุตบอล A',
    'completed'
  ),
  (
    v_club_id,
    v_coach_user_id,
    'ฝึกซ้อมยิงประตู - 5 วันที่แล้ว',
    'ฝึกซ้อมการยิงประตูและการทำประตู',
    CURRENT_DATE - INTERVAL '5 days',
    '16:00:00',
    '18:00:00',
    'สนามฟุตบอล B',
    'completed'
  ),
  (
    v_club_id,
    v_coach_user_id,
    'ฝึกซ้อมการป้องกัน - 3 วันที่แล้ว',
    'ฝึกซ้อมการป้องกันและการรับมือกับคู่ต่อสู้',
    CURRENT_DATE - INTERVAL '3 days',
    '16:00:00',
    '18:00:00',
    'สนามฟุตบอล A',
    'completed'
  );

  -- ตารางฝึกซ้อมวันพรุ่งนี้ (สำหรับทดสอบการเช็คอินและแจ้งลา)
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
  )
  RETURNING id INTO v_session_tomorrow;

  -- ตารางฝึกซ้อมสัปดาห์หน้า (สำหรับทดสอบการแจ้งลา)
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

  -- Get the session ID for leave request
  SELECT id INTO v_session_next_week
  FROM training_sessions
  WHERE club_id = v_club_id
    AND session_date = CURRENT_DATE + INTERVAL '7 days'
    AND title = 'ฝึกซ้อมพิเศษ - สัปดาห์หน้า'
  LIMIT 1;

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
    'แมตช์กระชับมิตร - 10 วันข้างหน้า',
    'แมตช์กระชับมิตรกับทีมอื่น',
    CURRENT_DATE + INTERVAL '10 days',
    '10:00:00',
    '12:00:00',
    'สนามกีฬากลาง',
    'scheduled'
  );

  RAISE NOTICE 'Created training sessions successfully';

  -- ============================================
  -- 2. สร้าง Attendance Records สำหรับตารางที่ผ่านมา
  -- ============================================

  IF v_athlete_id IS NOT NULL THEN
    -- สร้าง attendance records สำหรับตารางที่ผ่านมา
    FOR v_session_id IN 
      SELECT id FROM training_sessions 
      WHERE club_id = v_club_id
        AND session_date < CURRENT_DATE
        AND status = 'completed'
    LOOP
      INSERT INTO attendance (
        training_session_id,
        athlete_id,
        status,
        check_in_time,
        check_in_method,
        notes
      ) VALUES (
        v_session_id,
        v_athlete_id,
        CASE 
          WHEN random() < 0.8 THEN 'present'::attendance_status
          WHEN random() < 0.9 THEN 'late'::attendance_status
          ELSE 'absent'::attendance_status
        END,
        NOW() - INTERVAL '5 minutes',
        'manual',
        NULL
      );
    END LOOP;

    RAISE NOTICE 'Created attendance records for past sessions';
  END IF;

  -- ============================================
  -- 3. สร้าง Leave Request ทดสอบ
  -- ============================================

  IF v_athlete_id IS NOT NULL AND v_session_next_week IS NOT NULL THEN
    -- สร้างคำขอลาที่รอพิจารณา
    INSERT INTO leave_requests (
      session_id,
      athlete_id,
      reason,
      status,
      requested_at
    ) VALUES
    (
      v_session_next_week,
      v_athlete_id,
      'มีธุระส่วนตัวที่สำคัญ ต้องไปพบแพทย์ตามนัดหมาย',
      'pending',
      NOW()
    );

    RAISE NOTICE 'Created leave request for testing';
  END IF;

  RAISE NOTICE '✅ Training attendance test data created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Summary:';
  RAISE NOTICE '  - Past sessions: 3 (with attendance records)';
  RAISE NOTICE '  - Upcoming sessions: 3';
  RAISE NOTICE '  - Leave requests: 1 (pending)';
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Ready for testing!';
  RAISE NOTICE '  1. Login as coach@test.com to manage sessions';
  RAISE NOTICE '  2. Login as athlete@test.com to check-in and request leave';
  RAISE NOTICE '  3. Login as admin@test.com to view statistics';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test data: %', SQLERRM;
    RAISE;
END $$;
