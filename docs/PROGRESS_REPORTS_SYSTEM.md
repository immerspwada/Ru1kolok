# ระบบรายงานความก้าวหน้า (Progress Reports System)

## ภาพรวม

ระบบรายงานความก้าวหน้าช่วยให้โค้ชสามารถสร้างรายงานความก้าวหน้าของนักกีฬาแต่ละคนได้ โดยรายงานจะรวบรวมข้อมูลจากหลายแหล่ง เช่น การเข้าฝึกซ้อม ผลการทดสอบ และเป้าหมาย

## คุณสมบัติหลัก

### สำหรับโค้ช

1. **สร้างรายงานความก้าวหน้า**
   - เลือกประเภทรายงาน (รายสัปดาห์, รายเดือน, รายไตรมาส, รายปี, กำหนดเอง)
   - กำหนดช่วงเวลา
   - ระบบจะคำนวณข้อมูลอัตโนมัติ:
     - อัตราการเข้าฝึกซ้อม
     - ผลการทดสอบเฉลี่ย
     - ความคืบหน้าของเป้าหมาย
   - เพิ่มจุดเด่นและจุดที่ควรพัฒนา
   - เขียนความคิดเห็นและคำแนะนำ

2. **จัดการรายงาน**
   - บันทึกเป็นแบบร่าง
   - เผยแพร่ให้นักกีฬาดู
   - ดูรายงานทั้งหมดที่สร้าง

3. **กราฟและแผนภูมิ**
   - กราฟแสดงพัฒนาการผลการทดสอบ
   - กราฟแสดงสถิติการเข้าฝึกซ้อม

### สำหรับนักกีฬา

1. **ดูรายงานความก้าวหน้า**
   - ดูรายงานที่โค้ชเผยแพร่แล้ว
   - ดูกราฟและแผนภูมิพัฒนาการ
   - อ่านจุดเด่นและจุดที่ควรพัฒนา
   - อ่านความคิดเห็นจากโค้ช

2. **ดาวน์โหลดรายงาน**
   - ดาวน์โหลดรายงานเป็น PDF (กำลังพัฒนา)

## โครงสร้างฐานข้อมูล

### ตาราง `progress_snapshots`

เก็บข้อมูล snapshot ของความก้าวหน้าในแต่ละช่วงเวลา

```sql
- id: UUID (Primary Key)
- athlete_id: UUID (Foreign Key -> athletes)
- snapshot_date: DATE
- period_type: TEXT (weekly, monthly, quarterly, yearly)
- period_start: DATE
- period_end: DATE

-- Attendance metrics
- total_sessions: INTEGER
- attended_sessions: INTEGER
- attendance_rate: DECIMAL(5,2)
- late_count: INTEGER
- excused_count: INTEGER

-- Performance metrics
- performance_tests_count: INTEGER
- avg_performance_score: DECIMAL(10,2)
- best_performance_score: DECIMAL(10,2)

-- Goal metrics
- active_goals_count: INTEGER
- completed_goals_count: INTEGER
- avg_goal_progress: DECIMAL(5,2)
```

### ตาราง `progress_reports`

เก็บรายงานความก้าวหน้าที่สร้างโดยโค้ช

```sql
- id: UUID (Primary Key)
- athlete_id: UUID (Foreign Key -> athletes)
- generated_by: UUID (Foreign Key -> coaches)
- report_type: TEXT (weekly, monthly, quarterly, yearly, custom)
- period_start: DATE
- period_end: DATE
- title: TEXT
- summary: TEXT
- highlights: JSONB (array of strings)
- areas_for_improvement: JSONB (array of strings)
- coach_comments: TEXT
- metrics: JSONB (calculated metrics)
- charts_data: JSONB (data for charts)
- status: TEXT (draft, published, archived)
- published_at: TIMESTAMPTZ
```

## API Functions

### `calculate_progress_snapshot()`

คำนวณและบันทึก snapshot ของความก้าวหน้า

```typescript
await supabase.rpc('calculate_progress_snapshot', {
  p_athlete_id: 'uuid',
  p_period_start: '2024-01-01',
  p_period_end: '2024-01-31',
  p_period_type: 'monthly'
});
```

### Server Actions

#### `createProgressReport(input)`

สร้างรายงานความก้าวหน้าใหม่

```typescript
const result = await createProgressReport({
  athleteId: 'uuid',
  reportType: 'monthly',
  periodStart: '2024-01-01',
  periodEnd: '2024-01-31',
  title: 'รายงานความก้าวหน้ารายเดือน - มกราคม 2568',
  summary: 'สรุปภาพรวม...',
  highlights: ['จุดเด่น 1', 'จุดเด่น 2'],
  areasForImprovement: ['จุดที่ควรพัฒนา 1'],
  coachComments: 'ความคิดเห็นจากโค้ช...'
});
```

#### `publishProgressReport(reportId)`

เผยแพร่รายงานให้นักกีฬาดู

