# ApplicationDetailModal Component

## Overview

The `ApplicationDetailModal` component displays detailed information about a membership application in a modal dialog. It shows personal information, uploaded documents with thumbnails, activity timeline, and provides approve/reject actions for coaches and admins.

## Features

- **Personal Information Display**: Shows all data from `personal_info` JSONB field
- **Document Viewer**: Displays all 3 document types with thumbnails and preview
- **Activity Timeline**: Shows complete history from `activity_log` JSONB
- **Approve/Reject Actions**: Allows coaches/admins to review applications
- **Confirmation Dialogs**: Shows confirmation before approve/reject actions
- **Error Handling**: Displays error messages for failed operations

## Requirements Validation

This component validates the following requirements:
- **US-3.2**: Display complete applicant information
- **US-3.3**: Show all uploaded documents for verification
- **US-3.4**: Provide approve button for coaches/admins
- **US-3.5**: Provide reject button with reason textarea
- **US-8**: Display complete activity timeline

## Props

```typescript
interface ApplicationDetailModalProps {
  application: ApplicationWithClub | null;  // Application to display (null to close)
  onApprove?: () => void;                   // Callback after successful approval
  onReject?: () => void;                    // Callback after successful rejection
  onClose: () => void;                      // Callback to close modal
  isCoach?: boolean;                        // Whether user is coach/admin (enables actions)
}

interface ApplicationWithClub extends MembershipApplication {
  clubs?: {
    name: string;
    sport_type: string;
  };
}
```

## Usage

### Basic Usage (Read-Only)

```tsx
import { ApplicationDetailModal } from '@/components/membership/ApplicationDetailModal';

function MyComponent() {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  return (
    <ApplicationDetailModal
      application={selectedApp}
      onClose={() => setSelectedApp(null)}
      isCoach={false}
    />
  );
}
```

### With Coach Actions

```tsx
import { ApplicationDetailModal } from '@/components/membership/ApplicationDetailModal';
import { useRouter } from 'next/navigation';

function CoachApplicationsPage() {
  const router = useRouter();
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const handleApprove = () => {
    // Show success toast
    toast.success('อนุมัติใบสมัครเรียบร้อยแล้ว');
    // Refresh data
    router.refresh();
  };

  const handleReject = () => {
    // Show success toast
    toast.success('ปฏิเสธใบสมัครเรียบร้อยแล้ว');
    // Refresh data
    router.refresh();
  };

  return (
    <ApplicationDetailModal
      application={selectedApp}
      onApprove={handleApprove}
      onReject={handleReject}
      onClose={() => setSelectedApp(null)}
      isCoach={true}
    />
  );
}
```

## Sections

### 1. Personal Information Section

Displays data from `personal_info` JSONB:
- Full name
- Phone number
- Address
- Emergency contact
- Date of birth (optional)
- Blood type (optional)
- Medical conditions (optional)

### 2. Documents Section

Displays all documents from `documents` JSONB array:
- Document type label (บัตรประชาชน, ทะเบียนบ้าน, สูติบัตร)
- Thumbnail preview (image or PDF icon)
- File name and size
- View button (opens in new tab)
- Download button
- Verification status badge (if verified)

### 3. Activity Timeline Section

Displays activity log from `activity_log` JSONB:
- Action type with icon
- Timestamp (relative time)
- User role who performed action
- Status changes (from → to)
- Notes and details
- Sorted by newest first

### 4. Review Info Section

Shows rejection reason if status is 'rejected':
- Displays notes from `review_info` JSONB
- Highlighted in red border

## Action Buttons

### For Coaches/Admins (when `isCoach={true}`)

**Approve Button**:
- Only shown for 'pending' or 'info_requested' status
- Shows confirmation dialog before approval
- Calls `reviewApplication(id, 'approve')` action
- Creates athlete profile automatically on success
- Triggers `onApprove` callback

