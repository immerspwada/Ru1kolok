# AttendanceHistory Component

Component for displaying athlete's attendance history with session details, status badges, and date filtering.

## Features

- ✅ Display all attendance records with session details
- ✅ Color-coded status badges (present, late, excused, absent)
- ✅ Show session information (date, time, location, type)
- ✅ Date range filtering
- ✅ Check-in time display
- ✅ Notes display
- ✅ Empty state handling
- ✅ Mobile responsive

## Usage

```tsx
import AttendanceHistory from '@/components/athlete/AttendanceHistory';
import { getMyAttendance } from '@/lib/athlete/attendance-actions';

export default async function AttendancePage() {
  const { data: records } = await getMyAttendance();

  return (
    <div>
      <AttendanceHistory records={records || []} />
    </div>
  );
}
```

## Props

```typescript
interface AttendanceHistoryProps {
  records: AttendanceRecord[];
}

interface AttendanceRecord {
  id: string;
  training_session_id: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  check_in_time: string | null;
  notes: string | null;
  created_at: string;
  training_sessions?: TrainingSession;
}

interface TrainingSession {
  id: string;
  session_name: string;
  session_type: string;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string;
}
```

## Status Badge Colors

- **Present** (เข้าร่วม): Green
- **Late** (สาย): Yellow
- **Excused** (ลา): Blue
- **Absent** (ขาด): Red

## Date Filtering

The component includes a built-in date range filter:
- Click "กรองข้อมูล" button to show/hide filters
- Select start date and/or end date
- Records are filtered client-side
- Clear filters button appears when filters are active

## Requirements

Validates: AC4 - Athlete ดูประวัติการเข้าร่วม

From requirements:
- GIVEN นักกีฬาอยู่ในหน้าประวัติ
- THEN แสดงรายการฝึกซ้อมทั้งหมด
- AND แสดงสถานะแต่ละครั้ง
- AND แสดงอัตราการเข้าร่วม (%)

## Implementation Notes

- Uses `getMyAttendance()` server action to fetch records
- Records include joined `training_sessions` data
- Client-side filtering for better UX
- Responsive design with mobile-first approach
- Consistent with other athlete components (AttendanceStats, ScheduleCard)