```typescript
const result = await publishProgressReport('report-uuid');
```

#### `getProgressReports(athleteId, status?)`

ดึงรายงานของนักกีฬา

```typescript
const result = await getProgressReports('athlete-uuid', 'published');
```

#### `getMyProgressReports()`

ดึงรายงานของนักกีฬาที่ล็อกอินอยู่

```typescript
const result = await getMyProgressReports();
```

## หน้าเว็บ

### สำหรับโค้ช

- `/dashboard/coach/athletes/[id]` - หน้ารายละเอียดนักกีฬา (มีปุ่มสร้างรายงาน)
- `/dashboard/coach/progress-reports` - หน้าดูรายงานทั้งหมด

### สำหรับนักกีฬา

- `/dashboard/athlete/progress` - หน้าดูรายงานความก้าวหน้า

## Components

### Coach Components

- `CreateProgressReportDialog` - Dialog สำหรับสร้างรายงาน

### Athlete Components

- `ProgressReportsList` - แสดงรายการรายงาน
- `ProgressReportDetail` - แสดงรายละเอียดรายงาน
- `PerformanceChart` - กราฟแสดงพัฒนาการผลการทดสอบ
- `AttendanceChart` - กราฟแสดงสถิติการเข้าฝึกซ้อม

## RLS Policies

### progress_snapshots

- โค้ชดูและจัดการ snapshots ของนักกีฬาในสโมสรของตน
- นักกีฬาดู snapshots ของตนเอง

### progress_reports

- โค้ชดูและจัดการรายงานของนักกีฬาในสโมสรของตน
- นักกีฬาดูรายงานที่เผยแพร่แล้วของตนเอง (status = 'published')

## การใช้งาน

### สร้างรายงานความก้าวหน้า (โค้ช)

1. ไปที่หน้ารายละเอียดนักกีฬา
2. คลิกปุ่ม "สร้างรายงานความก้าวหน้า"
3. เลือกประเภทรายงานและช่วงเวลา
4. ระบบจะคำนวณข้อมูลอัตโนมัติ
5. เพิ่มจุดเด่น จุดที่ควรพัฒนา และความคิดเห็น
6. เลือก "บันทึกแบบร่าง" หรือ "สร้างและเผยแพร่"

### ดูรายงานความก้าวหน้า (นักกีฬา)

1. ไปที่เมนู "รายงานความก้าวหน้า"
2. คลิกที่รายงานที่ต้องการดู
3. ดูกราฟ สถิติ และความคิดเห็นจากโค้ช
4. (เร็วๆ นี้) ดาวน์โหลดเป็น PDF

## ฟีเจอร์ที่กำลังพัฒนา

- [ ] ดาวน์โหลดรายงานเป็น PDF
- [ ] เปรียบเทียบรายงานหลายช่วงเวลา
- [ ] ส่งการแจ้งเตือนเมื่อมีรายงานใหม่
- [ ] แชร์รายงานกับผู้ปกครอง
- [ ] กราฟเปรียบเทียบกับนักกีฬาคนอื่น (แบบไม่ระบุชื่อ)

## Migration

รันไฟล์ migration:

```bash
cd sports-club-management
./scripts/run-sql-via-api.sh scripts/90-create-progress-reports-system.sql
```

## ตัวอย่างการใช้งาน

### สร้างรายงานรายเดือน

```typescript
const result = await createProgressReport({
  athleteId: 'athlete-123',
  reportType: 'monthly',
  periodStart: '2024-01-01',
  periodEnd: '2024-01-31',
  title: 'รายงานความก้าวหน้ารายเดือน - มกราคม 2568',
  summary: 'นักกีฬามีความก้าวหน้าดีในเดือนนี้ เข้าฝึกสม่ำเสมอและผลการทดสอบดีขึ้น',
  highlights: [
    'เข้าฝึกซ้อม 95% ของเซสชันทั้งหมด',
    'ผลการทดสอบความเร็วดีขึ้น 10%',
    'บรรลุเป้าหมาย 3 จาก 4 เป้าหมาย'
  ],
  areasForImprovement: [
    'ควรฝึกความแข็งแรงของขามากขึ้น',
    'ควรพักผ่อนให้เพียงพอ'
  ],
  coachComments: 'โดยรวมแล้วมีความก้าวหน้าดีมาก ขอให้รักษาฟอร์มนี้ไว้และพัฒนาต่อไป'
});

if (result.success) {
  // เผยแพร่รายงาน
  await publishProgressReport(result.data.id);
}
```

## สรุป

ระบบรายงานความก้าวหน้าช่วยให้โค้ชและนักกีฬาสามารถติดตามพัฒนาการได้อย่างเป็นระบบ ด้วยการรวบรวมข้อมูลจากหลายแหล่งและนำเสนอในรูปแบบที่เข้าใจง่าย พร้อมกราฟและแผนภูมิที่ช่วยให้เห็นภาพรวมความก้าวหน้าได้ชัดเจน
