# ระบบแจ้งเตือนผู้ปกครอง (Parent Notification System)

## ภาพรวม

ระบบที่ช่วยให้ผู้ปกครองติดตามความก้าวหน้าของบุตรหลานได้แบบ Real-time โดยไม่ต้องเข้าสู่ระบบแยก

## คุณสมบัติหลัก

### 1. การเชื่อมต่อบัญชีผู้ปกครอง

**วิธีการเชื่อมต่อ:**
- นักกีฬาเพิ่มอีเมลผู้ปกครองในโปรไฟล์
- ระบบส่งอีเมลยืนยันไปยังผู้ปกครอง
- ผู้ปกครองคลิกลิงก์ยืนยัน
- เชื่อมต่อสำเร็จ

**ข้อมูลที่เก็บ:**
- อีเมลผู้ปกครอง
- ชื่อผู้ปกครอง
- ความสัมพันธ์ (พ่อ, แม่, ผู้ปกครอง)
- สถานะการยืนยัน
- การตั้งค่าการแจ้งเตือน

### 2. การแจ้งเตือนอัตโนมัติ

**ประเภทการแจ้งเตือน:**

#### 2.1 การเข้าฝึก
- ✅ เช็คอินเข้าฝึกสำเร็จ
- ❌ ขาดฝึกโดยไม่แจ้งลา
- 📅 เตือนก่อนเวลาฝึก 2 ชั่วโมง
- 📊 สรุปการเข้าฝึกรายสัปดาห์

#### 2.2 ผลการทดสอบ
- 📈 มีผลการทดสอบใหม่
- 🎯 ผลการทดสอบดีขึ้น
- 📉 ผลการทดสอบลดลง

#### 2.3 การลาฝึก
- 📝 นักกีฬายื่นคำขอลา
- ✅ คำขอลาได้รับอนุมัติ
- ❌ คำขอลาถูกปฏิเสธ

#### 2.4 ประกาศสำคัญ
- 📢 ประกาศเร่งด่วนจากโค้ช
- 🏆 ทัวร์นาเมนต์/การแข่งขัน
- 💰 การชำระเงิน

#### 2.5 เป้าหมาย
- 🎯 โค้ชตั้งเป้าหมายใหม่
- ✅ บรรลุเป้าหมาย
- ⏰ ใกล้ถึงวันเป้าหมาย

### 3. รายงานความก้าวหน้า

**รายงานรายสัปดาห์:**
- จำนวนครั้งเข้าฝึก
- อัตราการเข้าฝึก (%)
- ผลการทดสอบล่าสุด
- ความคิดเห็นจากโค้ช

**รายงานรายเดือน:**
- สรุปการเข้าฝึกทั้งเดือน
- กราฟแสดงความก้าวหน้า
- เป้าหมายที่บรรลุ
- แนวทางพัฒนา

### 4. การตั้งค่าการแจ้งเตือน

**ผู้ปกครองสามารถเลือกได้:**
- แจ้งเตือนทุกครั้ง
- แจ้งเตือนเฉพาะเรื่องสำคัญ
- แจ้งเตือนเฉพาะรายงานสรุป
- ปิดการแจ้งเตือน

**ช่องทางการแจ้งเตือน:**
- อีเมล (หลัก)
- SMS (ถ้ามี)
- LINE Notify (ถ้ามี)

## Database Schema

### ตาราง parent_connections

```sql
CREATE TABLE parent_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Parent information
  parent_email TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- father, mother, guardian
  phone_number TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT UNIQUE,
  verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Notification preferences
  notify_attendance BOOLEAN DEFAULT TRUE,
  notify_performance BOOLEAN DEFAULT TRUE,
  notify_leave_requests BOOLEAN DEFAULT TRUE,
  notify_announcements BOOLEAN DEFAULT TRUE,
  notify_goals BOOLEAN DEFAULT TRUE,
  notification_frequency TEXT DEFAULT 'immediate', -- immediate, daily, weekly
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(athlete_id, parent_email)
);

CREATE INDEX idx_parent_connections_athlete ON parent_connections(athlete_id);
CREATE INDEX idx_parent_connections_email ON parent_connections(parent_email);
CREATE INDEX idx_parent_connections_verified ON parent_connections(is_verified, is_active);
```

### ตาราง parent_notifications

