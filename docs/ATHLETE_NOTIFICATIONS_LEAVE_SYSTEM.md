# ระบบแจ้งเตือนและการลาสำหรับนักกีฬา

## ภาพรวม

เอกสารนี้อธิบายระบบแจ้งเตือนแบบ Push Notifications และระบบการลาที่ได้รับการปรับปรุงสำหรับนักกีฬา

## 1. ระบบแจ้งเตือน (Push Notifications)

### คุณสมบัติ

#### 1.1 ประเภทการแจ้งเตือน

- **ตารางฝึกใหม่** (`new_schedule`) - แจ้งเตือนเมื่อโค้ชสร้างตารางฝึกใหม่
- **เตือนก่อนฝึก** (`schedule_reminder`) - แจ้งเตือน 1 ชั่วโมงก่อนเวลาฝึก
- **ประกาศสำคัญ** (`announcement`) - แจ้งเตือนเมื่อมีประกาศใหม่จากโค้ช
- **ผลการทดสอบ** (`test_result`) - แจ้งเตือนเมื่อมีผลการทดสอบใหม่
- **คำขอลาอนุมัติ** (`leave_approved`) - แจ้งเตือนเมื่อคำขอลาได้รับการอนุมัติ
- **คำขอลาปฏิเสธ** (`leave_rejected`) - แจ้งเตือนเมื่อคำขอลาถูกปฏิเสธ

#### 1.2 การทำงานอัตโนมัติ

การแจ้งเตือนจะถูกสร้างอัตโนมัติผ่าน Database Triggers:

- เมื่อโค้ชสร้างตารางฝึกใหม่ → แจ้งนักกีฬาทุกคนในสโมสร
- เมื่อโค้ชสร้างประกาศใหม่ → แจ้งนักกีฬาทุกคนในสโมสร
- เมื่อโค้ชบันทึกผลการทดสอบ → แจ้งนักกีฬาที่เกี่ยวข้อง
- เมื่อโค้ชอนุมัติ/ปฏิเสธคำขอลา → แจ้งนักกีฬาที่ยื่นคำขอ

#### 1.3 การเตือนก่อนเวลาฝึก 1 ชั่วโมง

ใช้ฟังก์ชัน `send_session_reminders()` ที่ควรถูกเรียกโดย Cron Job ทุก 5-10 นาที:

```sql
SELECT send_session_reminders();
```

**การตั้งค่า Cron Job (ตัวอย่าง):**

```bash
# ใน Supabase Dashboard > Database > Cron Jobs
# หรือใช้ pg_cron extension

SELECT cron.schedule(
  'session-reminders',
  '*/5 * * * *',  -- ทุก 5 นาที
  $$SELECT send_session_reminders()$$
);
```

### หน้าจอและ Components

#### NotificationBell Component
- แสดงไอคอนกระดิ่งพร้อม badge จำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
- อัพเดทอัตโนมัติทุก 30 วินาที
- ใช้ใน: Header ของหน้า Athlete Dashboard

#### NotificationList Component
- แสดงรายการการแจ้งเตือนทั้งหมด
- แยกสีตามประเภทและความสำคัญ
- ปุ่ม "อ่านทั้งหมด" และ "ลบ"
- ลิงก์ไปยังหน้ารายละเอียด

#### หน้า /dashboard/athlete/notifications
- แสดงการแจ้งเตือนทั้งหมดของนักกีฬา
- เรียงตามเวลาล่าสุด
- สามารถทำเครื่องหมายว่าอ่านแล้วและลบได้

### Database Schema

```sql
-- ตาราง notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional references
  session_id UUID,
  announcement_id UUID,
  performance_id UUID,
  leave_request_id UUID
);
```

### API Actions

```typescript
// lib/notifications/actions.ts

// ดึงการแจ้งเตือนทั้งหมด
getNotifications(limit?: number)

// นับจำนวนที่ยังไม่ได้อ่าน
getUnreadCount()

// ทำเครื่องหมายว่าอ่านแล้ว
markAsRead(notificationId: string)

// ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
markAllAsRead()

// ลบการแจ้งเตือน
deleteNotification(notificationId: string)
```

## 2. ระบบลาฝึก (Leave Request System) - ปรับปรุง

### การปรับปรุงใหม่

#### 2.1 ฟิลด์เพิ่มเติม

- **review_notes** - ความเห็นจากโค้ชเมื่ออนุมัติ/ปฏิเสธ
- **updated_at** - เวลาที่อัพเดทล่าสุด (อัตโนมัติ)

#### 2.2 View สำหรับประวัติ

```sql
-- leave_request_history view
-- รวมข้อมูลนักกีฬา, ตารางฝึก, และโค้ชที่พิจารณา
SELECT * FROM leave_request_history 
WHERE athlete_id = 'xxx'
ORDER BY requested_at DESC;
```

#### 2.3 UI ที่ปรับปรุง

**LeaveRequestForm Component:**
- แสดงสถานะเวลา (สามารถลาได้หรือไม่)
- นับตัวอักษรแบบ Real-time
- Validation ที่ชัดเจน
- Dialog ยืนยันก่อนส่ง

**LeaveRequestHistory Component:**
- แสดงประวัติการลาทั้งหมด
- Filter ตามสถานะ (ทั้งหมด, รอพิจารณา, อนุมัติ, ปฏิเสธ)
- แสดงความเห็นจากโค้ช
- แสดงข้อมูลผู้พิจารณาและเวลา

