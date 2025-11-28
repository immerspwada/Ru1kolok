# การปรับปรุงหน้า Coach Announcements

## สรุปการพัฒนา

ปรับปรุงหน้า `/dashboard/coach/announcements` ให้มีฟีเจอร์ที่ครบถ้วนและใช้งานง่ายขึ้น

## ฟีเจอร์ใหม่

### 1. แก้ไขประกาศ (Edit Announcement)
- เพิ่ม `EditAnnouncementDialog` component
- แก้ไขหัวข้อ, รายละเอียด, ระดับความสำคัญ, และสถานะปักหมุด
- Validation และ sanitization ครบถ้วน
- Real-time update หลังแก้ไข

### 2. สถิติการอ่าน (Read Statistics)
- แสดงจำนวนนักกีฬาที่อ่านแล้ว / ทั้งหมด
- Progress bar แสดงเปอร์เซ็นต์การอ่าน
- ใช้ตาราง `announcement_reads` เพื่อติดตามการอ่าน
- แสดงสถิติแบบ real-time

### 3. ค้นหาและฟิลเตอร์ (Search & Filter)
- ค้นหาประกาศจากหัวข้อและรายละเอียด
- ฟิลเตอร์ตามระดับความสำคัญ:
  - ทั้งหมด
  - เร่งด่วน (Urgent)
  - สำคัญ (High)
  - ปกติ (Normal)
- แสดงจำนวนประกาศในแต่ละหมวด
- แสดงผลลัพธ์การค้นหา

### 4. Toggle Pin (ปักหมุด/ยกเลิก)
- ปักหมุดประกาศได้ง่ายจาก dropdown menu
- ยกเลิกปักหมุดได้ทันที
- ประกาศที่ปักหมุดจะแสดงด้านบนเสมอ

### 5. สถิติสรุป (Summary Stats)
- แสดงจำนวนประกาศทั้งหมด
- แสดงจำนวนประกาศที่ปักหมุด
- แสดงจำนวนนักกีฬาในสโมสร

### 6. UI/UX ที่ดีขึ้น
- การ์ดประกาศที่สวยงามและอ่านง่าย
- สีแยกตามระดับความสำคัญ
- Icon และ visual feedback ที่ชัดเจน
- Loading states และ error handling
- Responsive design

## ไฟล์ที่สร้าง/แก้ไข

### ไฟล์ใหม่
- `components/coach/EditAnnouncementDialog.tsx` - Dialog สำหรับแก้ไขประกาศ

### ไฟล์ที่แก้ไข
- `app/dashboard/coach/announcements/page.tsx` - เพิ่มสถิติและ read counts
- `components/coach/AnnouncementList.tsx` - เพิ่มค้นหา, ฟิลเตอร์, และสถิติการอ่าน
- `lib/coach/announcement-actions.ts` - ปรับปรุง updateAnnouncement action

### Database Migration
- `scripts/55-drop-and-create-announcements.sql` - สร้างตาราง announcements และ announcement_reads

## การใช้งาน

### สำหรับโค้ช

1. **ดูประกาศทั้งหมด**
   - เข้าหน้า `/dashboard/coach/announcements`
   - ดูสถิติสรุปด้านบน

2. **สร้างประกาศใหม่**
   - คลิกปุ่ม "สร้างประกาศ"
   - กรอกหัวข้อและรายละเอียด
   - เลือกระดับความสำคัญ
   - เลือกปักหมุดหรือไม่

3. **ค้นหาประกาศ**
   - พิมพ์คำค้นหาในช่องค้นหา
   - หรือคลิกฟิลเตอร์ตามระดับความสำคัญ

4. **แก้ไขประกาศ**
   - คลิกเมนู (⋮) ที่มุมขวาบนของการ์ด
   - เลือก "แก้ไข"
   - แก้ไขข้อมูลและบันทึก

5. **ปักหมุด/ยกเลิกปักหมุด**
   - คลิกเมนู (⋮)
   - เลือก "ปักหมุด" หรือ "ยกเลิกปักหมุด"

6. **ลบประกาศ**
   - คลิกเมนู (⋮)
   - เลือก "ลบประกาศ"
   - ยืนยันการลบ

7. **ดูสถิติการอ่าน**
   - ดูที่ด้านล่างของแต่ละการ์ด
   - แสดงจำนวนคนที่อ่านและเปอร์เซ็นต์

## Technical Details

### Database Schema

```sql
-- announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY,
  coach_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ...
);

-- announcement_reads table
CREATE TABLE public.announcement_reads (
  id UUID PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES announcements(id),
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);
```

### RLS Policies

- โค้ชสามารถ CRUD ประกาศของตัวเองได้
- โค้ชสามารถดูสถิติการอ่านของประกาศตัวเองได้
- นักกีฬาสามารถดูประกาศจากโค้ชในสโมสรของตัวเองได้
- นักกีฬาสามารถบันทึกการอ่านของตัวเองได้

### API Actions

```typescript
// Create announcement
createAnnouncement(input: CreateAnnouncementInput)

// Update announcement
updateAnnouncement(input: UpdateAnnouncementInput)

// Delete announcement
deleteAnnouncement(id: string)

// Mark as read (for athletes)
markAnnouncementAsRead(announcementId: string)
```

## การทดสอบ

### Manual Testing Checklist

- [ ] สร้างประกาศใหม่
- [ ] แก้ไขประกาศ
- [ ] ลบประกาศ
- [ ] ปักหมุดประกาศ
- [ ] ยกเลิกปักหมุด
- [ ] ค้นหาประกาศ
- [ ] ฟิลเตอร์ตามระดับความสำคัญ
- [ ] ดูสถิติการอ่าน
- [ ] ตรวจสอบ RLS policies
- [ ] ทดสอบ validation
- [ ] ทดสอบ error handling

## ปัญหาที่แก้ไข

1. ไม่สามารถแก้ไขประกาศได้ → เพิ่ม EditAnnouncementDialog
2. ไม่รู้ว่านักกีฬาอ่านแล้วหรือยัง → เพิ่มสถิติการอ่าน
3. หาประกาศยาก → เพิ่มค้นหาและฟิลเตอร์
4. ปักหมุดยุ่งยาก → เพิ่ม toggle pin ใน menu
5. UI ไม่สวย → ปรับปรุง design ทั้งหมด

## Next Steps

1. เพิ่มการแจ้งเตือนแบบ push notification
2. เพิ่มการกำหนดกลุ่มเป้าหมาย (specific athletes)
3. เพิ่มการตั้งเวลาส่งประกาศ (scheduled announcements)
4. เพิ่มการแนบไฟล์/รูปภาพ
5. เพิ่ม analytics dashboard สำหรับประกาศ