```sql
CREATE TABLE parent_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_connection_id UUID NOT NULL REFERENCES parent_connections(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL, -- attendance, performance, leave, announcement, goal, report
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data
  
  -- Delivery
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivery_status TEXT DEFAULT 'pending', -- pending, sent, failed
  delivery_method TEXT DEFAULT 'email', -- email, sms, line
  error_message TEXT,
  
  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parent_notifications_connection ON parent_notifications(parent_connection_id);
CREATE INDEX idx_parent_notifications_athlete ON parent_notifications(athlete_id);
CREATE INDEX idx_parent_notifications_status ON parent_notifications(delivery_status, sent_at);
CREATE INDEX idx_parent_notifications_type ON parent_notifications(type, sent_at);
```

### ตาराง parent_reports

```sql
CREATE TABLE parent_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_connection_id UUID NOT NULL REFERENCES parent_connections(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  
  -- Report details
  report_type TEXT NOT NULL, -- weekly, monthly, quarterly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Statistics
  total_sessions INTEGER DEFAULT 0,
  attended_sessions INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2),
  absent_sessions INTEGER DEFAULT 0,
  leave_requests INTEGER DEFAULT 0,
  
  -- Performance
  performance_tests INTEGER DEFAULT 0,
  performance_improvements INTEGER DEFAULT 0,
  
  -- Goals
  active_goals INTEGER DEFAULT 0,
  completed_goals INTEGER DEFAULT 0,
  
  -- Coach feedback
  coach_feedback TEXT,
  
  -- Report data (JSON)
  report_data JSONB,
  
  -- Delivery
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parent_reports_connection ON parent_reports(parent_connection_id);
CREATE INDEX idx_parent_reports_athlete ON parent_reports(athlete_id);
CREATE INDEX idx_parent_reports_period ON parent_reports(period_start, period_end);
```

## Triggers สำหรับการแจ้งเตือนอัตโนมัติ

### 1. แจ้งเตือนเมื่อขาดฝึก

```sql
CREATE OR REPLACE FUNCTION notify_parent_absence()
RETURNS TRIGGER AS $$
BEGIN
  -- ถ้าขาดฝึกโดยไม่แจ้งลา
  IF NEW.status = 'absent' THEN
    INSERT INTO parent_notifications (
      parent_connection_id,
      athlete_id,
      type,
      title,
      message,
      data
    )
    SELECT 
      pc.id,
      NEW.athlete_id,
      'attendance',
      'บุตรหลานขาดฝึก',
      'บุตรหลานของคุณขาดการฝึกซ้อมในวันที่ ' || NEW.session_date::TEXT,
      jsonb_build_object(
        'attendance_log_id', NEW.id,
        'session_id', NEW.session_id,
        'session_date', NEW.session_date
      )
    FROM parent_connections pc
    WHERE pc.athlete_id = NEW.athlete_id
      AND pc.is_verified = TRUE
      AND pc.is_active = TRUE
      AND pc.notify_attendance = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_parent_absence
AFTER INSERT OR UPDATE ON attendance_logs
FOR EACH ROW
EXECUTE FUNCTION notify_parent_absence();
```

### 2. แจ้งเตือนผลการทดสอบใหม่

```sql
CREATE OR REPLACE FUNCTION notify_parent_performance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO parent_notifications (
    parent_connection_id,
    athlete_id,
    type,
    title,
    message,
    data
  )
  SELECT 
    pc.id,
    NEW.athlete_id,
    'performance',
    'มีผลการทดสอบใหม่',
    'บุตรหลานของคุณมีผลการทดสอบ ' || NEW.test_type || ' ใหม่',
    jsonb_build_object(
      'performance_id', NEW.id,
      'test_type', NEW.test_type,
      'result_value', NEW.result_value,
      'result_unit', NEW.result_unit,
      'test_date', NEW.test_date
    )
  FROM parent_connections pc
  WHERE pc.athlete_id = NEW.athlete_id
    AND pc.is_verified = TRUE
    AND pc.is_active = TRUE
    AND pc.notify_performance = TRUE;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_parent_performance
AFTER INSERT ON performance_records
FOR EACH ROW
EXECUTE FUNCTION notify_parent_performance();
```

### 3. แจ้งเตือนคำขอลา