#### 2.4 หน้าประวัติการลา

**หน้า /dashboard/athlete/leave-history:**
- แสดงประวัติการลาทั้งหมด
- Filter แบบ Tab
- แสดงรายละเอียดครบถ้วน

### กฎการลา

1. **ต้องแจ้งล่วงหน้าอย่างน้อย 2 ชั่วโมง** ก่อนเวลาเริ่มฝึก
2. **เหตุผลต้องมีอย่างน้อย 10 ตัวอักษร**
3. **ไม่สามารถลาซ้ำ** สำหรับตารางฝึกเดียวกัน
4. **สามารถแก้ไขได้** เฉพาะคำขอที่ยังรอพิจารณา

### การแจ้งเตือนอัตโนมัติ

เมื่อโค้ชอนุมัติหรือปฏิเสธคำขอลา:
- นักกีฬาจะได้รับการแจ้งเตือนทันที
- แสดงสถานะและความเห็นจากโค้ช (ถ้ามี)
- มีลิงก์ไปยังตารางฝึกที่เกี่ยวข้อง

## 3. การติดตั้งและการใช้งาน

### 3.1 Database Migrations

```bash
# ติดตั้งระบบแจ้งเตือน
./scripts/run-sql-via-api.sh scripts/70-fix-notifications.sql
./scripts/run-sql-via-api.sh scripts/70-notification-triggers.sql

# ปรับปรุงระบบลา
./scripts/run-sql-via-api.sh scripts/71-enhance-leave-requests.sql
```

### 3.2 ตั้งค่า Cron Job สำหรับการเตือน

ใน Supabase Dashboard:
1. ไปที่ Database > Extensions
2. เปิดใช้งาน `pg_cron`
3. สร้าง Cron Job:

```sql
SELECT cron.schedule(
  'session-reminders',
  '*/5 * * * *',
  $$SELECT send_session_reminders()$$
);
```

### 3.3 เพิ่ม NotificationBell ใน Layout

```tsx
// app/dashboard/athlete/layout.tsx
import { NotificationBell } from '@/components/athlete/NotificationBell';

// เพิ่มใน header
<NotificationBell />
```

## 4. การทดสอบ

### 4.1 ทดสอบการแจ้งเตือน

```sql
-- สร้างตารางฝึกใหม่ (ควรแจ้งนักกีฬาทุกคน)
INSERT INTO training_sessions (club_id, title, session_date, start_time, coach_id)
VALUES ('club-id', 'ทดสอบการแจ้งเตือน', CURRENT_DATE + 1, '10:00', 'coach-id');

-- ตรวจสอบการแจ้งเตือน
SELECT * FROM notifications WHERE type = 'new_schedule' ORDER BY created_at DESC LIMIT 5;
```

### 4.2 ทดสอบการเตือนก่อนฝึก

```sql
-- เรียกฟังก์ชันด้วยตนเอง
SELECT send_session_reminders();

-- ตรวจสอบ
SELECT * FROM notifications WHERE type = 'schedule_reminder' ORDER BY created_at DESC;
```

### 4.3 ทดสอบการลา

1. ไปที่หน้าตารางฝึก
2. คลิก "แจ้งลา" ในตารางที่ต้องการ
3. กรอกเหตุผล (อย่างน้อย 10 ตัวอักษร)
4. ส่งคำขอ
5. ตรวจสอบใน /dashboard/athlete/leave-history

## 5. Performance และ Optimization

### Indexes

```sql
-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Leave Requests
CREATE INDEX idx_leave_requests_athlete_created ON leave_requests(athlete_id, created_at DESC);
CREATE INDEX idx_leave_requests_status_created ON leave_requests(status, created_at DESC);
```

### Polling Interval

- NotificationBell: อัพเดททุก 30 วินาที
- สามารถปรับได้ตามความต้องการ

## 6. การบำรุงรักษา

### ลบการแจ้งเตือนเก่า

```sql
-- ลบการแจ้งเตือนที่อ่านแล้วและเก่ากว่า 30 วัน
DELETE FROM notifications 
WHERE read = TRUE 
AND created_at < NOW() - INTERVAL '30 days';
```

### ตรวจสอบ Cron Job

```sql
-- ดู Cron Jobs ทั้งหมด
SELECT * FROM cron.job;

-- ดูประวัติการทำงาน
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'session-reminders')
ORDER BY start_time DESC 
LIMIT 10;
```

## 7. Troubleshooting

### การแจ้งเตือนไม่ทำงาน

1. ตรวจสอบ Triggers:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
```

2. ตรวจสอบ RLS Policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### การเตือนก่อนฝึกไม่ทำงาน

1. ตรวจสอบ Cron Job:
```sql
SELECT * FROM cron.job WHERE jobname = 'session-reminders';
```

2. ทดสอบฟังก์ชันด้วยตนเอง:
```sql
SELECT send_session_reminders();
```

## 8. Future Enhancements

- [ ] Push Notifications แบบ Real-time (WebSocket/SSE)
- [ ] Email Notifications
- [ ] SMS Notifications
- [ ] การตั้งค่าการแจ้งเตือนส่วนบุคคล
- [ ] การจัดกลุ่มการแจ้งเตือน
- [ ] Rich Notifications (รูปภาพ, ปุ่มดำเนินการ)
