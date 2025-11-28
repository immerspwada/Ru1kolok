-- Create notification trigger functions

-- Function to create notification for new training session
CREATE OR REPLACE FUNCTION notify_new_training_session()
RETURNS TRIGGER AS $$
DECLARE
  athlete_record RECORD;
  club_name TEXT;
BEGIN
  -- Get club name
  SELECT name INTO club_name FROM clubs WHERE id = NEW.club_id;
  
  -- Notify all athletes in the club
  FOR athlete_record IN 
    SELECT a.id, a.user_id 
    FROM athletes a 
    WHERE a.club_id = NEW.club_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, session_id)
    VALUES (
      athlete_record.user_id,
      'new_schedule',
      'ตารางฝึกใหม่',
      format('มีการฝึกซ้อม "%s" วันที่ %s เวลา %s', 
        NEW.title,
        TO_CHAR(NEW.session_date, 'DD/MM/YYYY'),
        NEW.start_time
      ),
      format('/dashboard/athlete/schedule/%s', NEW.id),
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new training sessions
DROP TRIGGER IF EXISTS trigger_notify_new_training_session ON training_sessions;
CREATE TRIGGER trigger_notify_new_training_session
  AFTER INSERT ON training_sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_training_session();

-- Function to create notification for new announcement
CREATE OR REPLACE FUNCTION notify_new_announcement()
RETURNS TRIGGER AS $$
DECLARE
  athlete_record RECORD;
BEGIN
  -- Notify all athletes in the club
  FOR athlete_record IN 
    SELECT a.id, a.user_id 
    FROM athletes a 
    WHERE a.club_id = NEW.club_id
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link, announcement_id)
    VALUES (
      athlete_record.user_id,
      'announcement',
      format('ประกาศใหม่: %s', NEW.title),
      NEW.message,
      '/dashboard/athlete/announcements',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new announcements
DROP TRIGGER IF EXISTS trigger_notify_new_announcement ON announcements;
CREATE TRIGGER trigger_notify_new_announcement
  AFTER INSERT ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_announcement();

-- Function to create notification for new performance record
CREATE OR REPLACE FUNCTION notify_new_performance_record()
RETURNS TRIGGER AS $$
DECLARE
  athlete_user_id UUID;
BEGIN
  -- Get athlete's user_id
  SELECT user_id INTO athlete_user_id 
  FROM athletes 
  WHERE id = NEW.athlete_id;
  
  -- Notify the athlete
  INSERT INTO notifications (user_id, type, title, message, link, performance_id)
  VALUES (
    athlete_user_id,
    'test_result',
    'ผลการทดสอบใหม่',
    format('คุณมีผลการทดสอบ "%s" ใหม่: %s %s', 
      NEW.test_type,
      NEW.result_value,
      NEW.result_unit
    ),
    '/dashboard/athlete/performance',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new performance records
DROP TRIGGER IF EXISTS trigger_notify_new_performance_record ON performance_records;
CREATE TRIGGER trigger_notify_new_performance_record
  AFTER INSERT ON performance_records
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_performance_record();

-- Function to create notification for leave request status
CREATE OR REPLACE FUNCTION notify_leave_request_status()
RETURNS TRIGGER AS $$
DECLARE
  athlete_user_id UUID;
  session_name TEXT;
  session_date TEXT;
BEGIN
  -- Only notify on status change to approved or rejected
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    -- Get athlete's user_id
    SELECT user_id INTO athlete_user_id 
    FROM athletes 
    WHERE id = NEW.athlete_id;
    
    -- Get session details
    SELECT 
      ts.title,
      TO_CHAR(ts.session_date, 'DD/MM/YYYY')
    INTO session_name, session_date
    FROM training_sessions ts
    WHERE ts.id = NEW.session_id;
    
    -- Notify the athlete
    INSERT INTO notifications (user_id, type, title, message, link, leave_request_id)
    VALUES (
      athlete_user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'leave_approved'
        ELSE 'leave_rejected'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'คำขอลาได้รับการอนุมัติ'
        ELSE 'คำขอลาถูกปฏิเสธ'
      END,
      format('คำขอลาสำหรับ "%s" วันที่ %s %s', 
        session_name,
        session_date,
        CASE 
          WHEN NEW.status = 'approved' THEN 'ได้รับการอนุมัติแล้ว'
          ELSE 'ถูกปฏิเสธ'
        END
      ),
      format('/dashboard/athlete/schedule/%s', NEW.session_id),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for leave request status changes
DROP TRIGGER IF EXISTS trigger_notify_leave_request_status ON leave_requests;
CREATE TRIGGER trigger_notify_leave_request_status
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_leave_request_status();

-- Function to send reminder notifications (to be called by cron job)
CREATE OR REPLACE FUNCTION send_session_reminders()
RETURNS void AS $$
DECLARE
  session_record RECORD;
  athlete_record RECORD;
BEGIN
  -- Find sessions starting in 1 hour
  FOR session_record IN 
    SELECT ts.id, ts.title as session_name, ts.session_date, ts.start_time, ts.club_id
    FROM training_sessions ts
    WHERE ts.session_date::date = CURRENT_DATE
    AND ts.start_time::time - CURRENT_TIME BETWEEN interval '55 minutes' AND interval '65 minutes'
  LOOP
    -- Notify all athletes in the club who haven't been notified yet
    FOR athlete_record IN 
      SELECT a.id, a.user_id 
      FROM athletes a 
      WHERE a.club_id = session_record.club_id
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = a.user_id
        AND n.session_id = session_record.id
        AND n.type = 'schedule_reminder'
        AND n.created_at > NOW() - interval '2 hours'
      )
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, session_id)
      VALUES (
        athlete_record.user_id,
        'schedule_reminder',
        'เตือนความจำ: การฝึกซ้อมใกล้เข้ามาแล้ว',
        format('"%s" จะเริ่มในอีก 1 ชั่วโมง เวลา %s', 
          session_record.session_name,
          session_record.start_time
        ),
        format('/dashboard/athlete/schedule/%s', session_record.id),
        session_record.id
      );
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION send_session_reminders() IS 'Sends reminder notifications 1 hour before training sessions (should be called by cron job every 5-10 minutes)';