```sql
CREATE OR REPLACE FUNCTION notify_parent_leave_request()
RETURNS TRIGGER AS $$
BEGIN
  -- เมื่อยื่นคำขอลา
  IF TG_OP = 'INSERT' THEN
    INSERT INTO parent_notifications (
      parent_connection_id,
      athlete_id,
      type,
      title,
      message,
      data
    )
    SELECT 
      pc.id,
      NEW.athlete_id,
      'leave',
      'บุตรหลานยื่นคำขอลา',
      'บุตรหลานของคุณยื่นคำขอลาฝึกซ้อม เหตุผล: ' || NEW.reason,
      jsonb_build_object(
        'leave_request_id', NEW.id,
        'session_id', NEW.session_id,
        'reason', NEW.reason,
        'status', NEW.status
      )
    FROM parent_connections pc
    WHERE pc.athlete_id = NEW.athlete_id
      AND pc.is_verified = TRUE
      AND pc.is_active = TRUE
      AND pc.notify_leave_requests = TRUE;
  
  -- เมื่ออนุมัติ/ปฏิเสธ
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO parent_notifications (
      parent_connection_id,
      athlete_id,
      type,
      title,
      message,
      data
    )
    SELECT 
      pc.id,
      NEW.athlete_id,
      'leave',
      CASE 
        WHEN NEW.status = 'approved' THEN 'คำขอลาได้รับอนุมัติ'
        WHEN NEW.status = 'rejected' THEN 'คำขอลาถูกปฏิเสธ'
        ELSE 'สถานะคำขอลาเปลี่ยนแปลง'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'คำขอลาของบุตรหลานได้รับอนุมัติแล้ว'
        WHEN NEW.status = 'rejected' THEN 'คำขอลาของบุตรหลานถูกปฏิเสธ'
        ELSE 'สถานะคำขอลาเปลี่ยนเป็น ' || NEW.status
      END,
      jsonb_build_object(
        'leave_request_id', NEW.id,
        'session_id', NEW.session_id,
        'status', NEW.status,
        'review_notes', NEW.review_notes
      )
    FROM parent_connections pc
    WHERE pc.athlete_id = NEW.athlete_id
      AND pc.is_verified = TRUE
      AND pc.is_active = TRUE
      AND pc.notify_leave_requests = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_parent_leave_request
AFTER INSERT OR UPDATE ON leave_requests
FOR EACH ROW
EXECUTE FUNCTION notify_parent_leave_request();
```

## RLS Policies

```sql
-- parent_connections
ALTER TABLE parent_connections ENABLE ROW LEVEL SECURITY;

-- นักกีฬาเห็นเฉพาะของตัวเอง
CREATE POLICY "Athletes can view their parent connections"
ON parent_connections FOR SELECT
TO authenticated
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

-- นักกีฬาสามารถเพิ่มผู้ปกครอง
CREATE POLICY "Athletes can add parent connections"
ON parent_connections FOR INSERT
TO authenticated
WITH CHECK (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

-- นักกีฬาสามารถอัพเดทของตัวเอง
CREATE POLICY "Athletes can update their parent connections"
ON parent_connections FOR UPDATE
TO authenticated
USING (
  athlete_id IN (
    SELECT id FROM athletes WHERE user_id = auth.uid()
  )
);

-- โค้ชเห็นผู้ปกครองของนักกีฬาในสโมสร
CREATE POLICY "Coaches can view parent connections in their club"
ON parent_connections FOR SELECT
TO authenticated
USING (
  athlete_id IN (
    SELECT a.id FROM athletes a
    JOIN coaches c ON c.club_id = a.club_id
    WHERE c.user_id = auth.uid()
  )
);

-- Admin เห็นทั้งหมด
CREATE POLICY "Admins can view all parent connections"
ON parent_connections FOR ALL
TO authenticated
USING (is_admin(auth.uid()));
```

## API Actions

