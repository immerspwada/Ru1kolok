# CheckInButton Component

A reusable component for athlete check-in functionality with time window validation and confirmation dialogs.

## Features

- ✅ Validates check-in time window (30 minutes before - 15 minutes after session start)
- ✅ Shows confirmation dialog before check-in
- ✅ Displays success/error messages
- ✅ Updates UI state after check-in
- ✅ Supports custom callbacks for success/error handling
- ✅ Fully tested with unit tests

## Requirements

Implements:
- **AC2**: Athlete เช็คอินเข้าฝึกซ้อม
- **BR1**: เวลาเช็คอิน (30 นาทีก่อน - 15 นาทีหลัง)

## Usage

### Basic Usage

```tsx
import { CheckInButton } from '@/components/athlete/CheckInButton';

<CheckInButton
  sessionId="session-123"
  sessionDate="2024-11-25"
  startTime="16:00:00"
  sessionTitle="ฝึกซ้อมประจำวัน"
/>
```

### With Callbacks

```tsx
<CheckInButton
  sessionId="session-123"
  sessionDate="2024-11-25"
  startTime="16:00:00"
  sessionTitle="ฝึกซ้อมประจำวัน"
  onSuccess={() => {
    console.log('Check-in successful!');
    // Custom success handling
  }}
  onError={(error) => {
    console.error('Check-in failed:', error);
    // Custom error handling
  }}
/>
```

### Custom Styling

```tsx
<CheckInButton
  sessionId="session-123"
  sessionDate="2024-11-25"
  startTime="16:00:00"
  className="w-full bg-green-600 hover:bg-green-700"
/>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sessionId` | `string` | Yes | Training session ID |
| `sessionDate` | `string` | Yes | Session date (YYYY-MM-DD) |
| `startTime` | `string` | Yes | Session start time (HH:MM:SS) |
| `sessionTitle` | `string` | No | Session title for display in dialogs |
| `disabled` | `boolean` | No | Disable the button |
| `className` | `string` | No | Custom CSS classes |
| `onSuccess` | `() => void` | No | Callback on successful check-in |
| `onError` | `(error: string) => void` | No | Callback on check-in error |

## Time Window Validation

The component automatically validates the check-in time window:

- **Too Early**: Button disabled if more than 30 minutes before session start
- **On Time**: Button enabled from 30 minutes before until session start
- **Late**: Button enabled from session start until 15 minutes after (marked as "late")
- **Too Late**: Button disabled if more than 15 minutes after session start

## Visual States

The component displays different visual states:

1. **ยังไม่ถึงเวลาเช็คอิน** (Too early) - Gray, disabled
2. **เช็คอินได้ตอนนี้** (On time) - Green, enabled
3. **เช็คอินได้ (จะถูกบันทึกว่าสาย)** (Late) - Yellow, enabled with warning
4. **หมดเวลาเช็คอิน** (Too late) - Red, disabled

## Dialogs

### Confirmation Dialog
- Shows session details
- Warns if check-in will be marked as "late"
- Requires user confirmation

### Success Dialog
- Displays success message
- Shows session title
- Auto-refreshes page after 1.5 seconds

### Error Display
- Shows inline error message
- Calls `onError` callback if provided

## Testing

The component includes comprehensive unit tests covering:
- Rendering
- Time window validation (too early, on time, late, too late)
- Confirmation dialog display
- Action calls
- Success/error handling
- Callback invocation

Run tests:
```bash
npm test -- CheckInButton.test.tsx --run
```

## Integration Example

See `ScheduleCard.tsx` for an example of integrating the CheckInButton into a larger component.

## Notes

- The component uses the `athleteCheckIn` server action from `@/lib/athlete/attendance-actions`
- Automatically refreshes the page on successful check-in
- Prevents duplicate check-ins (handled by server action)
- All text is in Thai language
