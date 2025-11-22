# LeaveRequestForm Component

A reusable form component for athletes to request leave from training sessions.

## Features

- ✅ Reason textarea with minimum 10 character validation
- ✅ Real-time character count display
- ✅ Timing validation (must be at least 2 hours before session)
- ✅ Confirmation dialog before submission
- ✅ Success dialog after submission
- ✅ Error handling and display
- ✅ Loading states during submission
- ✅ Automatic page refresh after success
- ✅ Thai language support

## Requirements

Implements **BR2** from the Training Attendance System requirements:
- Athletes can request leave in advance
- Leave request must include a reason (minimum 10 characters)
- Must be submitted at least 2 hours before session start

## Props

```typescript
interface LeaveRequestFormProps {
  sessionId: string;        // Required: ID of the training session
  sessionTitle?: string;    // Optional: Title to display in dialogs
  sessionDate: string;      // Required: Session date (YYYY-MM-DD)
  startTime: string;        // Required: Session start time (HH:MM:SS)
  disabled?: boolean;       // Optional: Disable the form
  className?: string;       // Optional: Additional CSS classes
  onSuccess?: () => void;   // Optional: Callback on successful submission
  onError?: (error: string) => void; // Optional: Callback on error
}
```

## Usage

### Basic Usage

```tsx
import { LeaveRequestForm } from '@/components/athlete/LeaveRequestForm';

export function MyPage() {
  return (
    <LeaveRequestForm
      sessionId="session-123"
      sessionTitle="ฝึกซ้อมประจำวัน"
      sessionDate="2024-11-25"
      startTime="16:00:00"
    />
  );
}
```

### With Callbacks

```tsx
<LeaveRequestForm
  sessionId="session-123"
  sessionTitle="ฝึกซ้อมพิเศษ"
  sessionDate="2024-11-26"
  startTime="18:00:00"
  onSuccess={() => {
    console.log('Leave request submitted!');
    // Custom success handling
  }}
  onError={(error) => {
    console.error('Error:', error);
    // Custom error handling
  }}
/>
```

### In a Dialog

```tsx
<Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>แจ้งลาการฝึกซ้อม</DialogTitle>
    </DialogHeader>
    <LeaveRequestForm
      sessionId="session-123"
      sessionDate="2024-11-27"
      startTime="08:00:00"
      onSuccess={() => setShowDialog(false)}
    />
  </DialogContent>
</Dialog>
```

## Validation Rules

### Reason Validation
- **Minimum length**: 10 characters (after trimming whitespace)
- **Required**: Cannot be empty
- **Real-time feedback**: Character count shown below textarea
- **Visual feedback**: Border turns red when invalid

### Timing Validation
- **Minimum advance notice**: 2 hours before session start
- **Automatic check**: Validates on form submission
- **Status display**: Shows remaining time until session
- **Disabled state**: Form disabled if timing requirement not met

## Error Handling

The component handles various error scenarios:

1. **Validation Errors**
   - Reason too short (< 10 characters)
   - Session too soon (< 2 hours)

2. **Server Errors**
   - Session not found
   - Already checked in
   - Already requested leave
   - Session cancelled
   - Not in athlete's club

3. **Network Errors**
   - Connection issues
   - Timeout errors

All errors are displayed in a red alert box below the form.

## User Flow

1. **Initial State**
   - Form shows timing status (can/cannot request leave)
   - Textarea is empty
   - Character count shows "0 / 10 ตัวอักษรขั้นต่ำ"
   - Submit button is disabled

2. **Typing Reason**
   - Character count updates in real-time
   - Validation hint shows when < 10 characters
   - Submit button enables when ≥ 10 characters

3. **Submission**
   - Timing validation runs
   - Confirmation dialog appears
   - Shows session details and reason

4. **Confirmation**
   - User confirms or cancels
   - Loading state during submission
   - Success dialog on completion

5. **Success**
   - Success message displayed
   - Form is cleared
   - Page refreshes automatically after 1.5 seconds

## Styling

The component uses Tailwind CSS and shadcn/ui components:
- `Button` - For submit and dialog actions
- `Textarea` - For reason input
- `Label` - For form labels
- `Dialog` - For confirmation and success messages

Custom styling can be applied via the `className` prop.

## Accessibility

- Proper label associations with `htmlFor`
- Disabled states clearly indicated
- Error messages announced to screen readers
- Keyboard navigation support
- Focus management in dialogs

## Dependencies

- `next/navigation` - For router.refresh()
- `@/components/ui/*` - shadcn/ui components
- `@/lib/athlete/attendance-actions` - Server action for submission
- `lucide-react` - Icons

## Related Components

- `CheckInButton` - For checking in to sessions
- `ScheduleCard` - Displays sessions with check-in/leave options
- `AttendanceHistory` - Shows past attendance and leave requests

## Server Action

The component calls `requestLeave()` from `@/lib/athlete/attendance-actions.ts`:

```typescript
export async function requestLeave(data: {
  sessionId: string;
  reason: string;
}): Promise<{ success?: boolean; error?: string }>
```

## Testing

See `LeaveRequestForm.example.tsx` for usage examples and test scenarios.

## Notes

- The form automatically refreshes the page after successful submission
- All text is in Thai language
- Timing validation happens both client-side and server-side
- The component is fully controlled (manages its own state)