### lib/parent/actions.ts

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// เพิ่มผู้ปกครอง
export async function addParentConnection(input: {
  parentEmail: string;
  parentName: string;
  relationship: 'father' | 'mother' | 'guardian';
  phoneNumber?: string;
}) {
  const supabase = await createClient();
  
  // Get athlete profile
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้');
  
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (!athlete) throw new Error('ไม่พบข้อมูลนักกีฬา');
  
  // Generate verification token
  const verificationToken = crypto.randomUUID();
  
  // Insert parent connection
  const { data, error } = await supabase
    .from('parent_connections')
    .insert({
      athlete_id: athlete.id,
      parent_email: input.parentEmail,
      parent_name: input.parentName,
      relationship: input.relationship,
      phone_number: input.phoneNumber,
      verification_token: verificationToken,
      verification_sent_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // TODO: Send verification email
  // await sendVerificationEmail(input.parentEmail, verificationToken);
  
  revalidatePath('/dashboard/athlete/profile');
  return { success: true, data };
}

// ยืนยันอีเมลผู้ปกครอง
export async function verifyParentConnection(token: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('parent_connections')
    .update({
      is_verified: true,
      verified_at: new Date().toISOString(),
    })
    .eq('verification_token', token)
    .select()
    .single();
  
  if (error) throw error;
  
  return { success: true, data };
}

// ดึงรายการผู้ปกครอง
export async function getParentConnections() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้');
  
  const { data: athlete } = await supabase
    .from('athletes')
    .select('id')
    .eq('user_id', user.id)
    .single();
  
  if (!athlete) throw new Error('ไม่พบข้อมูลนักกีฬา');
  
  const { data, error } = await supabase
    .from('parent_connections')
    .select('*')
    .eq('athlete_id', athlete.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  return data;
}

// อัพเดทการตั้งค่าการแจ้งเตือน
export async function updateNotificationPreferences(
  connectionId: string,
  preferences: {
    notify_attendance?: boolean;
    notify_performance?: boolean;
    notify_leave_requests?: boolean;
    notify_announcements?: boolean;
    notify_goals?: boolean;
    notification_frequency?: 'immediate' | 'daily' | 'weekly';
  }
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('parent_connections')
    .update(preferences)
    .eq('id', connectionId)
    .select()
    .single();
  
  if (error) throw error;
  
  revalidatePath('/dashboard/athlete/profile');
  return { success: true, data };
}

// ลบผู้ปกครอง
export async function removeParentConnection(connectionId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('parent_connections')
    .delete()
    .eq('id', connectionId);
  
  if (error) throw error;
  
  revalidatePath('/dashboard/athlete/profile');
  return { success: true };
}
```

## UI Components

### 1. ParentConnectionForm
- ฟอร์มเพิ่มผู้ปกครอง
- Validation อีเมลและเบอร์โทร
- แสดงสถานะการส่งอีเมลยืนยัน

### 2. ParentConnectionList
- แสดงรายการผู้ปกครอง
- แสดงสถานะการยืนยัน
- ปุ่มส่งอีเมลยืนยันใหม่
- ปุ่มแก้ไขการตั้งค่า
- ปุ่มลบ

### 3. NotificationPreferencesDialog
- ตั้งค่าประเภทการแจ้งเตือน
- เลือกความถี่การแจ้งเตือน
- บันทึกการตั้งค่า

## การทำงานของระบบ

### Flow การเชื่อมต่อ

1. นักกีฬาเข้าหน้าโปรไฟล์
2. คลิก "เพิ่มผู้ปกครอง"
3. กรอกข้อมูล (อีเมล, ชื่อ, ความสัมพันธ์)
4. ระบบส่งอีเมลยืนยันไปยังผู้ปกครอง
5. ผู้ปกครองคลิกลิงก์ในอีเมล
6. ระบบยืนยันและเริ่มส่งการแจ้งเตือน

### Flow การแจ้งเตือน

1. เหตุการณ์เกิดขึ้น (เช่น ขาดฝึก)
2. Trigger ทำงานอัตโนมัติ
3. ตรวจสอบการตั้งค่าของผู้ปกครอง
4. สร้างการแจ้งเตือนในตาราง parent_notifications
5. Background job ส่งอีเมล
6. บันทึกสถานะการส่ง

## การติดตั้ง

```bash
# รัน migration
cd sports-club-management
./scripts/run-sql-via-api.sh scripts/91-create-parent-notification-system.sql
```

## การทดสอบ

### 1. ทดสอบการเชื่อมต่อ
```sql
-- เพิ่มผู้ปกครองทดสอบ
INSERT INTO parent_connections (athlete_id, parent_email, parent_name, relationship, is_verified)
VALUES ('athlete-id', 'parent@example.com', 'คุณพ่อทดสอบ', 'father', TRUE);
```

### 2. ทดสอบการแจ้งเตือน
```sql
-- สร้างการขาดฝึก
INSERT INTO attendance_logs (athlete_id, session_id, session_date, status)
VALUES ('athlete-id', 'session-id', CURRENT_DATE, 'absent');

-- ตรวจสอบการแจ้งเตือน
SELECT * FROM parent_notifications 
WHERE athlete_id = 'athlete-id' 
ORDER BY created_at DESC;
```

## Future Enhancements

- [ ] LINE Notify integration
- [ ] SMS notifications
- [ ] Mobile app สำหรับผู้ปกครอง
- [ ] Dashboard สำหรับผู้ปกครอง
- [ ] การแชทกับโค้ช
- [ ] การชำระเงินออนไลน์
- [ ] รายงานแบบ PDF
- [ ] กราฟแสดงความก้าวหน้า

## สรุป

ระบบนี้ช่วยให้ผู้ปกครองมีส่วนร่วมในการพัฒนาของบุตรหลาน สร้างความโปร่งใส และเพิ่มความไว้วางใจระหว่างสโมสร-นักกีฬา-ผู้ปกครอง