**Reject Button**:
- Only shown for 'pending' or 'info_requested' status
- Shows dialog with textarea for reason
- Validates that reason is provided
- Calls `reviewApplication(id, 'reject', reason)` action
- Triggers `onReject` callback

### For All Users

**Close Button**:
- Always visible
- Closes modal without any action
- Triggers `onClose` callback

## Confirmation Dialogs

### Approve Confirmation

```
Title: ยืนยันการอนุมัติ
Message: คุณต้องการอนุมัติใบสมัครของ [ชื่อ] ใช่หรือไม่?
         เมื่ออนุมัติแล้ว ระบบจะสร้างโปรไฟล์นักกีฬาให้อัตโนมัติ
Actions: [ยกเลิก] [ยืนยันการอนุมัติ]
```

### Reject Dialog

```
Title: ปฏิเสธใบสมัคร
Message: กรุณาระบุเหตุผลในการปฏิเสธใบสมัครของ [ชื่อ]
Input: Textarea for reason (required)
Actions: [ยกเลิก] [ยืนยันการปฏิเสธ]
```

## Error Handling

The component handles the following errors:
- Authentication errors (not logged in)
- Permission errors (not authorized)
- Validation errors (missing reason for rejection)
- Server errors (database or network issues)
- Profile creation errors (when approving)

Errors are displayed in a red alert box within the confirmation dialog.

## Styling

- Uses Tailwind CSS for styling
- Responsive design (mobile, tablet, desktop)
- Maximum width: 4xl (896px)
- Maximum height: 90vh with scroll
- Sections have gray background with borders
- Status badges with color coding
- Icons from lucide-react

## Document Preview

### Image Files (JPG, PNG)
- Shows thumbnail preview
- Click to open full size in new tab
- Download button available

### PDF Files
- Shows PDF icon placeholder
- Click to open in new tab
- Download button available

## Activity Timeline Icons

- **Submitted**: Blue circle with FileText icon
- **Status Changed**: Purple circle with AlertCircle icon
- **Profile Created**: Green circle with CheckCircle icon
- **Other Actions**: Gray circle with Clock icon

## Dependencies

```json
{
  "@/components/ui/dialog": "Dialog components",
  "@/components/ui/button": "Button component",
  "@/components/ui/textarea": "Textarea component",
  "@/lib/membership/actions": "reviewApplication action",
  "@/types/database.types": "Type definitions",
  "lucide-react": "Icons"
}
```

## State Management

The component manages the following internal state:
- `showRejectDialog`: Controls reject dialog visibility
- `showApproveDialog`: Controls approve dialog visibility
- `rejectReason`: Stores rejection reason text
- `isSubmitting`: Tracks submission state
- `error`: Stores error messages

## Accessibility

- Proper dialog semantics with DialogTitle and DialogDescription
- Keyboard navigation support
- Focus management
- Screen reader friendly labels
- Disabled state for buttons during submission

## Performance

- Lazy loading of document images
- Efficient JSONB data parsing
- Minimal re-renders with proper state management
- Optimized for large activity logs

## Testing

See `ApplicationDetailModal.test.tsx` for comprehensive test coverage including:
- Rendering with different application states
- Document display and preview
- Activity timeline rendering
- Approve/reject workflows
- Error handling
- Permission checks

## Related Components

- `ApplicationList`: Lists applications and triggers this modal
- `ApplicationStatusCard`: Shows application summary
- `ActivityTimeline`: Standalone timeline component (future)

## Future Enhancements

- Document verification toggle
- Comment/note addition
- Request additional information action
- Email notification preview
- Print application details
- Export to PDF

## Notes

- The component uses three separate dialogs: main detail, approve confirmation, and reject dialog
- Only one dialog is visible at a time
- Activity log is displayed in reverse chronological order (newest first)
- Document URLs are expected to be signed URLs from Supabase Storage
- The component automatically handles profile creation when approving
- All text is in Thai language for the target audience
