# Home Training Check-in System (ระบบเช็คอินที่บ้าน)

## Overview

ระบบที่ช่วยให้นักกีฬาสามารถบันทึกการฝึกเสริมที่บ้าน อัพโหลดวิดีโอการฝึก และรับ feedback จากโค้ช

## Features

### สำหรับนักกีฬา (Athletes)

1. **บันทึกการฝึกที่บ้าน**
   - เลือกประเภทการฝึก (ความแข็งแรง, ความอดทน, ฝึกทักษะ, ความยืดหยุ่น)
   - บันทึกชื่อท่าฝึก, ระยะเวลา, จำนวนเซ็ต/ครั้ง
   - เพิ่มหมายเหตุเพิ่มเติม
   - อัพโหลดวิดีโอการฝึก (ไม่บังคับ)

2. **ดูสถิติการฝึก**
   - จำนวนครั้งทั้งหมด
   - เวลารวมที่ฝึก
   - จำนวนที่ได้รับการอนุมัติ
   - จำนวนที่รอตรวจสอบ

3. **ดูประวัติและ Feedback**
   - ดูประวัติการฝึกทั้งหมด
   - ดู feedback จากโค้ช
   - ลบการบันทึกที่ยังรอตรวจสอบ

### สำหรับโค้ช (Coaches)

1. **ตรวจสอบการฝึกของนักกีฬา**
   - ดูรายการการฝึกทั้งหมดในสโมสร
   - กรองตามสถานะ (รอตรวจสอบ, ตรวจสอบแล้ว, อนุมัติ, ต้องปรับปรุง)
   - ดูวิดีโอการฝึก

2. **ให้ Feedback**
   - ให้คะแนน 1-5 ดาว
   - เขียน feedback รายละเอียด
   - แนะนำสิ่งที่ควรปรับปรุง
   - อนุมัติหรือขอให้ปรับปรุง

3. **Quick Review**
   - อนุมัติด่วน
   - ขอให้ปรับปรุงด่วน

## Database Schema

### Tables

#### `home_training_logs`
- `id` - UUID primary key
- `athlete_id` - UUID (references profiles)
- `club_id` - UUID (references clubs)
- `training_date` - DATE
- `training_type` - VARCHAR(100)
- `duration_minutes` - INTEGER
- `exercise_name` - VARCHAR(200)
- `sets` - INTEGER (nullable)
- `reps` - INTEGER (nullable)
- `notes` - TEXT (nullable)
- `video_url` - TEXT (nullable)
- `video_duration_seconds` - INTEGER (nullable)
- `status` - VARCHAR(20) (pending, reviewed, approved, needs_improvement)
- `reviewed_at` - TIMESTAMPTZ (nullable)
- `reviewed_by` - UUID (nullable, references profiles)
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

#### `home_training_feedback`
- `id` - UUID primary key
- `training_log_id` - UUID (references home_training_logs)
- `coach_id` - UUID (references profiles)
- `feedback_text` - TEXT
- `rating` - INTEGER (1-5)
- `improvement_areas` - TEXT[] (nullable)
- `next_steps` - TEXT (nullable)
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

### Storage Bucket

**Bucket Name:** `home-training-videos`
- **Access:** Private
- **File Size Limit:** 100MB
- **Allowed Types:** MP4, MOV, AVI, WebM

**Folder Structure:**
```
home-training-videos/
  {athlete_user_id}/
    {timestamp}.mp4
```

## RLS Policies

### home_training_logs

**Athletes:**
- ✅ View own training logs
- ✅ Create own training logs
- ✅ Update own pending logs
- ✅ Delete own pending logs

**Coaches:**
- ✅ View all training logs in their club
- ✅ Update training logs (review status)

**Admins:**
- ✅ Full access

### home_training_feedback

**Athletes:**
- ✅ View feedback on their training logs

**Coaches:**
- ✅ View own feedback
- ✅ Create feedback for club training logs
- ✅ Update own feedback
- ✅ Delete own feedback

**Admins:**
- ✅ Full access

### Storage (home-training-videos)

**Athletes:**
- ✅ Upload to own folder
- ✅ View own videos
- ✅ Delete own videos

**Coaches:**
- ✅ View videos from club athletes

**Admins:**
- ✅ Full access

## API Functions

### Athlete Actions (`lib/athlete/home-training-actions.ts`)

- `createHomeTrainingLog(input)` - บันทึกการฝึกใหม่
- `getMyHomeTrainingLogs()` - ดึงประวัติการฝึกของตัวเอง
- `getHomeTrainingLogById(logId)` - ดึงข้อมูลการฝึกเฉพาะ
- `updateHomeTrainingLog(logId, updates)` - แก้ไขการฝึก
- `deleteHomeTrainingLog(logId)` - ลบการฝึก
- `getHomeTrainingFeedback(logId)` - ดึง feedback
- `getHomeTrainingStats(days)` - ดึงสถิติการฝึก
- `uploadHomeTrainingVideo(file)` - อัพโหลดวิดีโอ
- `deleteHomeTrainingVideo(path)` - ลบวิดีโอ

