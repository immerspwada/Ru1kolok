# ActivityTimeline Component

## Overview

The `ActivityTimeline` component displays a vertical timeline of activity log entries for membership applications. It shows the history of all actions taken on an application with icons, timestamps, and details.

## Features

- ✅ Vertical timeline layout with connecting lines
- ✅ Icons for different action types (submitted, status_changed, document_uploaded, profile_created)
- ✅ Color-coded icons based on action type and status
- ✅ Thai locale timestamp formatting with relative time
- ✅ Display action details and notes
- ✅ Empty state when no activity log entries
- ✅ Responsive design
- ✅ Clean and simple UI with proper spacing

## Props

```typescript
interface ActivityTimelineProps {
  activityLog: ActivityLogEntry[];
}
```

### ActivityLogEntry Type

```typescript
interface ActivityLogEntry {
  timestamp: string;           // ISO 8601 timestamp
  action: string;              // Action type (submitted, status_changed, etc.)
  by_user: string;             // User ID who performed the action
  by_role: UserRole;           // Role of the user (admin, coach, athlete)
  details?: Record<string, any>; // Additional details
  from?: string;               // Previous status (for status_changed)
  to?: string;                 // New status (for status_changed)
  notes?: string;              // Optional notes
}
```

## Action Types

The component supports the following action types:

- `submitted` - Application submitted
- `status_changed` - Status changed (pending → approved/rejected/info_requested)
- `document_uploaded` - Document uploaded
- `profile_created` - Athlete profile created
- Custom actions - Will use default icon and styling

## Status Colors

- **Approved**: Green (CheckCircle2 icon)
- **Rejected**: Red (XCircle icon)
- **Info Requested**: Yellow (AlertCircle icon)
- **Pending**: Gray (Clock icon)
- **Submitted**: Blue (Send icon)
- **Document Uploaded**: Purple (FileText icon)
- **Profile Created**: Green (UserCheck icon)

## Timestamp Formatting

The component formats timestamps in Thai locale with relative time:

- Less than 1 minute: "เมื่อสักครู่"
- Less than 1 hour: "X นาทีที่แล้ว"
- Less than 1 day: "X ชั่วโมงที่แล้ว"
- Less than 1 week: "X วันที่แล้ว"
- More than 1 week: Full date in Thai format

## Usage

### Basic Usage

```tsx
import ActivityTimeline from '@/components/membership/ActivityTimeline';
import { ActivityLogEntry } from '@/types/database.types';

const activityLog: ActivityLogEntry[] = [
  {
    timestamp: '2024-01-15T10:30:00Z',
    action: 'submitted',
    by_user: 'user-123',
    by_role: 'athlete',
  },
  {
    timestamp: '2024-01-16T14:20:00Z',
    action: 'status_changed',
    by_user: 'coach-456',
    by_role: 'coach',
    from: 'pending',
    to: 'approved',
    notes: 'เอกสารครบถ้วน',
  },
];

<ActivityTimeline activityLog={activityLog} />
```

### With Empty State

```tsx
<ActivityTimeline activityLog={[]} />
// Displays: "ยังไม่มีประวัติการดำเนินการ"
```

### In ApplicationDetailModal

```tsx
import ActivityTimeline from './ActivityTimeline';

<div className="rounded-lg border bg-gray-50 p-4">
  <h3 className="text-lg font-semibold mb-4">ประวัติการดำเนินการ</h3>
  <ActivityTimeline activityLog={application.activity_log} />
</div>
```

## Styling

The component uses Tailwind CSS classes and is fully responsive. Key styling features:

- Timeline line: Gray connecting line between entries
- Icon containers: Colored circular backgrounds
- Content cards: White background with border and shadow
- Notes: Gray background highlight
- Spacing: Proper gaps and padding for readability

## Accessibility

- Semantic HTML structure
- Clear visual hierarchy
- Color is not the only indicator (icons + text)
- Readable font sizes
- Proper contrast ratios

## Testing

A test page is available at `/test-activity-timeline` to verify the component with various scenarios:

- With multiple activity log entries
- Empty activity log
- Single entry
- Rejected application
- Different action types

## Requirements Validation

This component validates **Requirements US-8**:

- ✅ AC-8.1: แสดง timeline ของการเปลี่ยนสถานะทั้งหมด
- ✅ AC-8.2: แสดงว่าใครเปลี่ยนสถานะเมื่อไหร่
- ✅ AC-8.3: แสดงเหตุผลในการเปลี่ยนสถานะ
- ✅ AC-8.4: ไม่สามารถแก้ไขประวัติได้ (immutable - read-only component)
- ✅ AC-8.5: Athlete เห็นประวัติของใบสมัครตัวเอง (via ApplicationDetailModal)

## Related Components

- `ApplicationDetailModal` - Uses ActivityTimeline to display application history
- `ApplicationStatusCard` - May use ActivityTimeline in future for quick history view

## Future Enhancements

- Add filtering by action type
- Add search functionality
- Add export to PDF/CSV
- Add user avatars
- Add real-time updates via Supabase Realtime
