# AttendanceStats Component

## Overview

The `AttendanceStats` component displays an athlete's attendance statistics in a visually appealing card format. It shows the attendance rate with a color-coded progress bar and breaks down the counts by status (present, late, excused, absent).

## Features

- **Attendance Rate Display**: Large percentage display with color coding
  - Green (≥80%): Excellent attendance
  - Yellow (60-79%): Good attendance
  - Red (<60%): Needs improvement

- **Visual Progress Bar**: Animated progress bar that matches the attendance rate color

- **Status Breakdown**: Four status cards showing:
  - Present (green): Sessions attended on time
  - Late (yellow): Sessions attended but late
  - Excused (blue): Sessions with approved leave
  - Absent (red): Sessions missed without excuse

- **Icon Indicators**: Each status has a corresponding icon for quick visual recognition

## Props

```typescript
interface AttendanceStatsProps {
  totalSessions: number;      // Total number of sessions
  presentCount: number;        // Number of sessions attended on time
  absentCount: number;         // Number of sessions missed
  excusedCount: number;        // Number of sessions with approved leave
  lateCount: number;           // Number of sessions attended late
  attendanceRate: number;      // Attendance percentage (0-100)
}
```

## Usage

### Basic Usage

```tsx
import AttendanceStats from '@/components/athlete/AttendanceStats';

export default function MyPage() {
  return (
    <AttendanceStats
      totalSessions={20}
      presentCount={15}
      absentCount={2}
      excusedCount={1}
      lateCount={2}
      attendanceRate={85}
    />
  );
}
```

### With Server Action

```tsx
import { getAttendanceStats } from '@/lib/athlete/attendance-actions';
import AttendanceStats from '@/components/athlete/AttendanceStats';

export default async function AttendancePage() {
  const { data: stats, error } = await getAttendanceStats();

  if (error || !stats) {
    return <div>Error loading attendance statistics</div>;
  }

  return (
    <div className="space-y-6">
      <h1>My Attendance</h1>
      <AttendanceStats {...stats} />
    </div>
  );
}
```

### With Date Filtering

```tsx
import { getAttendanceStats } from '@/lib/athlete/attendance-actions';
import AttendanceStats from '@/components/athlete/AttendanceStats';

export default async function AttendancePage() {
  // Get stats for the last 30 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: stats, error } = await getAttendanceStats({
    startDate,
    endDate,
  });

  if (error || !stats) {
    return <div>Error loading attendance statistics</div>;
  }

  return (
    <div className="space-y-6">
      <h1>Last 30 Days Attendance</h1>
      <AttendanceStats {...stats} />
    </div>
  );
}
```

## Design Decisions

### Color Coding

The component uses a traffic light system for attendance rates:
- **Green (≥80%)**: Indicates excellent attendance, encouraging continued good behavior
- **Yellow (60-79%)**: Indicates acceptable but improvable attendance
- **Red (<60%)**: Indicates poor attendance that needs attention

### Status Icons

Each status uses a distinct icon from lucide-react:
- **CheckCircle**: Present (positive action completed)
- **Clock**: Late (time-related issue)
- **AlertCircle**: Excused (notification/warning style)
- **XCircle**: Absent (negative/missing)

### Layout

The component uses a responsive grid layout:
- Mobile: 2 columns for status cards
- Desktop: Same 2-column layout for better readability

### Calculation

The attendance rate is calculated as:
```
attendanceRate = ((presentCount + lateCount) / totalSessions) * 100
```

This means both "present" and "late" count as attended sessions, while "absent" and "excused" do not contribute to the attendance rate.

## Accessibility

- Uses semantic HTML with proper heading hierarchy
- Color is not the only indicator (icons and text labels provided)
- Sufficient color contrast for all text elements
- Progress bar has smooth transitions for better UX

## Requirements

This component fulfills **AC4** from the requirements document:
- Displays attendance rate percentage ✓
- Shows counts (present/absent/excused/late) ✓
- Visual progress bar ✓

## Related Components

- `AttendanceHistory`: Shows detailed list of attendance records
- `DashboardStats`: Shows overall dashboard statistics
- `ScheduleCard`: Shows individual session details with check-in status

## Testing

See `AttendanceStats.example.tsx` for various usage examples including:
- High attendance scenario (85%)
- Medium attendance scenario (65%)
- Low attendance scenario (40%)
- No sessions scenario (0%)