### Coach Actions (`lib/coach/home-training-actions.ts`)

- `getPendingHomeTrainingReviews()` - ดึงรายการรอตรวจสอบ
- `getClubHomeTrainingLogs(filters)` - ดึงการฝึกทั้งหมดในสโมสร
- `reviewHomeTrainingLog(logId, status)` - อัพเดทสถานะ
- `createHomeTrainingFeedback(input)` - สร้าง feedback
- `updateHomeTrainingFeedback(feedbackId, updates)` - แก้ไข feedback
- `deleteHomeTrainingFeedback(feedbackId)` - ลบ feedback
- `getAthleteHomeTrainingHistory(athleteId, days)` - ดึงประวัติของนักกีฬา

## Helper Functions (SQL)

### `get_athlete_home_training_stats(p_athlete_id, p_start_date, p_end_date)`
คำนวณสถิติการฝึกของนักกีฬา:
- จำนวนครั้งทั้งหมด
- เวลารวม
- เวลาเฉลี่ย
- แยกตามประเภท
- จำนวนรอตรวจสอบ
- จำนวนที่อนุมัติ

### `get_coach_pending_home_training_reviews(p_coach_id)`
ดึงรายการการฝึกที่รอตรวจสอบสำหรับโค้ช

## Pages

### Athlete Pages
- `/dashboard/athlete/home-training` - หน้าหลักการฝึกที่บ้าน

### Coach Pages
- `/dashboard/coach/home-training` - หน้าตรวจสอบการฝึก

## Components

### Athlete Components
- `HomeTrainingStats` - แสดงสถิติการฝึก
- `HomeTrainingList` - รายการประวัติการฝึก
- `CreateHomeTrainingDialog` - ฟอร์มบันทึกการฝึก

### Coach Components
- `CoachHomeTrainingList` - รายการการฝึกทั้งหมด
- `GiveFeedbackDialog` - ฟอร์มให้ feedback

## Usage Examples

### บันทึกการฝึกที่บ้าน (Athlete)

```typescript
const result = await createHomeTrainingLog({
  training_date: '2024-01-15',
  training_type: 'strength',
  duration_minutes: 45,
  exercise_name: 'ดันพื้น',
  sets: 3,
  reps: 20,
  notes: 'รู้สึกแข็งแรงขึ้น',
  video_url: 'https://...',
});
```

### ให้ Feedback (Coach)

```typescript
const result = await createHomeTrainingFeedback({
  training_log_id: 'xxx-xxx-xxx',
  feedback_text: 'ท่าดีมาก แต่ควรเพิ่มความเร็วในการทำ',
  rating: 4,
  next_steps: 'ลองเพิ่มน้ำหนักในครั้งต่อไป',
});
```

## Migration Scripts

- `scripts/100-create-home-training-system.sql` - สร้างตารางและ RLS policies
- `scripts/101-create-home-training-storage.sql` - สร้าง storage bucket และ policies

## Testing

### Manual Testing Checklist

**Athlete:**
- [ ] บันทึกการฝึกใหม่ (ไม่มีวิดีโอ)
- [ ] บันทึกการฝึกพร้อมวิดีโอ
- [ ] ดูสถิติการฝึก
- [ ] แก้ไขการฝึกที่รอตรวจสอบ
- [ ] ลบการฝึกที่รอตรวจสอบ
- [ ] ดู feedback จากโค้ช

**Coach:**
- [ ] ดูรายการการฝึกทั้งหมด
- [ ] กรองตามสถานะ
- [ ] ดูวิดีโอการฝึก
- [ ] อนุมัติด่วน
- [ ] ขอให้ปรับปรุงด่วน
- [ ] ให้ feedback พร้อมคะแนน

## Future Enhancements

1. **Push Notifications**
   - แจ้งเตือนเมื่อโค้ชให้ feedback
   - แจ้งเตือนโค้ชเมื่อมีการฝึกใหม่

2. **Analytics Dashboard**
   - กราฟแสดงความถี่ในการฝึก
   - เปรียบเทียบกับนักกีฬาคนอื่น
   - แนวโน้มการพัฒนา

3. **Training Programs**
   - โค้ชสร้างโปรแกรมฝึกเสริม
   - นักกีฬาติดตามโปรแกรม

4. **Video Analysis**
   - เครื่องมือวิเคราะห์วิดีโอ
   - วาดเส้นบนวิดีโอ
   - เปรียบเทียบวิดีโอ

5. **Gamification**
   - แต้มสะสมจากการฝึก
   - ระดับและความสำเร็จ
   - ลีดเดอร์บอร์ด
