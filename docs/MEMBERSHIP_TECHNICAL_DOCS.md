# Membership Registration System - Technical Documentation

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Server Actions API](#server-actions-api)
4. [Query Functions API](#query-functions-api)
5. [Validation & Storage](#validation--storage)
6. [Component API](#component-api)
7. [RLS Policies & Security](#rls-policies--security)
8. [Helper Functions](#helper-functions)
9. [Troubleshooting Guide](#troubleshooting-guide)

---

## Overview

The Membership Registration System allows athletes to submit applications to join sports clubs. Coaches review and approve/reject applications, and upon approval, athlete profiles are automatically created.

**Key Features:**
- Multi-step registration form with validation
- Document upload with preview (ID card, house registration, birth certificate)
- JSONB-based flexible schema for personal info, documents, and activity logs
- Role-based access control (Athletes, Coaches, Admins)
- Automatic athlete profile creation on approval
- Complete audit trail with activity logging

**Technology Stack:**
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Storage)
- Zod (Validation)
- Tailwind CSS + shadcn/ui

---

## Database Schema

### Main Table: `membership_applications`

**Purpose:** Stores all membership applications with flexible JSONB fields for extensibility.

```sql
CREATE TABLE membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  
  -- JSONB Fields (flexible schema)
  personal_info JSONB NOT NULL,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  review_info JSONB,
  activity_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'info_requested')),
  
  -- Profile Link (after approval)
  profile_id UUID REFERENCES profiles(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, club_id) -- One application per user per club
);
```


### JSONB Structure Examples

#### 1. `personal_info` JSONB

```json
{
  "full_name": "สมชาย ใจดี",
  "phone_number": "081-234-5678",
  "address": "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
  "emergency_contact": "089-999-9999",
  "date_of_birth": "2000-01-15",
  "blood_type": "A",
  "medical_conditions": "แพ้ยาปฏิชีวนะ"
}
```

**Required Fields:**
- `full_name` (string): Full name of applicant
- `phone_number` (string): Phone in format 0XX-XXX-XXXX
- `address` (string): Full address
- `emergency_contact` (string): Emergency phone in format 0XX-XXX-XXXX

**Optional Fields:**
- `date_of_birth` (string): ISO date format
- `blood_type` (string): Blood type (A, B, AB, O)
- `medical_conditions` (string): Health notes

#### 2. `documents` JSONB Array

```json
[
  {
    "type": "id_card",
    "url": "https://xxx.supabase.co/storage/v1/object/public/membership-documents/user-id/id_card_1234567890.jpg",
    "uploaded_at": "2024-01-15T10:30:00Z",
    "file_name": "id_card.jpg",
    "file_size": 245678,
    "is_verified": false
  },
  {
    "type": "house_registration",
    "url": "https://xxx.supabase.co/storage/v1/object/public/membership-documents/user-id/house_registration_1234567891.jpg",
    "uploaded_at": "2024-01-15T10:31:00Z",
    "file_name": "house_reg.jpg",
    "file_size": 198234,
    "is_verified": false
  },
  {
    "type": "birth_certificate",
    "url": "https://xxx.supabase.co/storage/v1/object/public/membership-documents/user-id/birth_certificate_1234567892.pdf",
    "uploaded_at": "2024-01-15T10:32:00Z",
    "file_name": "birth_cert.pdf",
    "file_size": 512345,
    "is_verified": false
  }
]
```

**Document Types:**
- `id_card`: National ID card
- `house_registration`: House registration document
- `birth_certificate`: Birth certificate

**Fields:**
- `type` (string): Document type
- `url` (string): Full URL to document in storage
- `uploaded_at` (string): ISO timestamp
- `file_name` (string): Original filename
- `file_size` (number): Size in bytes
- `is_verified` (boolean): Verification status (future use)


#### 3. `review_info` JSONB

```json
{
  "reviewed_by": "uuid-of-reviewer",
  "reviewed_at": "2024-01-16T14:20:00Z",
  "reviewer_role": "coach",
  "notes": "เอกสารครบถ้วน อนุมัติ"
}
```

**Fields:**
- `reviewed_by` (string): UUID of reviewer
- `reviewed_at` (string): ISO timestamp of review
- `reviewer_role` (string): Role of reviewer (coach/admin)
- `notes` (string): Review notes or rejection reason

#### 4. `activity_log` JSONB Array

```json
[
  {
    "timestamp": "2024-01-15T10:30:00Z",
    "action": "submitted",
    "by_user": "uuid-of-athlete",
    "by_role": "athlete",
    "details": {
      "club_id": "uuid-of-club",
      "document_count": 3
    }
  },
  {
    "timestamp": "2024-01-16T14:20:00Z",
    "action": "status_changed",
    "by_user": "uuid-of-coach",
    "by_role": "coach",
    "from": "pending",
    "to": "approved",
    "notes": "เอกสารครบถ้วน อนุมัติ"
  },
  {
    "timestamp": "2024-01-16T14:21:00Z",
    "action": "profile_created",
    "by_user": "uuid-of-athlete",
    "by_role": "athlete",
    "details": {
      "profile_id": "uuid-of-profile",
      "club_id": "uuid-of-club"
    }
  }
]
```

**Action Types:**
- `submitted`: Application submitted
- `status_changed`: Status changed (pending → approved/rejected)
- `profile_created`: Athlete profile created
- `document_uploaded`: Document uploaded/updated

**Fields:**
- `timestamp` (string): ISO timestamp
- `action` (string): Action type
- `by_user` (string): UUID of user who performed action
- `by_role` (string): Role of user (athlete/coach/admin)
- `from` (string): Previous status (for status_changed)
- `to` (string): New status (for status_changed)
- `notes` (string): Additional notes
- `details` (object): Additional action-specific data

### Indexes

```sql
-- Standard indexes
CREATE INDEX idx_applications_user ON membership_applications(user_id);
CREATE INDEX idx_applications_club ON membership_applications(club_id);
CREATE INDEX idx_applications_status ON membership_applications(status);
CREATE INDEX idx_applications_created ON membership_applications(created_at DESC);
CREATE INDEX idx_applications_profile ON membership_applications(profile_id);

-- GIN indexes for JSONB queries
CREATE INDEX idx_applications_personal_info ON membership_applications USING GIN (personal_info);
CREATE INDEX idx_applications_documents ON membership_applications USING GIN (documents);
CREATE INDEX idx_applications_activity_log ON membership_applications USING GIN (activity_log);
```

**Purpose:**
- Standard indexes: Fast lookups by user, club, status, date
- GIN indexes: Enable efficient JSONB queries (e.g., searching by name in personal_info)


### Storage Bucket: `membership-documents`

**Configuration:**
- Bucket name: `membership-documents`
- Public: `false` (private bucket with RLS policies)
- Path structure: `{userId}/{documentType}_{timestamp}.{ext}`

**Example paths:**
```
abc123-uuid/id_card_1705315800000.jpg
abc123-uuid/house_registration_1705315860000.png
abc123-uuid/birth_certificate_1705315920000.pdf
```

---

## Server Actions API

### File: `lib/membership/actions.ts`

All server actions are marked with `'use server'` and include authentication, validation, and error handling.

#### 1. `submitApplication(data)`

**Purpose:** Submit a new membership application

**Validates:** Requirements US-1, US-8

**Parameters:**
```typescript
interface ApplicationSubmissionInput {
  club_id: string;
  personal_info: PersonalInfoInput;
  documents: DocumentEntry[];
}

type PersonalInfoInput = {
  full_name: string;
  phone_number: string;
  address: string;
  emergency_contact: string;
  date_of_birth?: string;
  blood_type?: string;
  medical_conditions?: string;
}

type DocumentEntry = {
  type: 'id_card' | 'house_registration' | 'birth_certificate';
  url: string;
  uploaded_at: string;
  file_name: string;
  file_size: number;
}
```

**Returns:**
```typescript
{
  success: boolean;
  applicationId?: string;
  error?: string;
}
```

**Process:**
1. Validate input with Zod schemas
2. Verify authentication
3. Check for duplicate application (UNIQUE constraint on user_id + club_id)
4. Create application record with JSONB data structure
5. Add initial activity log entry via `add_activity_log()` function
6. Return success with application ID

**Example Usage:**
```typescript
import { submitApplication } from '@/lib/membership/actions';

const result = await submitApplication({
  club_id: 'club-uuid',
  personal_info: {
    full_name: 'สมชาย ใจดี',
    phone_number: '081-234-5678',
    address: '123 ถนนสุขุมวิท...',
    emergency_contact: '089-999-9999',
  },
  documents: [
    {
      type: 'id_card',
      url: 'https://...',
      uploaded_at: new Date().toISOString(),
      file_name: 'id_card.jpg',
      file_size: 245678,
    },
    // ... other documents
  ],
});

if (result.success) {
  console.log('Application submitted:', result.applicationId);
} else {
  console.error('Error:', result.error);
}
```

**Error Handling:**
- Validation errors: Returns first validation error message
- Duplicate application: "คุณมีใบสมัครสำหรับกีฬานี้อยู่แล้ว"
- Authentication error: "ไม่ได้รับอนุญาต: กรุณาเข้าสู่ระบบ"
- Database error: "ไม่สามารถสร้างใบสมัครได้"


#### 2. `reviewApplication(applicationId, action, reason?)`

**Purpose:** Review a membership application (approve or reject)

**Validates:** Requirements US-3, US-5

**Parameters:**
```typescript
applicationId: string;  // UUID of application
action: 'approve' | 'reject';
reason?: string;  // Required for rejection
```

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
  profileId?: string;  // Only returned on approval
}
```

**Process:**
1. Verify authentication
2. Verify coach/admin permission (check club_id match or admin role)
3. Validate action and reason (reason required for rejection)
4. Call `update_application_status()` database helper function
5. If approved: call `createAthleteProfile()` to create athlete record
6. Activity log entry added automatically via database function
7. Return success/error with appropriate messages

**Example Usage:**
```typescript
import { reviewApplication } from '@/lib/membership/actions';

// Approve application
const approveResult = await reviewApplication(
  'application-uuid',
  'approve'
);

if (approveResult.success) {
  console.log('Approved! Profile ID:', approveResult.profileId);
}

// Reject application
const rejectResult = await reviewApplication(
  'application-uuid',
  'reject',
  'เอกสารไม่ชัดเจน กรุณาอัปโหลดใหม่'
);

if (rejectResult.success) {
  console.log('Application rejected');
}
```

**Error Handling:**
- Missing reason for rejection: "กรุณาระบุเหตุผลในการปฏิเสธ"
- Permission denied: "คุณไม่มีสิทธิ์ในการพิจารณาใบสมัครนี้"
- Already processed: "ใบสมัครนี้อนุมัติแล้ว" / "ใบสมัครนี้ปฏิเสธแล้ว"
- Profile creation failed: Rolls back status change

**Important Notes:**
- On approval, automatically creates athlete profile
- If profile creation fails, status is rolled back to 'pending'
- Activity log is updated automatically by database function

---

## Query Functions API

### File: `lib/membership/queries.ts`

All query functions are marked with `'use server'` and respect RLS policies.

#### 1. `getAvailableClubs()`

**Purpose:** Fetch clubs with coach info and member count for sport selection

**Validates:** Requirements US-2

**Parameters:** None

**Returns:**
```typescript
{
  data?: Array<{
    id: string;
    name: string;
    description: string | null;
    sport_type: string | null;
    member_count: number;
    coach: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    } | null;
  }>;
  error?: string;
}
```

**Example Usage:**
```typescript
import { getAvailableClubs } from '@/lib/membership/queries';

const result = await getAvailableClubs();

if (result.data) {
  result.data.forEach(club => {
    console.log(`${club.name} - ${club.member_count} members`);
    if (club.coach) {
      console.log(`Coach: ${club.coach.first_name} ${club.coach.last_name}`);
    }
  });
}
```


#### 2. `getMyApplications(userId)`

**Purpose:** Get athlete's own applications with club details

**Validates:** Requirements US-4

**Parameters:**
```typescript
userId: string;  // UUID of athlete
```

**Returns:**
```typescript
{
  data?: Array<MembershipApplication & {
    clubs: {
      id: string;
      name: string;
      sport_type: string;
      description: string;
    };
  }>;
  error?: string;
}
```

**Security:** Verifies that authenticated user matches userId parameter

**Example Usage:**
```typescript
import { getMyApplications } from '@/lib/membership/queries';

const result = await getMyApplications(userId);

if (result.data) {
  result.data.forEach(app => {
    console.log(`${app.clubs.name} - Status: ${app.status}`);
  });
}
```

#### 3. `getClubApplications(clubId)`

**Purpose:** Get applications for a specific club (for coaches)

**Validates:** Requirements US-3

**Parameters:**
```typescript
clubId: string;  // UUID of club
```

**Returns:**
```typescript
{
  data?: Array<MembershipApplication & {
    clubs: {
      id: string;
      name: string;
      sport_type: string;
    };
  }>;
  error?: string;
}
```

**Security:** Verifies that authenticated user is a coach for the specified club

**Example Usage:**
```typescript
import { getClubApplications } from '@/lib/membership/queries';

const result = await getClubApplications(clubId);

if (result.data) {
  const pending = result.data.filter(app => app.status === 'pending');
  console.log(`${pending.length} pending applications`);
}
```

#### 4. `getAllApplications(filters?)`

**Purpose:** Get all applications with optional filters (for admins)

**Validates:** Requirements US-7

**Parameters:**
```typescript
filters?: {
  clubId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'info_requested';
  startDate?: string;  // ISO date string
  endDate?: string;    // ISO date string
}
```

**Returns:**
```typescript
{
  data?: Array<MembershipApplication & {
    clubs: {
      id: string;
      name: string;
      sport_type: string;
    };
  }>;
  error?: string;
}
```

**Security:** Verifies that authenticated user has admin role

**Example Usage:**
```typescript
import { getAllApplications } from '@/lib/membership/queries';

// Get all pending applications
const result = await getAllApplications({ status: 'pending' });

// Get applications for specific club in date range
const filtered = await getAllApplications({
  clubId: 'club-uuid',
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});
```


#### 5. `getApplicationDetails(applicationId)`

**Purpose:** Get full application details with all JSONB data

**Validates:** Requirements US-3, US-4, US-8

**Parameters:**
```typescript
applicationId: string;  // UUID of application
```

**Returns:**
```typescript
{
  data?: MembershipApplication & {
    clubs: {
      id: string;
      name: string;
      sport_type: string;
      description: string;
    };
  };
  error?: string;
}
```

**Security:** 
- Athletes can view their own applications
- Coaches can view applications for their clubs
- Admins can view all applications

**Example Usage:**
```typescript
import { getApplicationDetails } from '@/lib/membership/queries';

const result = await getApplicationDetails(applicationId);

if (result.data) {
  const personalInfo = result.data.personal_info as PersonalInfo;
  console.log(`Applicant: ${personalInfo.full_name}`);
  console.log(`Phone: ${personalInfo.phone_number}`);
  
  const documents = result.data.documents as DocumentEntry[];
  console.log(`Documents: ${documents.length}`);
  
  const activityLog = result.data.activity_log as ActivityLogEntry[];
  console.log(`Activity entries: ${activityLog.length}`);
}
```

---

## Validation & Storage

### File: `lib/membership/validation.ts`

#### Validation Schemas (Zod)

**1. Personal Info Schema**
```typescript
const personalInfoSchema = z.object({
  full_name: z.string().min(2).max(100),
  phone_number: z.string().regex(/^0[0-9]{2}-[0-9]{3}-[0-9]{4}$/),
  address: z.string().min(10).max(500),
  emergency_contact: z.string().regex(/^0[0-9]{2}-[0-9]{3}-[0-9]{4}$/),
  date_of_birth: z.string().optional(),
  blood_type: z.string().optional(),
  medical_conditions: z.string().optional(),
});
```

**2. Document Entry Schema**
```typescript
const documentEntrySchema = z.object({
  type: z.enum(['id_card', 'house_registration', 'birth_certificate']),
  url: z.string().url(),
  uploaded_at: z.string(),
  file_name: z.string(),
  file_size: z.number().positive(),
  is_verified: z.boolean().optional(),
});
```

**3. File Validation Schema**
```typescript
const fileValidationSchema = z.object({
  name: z.string(),
  size: z.number().max(5 * 1024 * 1024), // 5MB
  type: z.string().refine(
    (type) => ['image/jpeg', 'image/png', 'application/pdf'].includes(type)
  ),
});
```

**4. Application Submission Schema**
```typescript
const applicationSubmissionSchema = z.object({
  club_id: z.string().uuid(),
  personal_info: personalInfoSchema,
  documents: z.array(documentEntrySchema)
    .min(3)
    .max(3)
    .refine((docs) => {
      const types = docs.map(d => d.type);
      return types.includes('id_card') &&
             types.includes('house_registration') &&
             types.includes('birth_certificate');
    }),
});
```


#### Helper Functions

**1. `isValidPhoneNumber(phone: string): boolean`**
- Validates phone number format (0XX-XXX-XXXX)

**2. `formatPhoneNumber(phone: string): string`**
- Auto-formats phone number to 0XX-XXX-XXXX format
- Removes all non-digits and reformats

**3. `validateFile(file: File): { valid: boolean; error?: string }`**
- Validates file type and size
- Returns validation result with error message

**Example Usage:**
```typescript
import { 
  formatPhoneNumber, 
  isValidPhoneNumber, 
  validateFile 
} from '@/lib/membership/validation';

// Format phone number
const formatted = formatPhoneNumber('0812345678');
// Result: '081-234-5678'

// Validate phone number
const isValid = isValidPhoneNumber('081-234-5678');
// Result: true

// Validate file
const validation = validateFile(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

**Constants:**
```typescript
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  id_card: 'บัตรประชาชน',
  house_registration: 'ทะเบียนบ้าน',
  birth_certificate: 'สูติบัตร',
};
```

### File: `lib/membership/storage.ts`

#### Storage Functions

**1. `uploadDocument(file, userId, documentType)`**

**Purpose:** Upload document to Supabase Storage

**Parameters:**
```typescript
file: File;
userId: string;
documentType: 'id_card' | 'house_registration' | 'birth_certificate';
```

**Returns:**
```typescript
{
  success: boolean;
  url?: string;
  error?: string;
}
```

**Path Format:** `{userId}/{documentType}_{timestamp}.{ext}`

**Example Usage:**
```typescript
import { uploadDocument } from '@/lib/membership/storage';

const result = await uploadDocument(file, userId, 'id_card');

if (result.success) {
  console.log('Uploaded to:', result.url);
} else {
  console.error('Upload failed:', result.error);
}
```

**2. `deleteDocument(path)`**

**Purpose:** Delete document from storage

**Parameters:**
```typescript
path: string;  // Full URL or path
```

**Returns:**
```typescript
{
  success: boolean;
  error?: string;
}
```

**3. `getDocumentUrl(path)`**

**Purpose:** Get signed URL for private document access (valid for 1 hour)

**Parameters:**
```typescript
path: string;  // Full URL or path
```

**Returns:**
```typescript
{
  success: boolean;
  url?: string;
  error?: string;
}
```


**4. `uploadMultipleDocuments(files, userId)`**

**Purpose:** Upload multiple documents at once

**Parameters:**
```typescript
files: Array<{ file: File; type: DocumentType }>;
userId: string;
```

**Returns:**
```typescript
{
  success: boolean;
  results: Array<{
    type: DocumentType;
    url?: string;
    error?: string;
  }>;
}
```

**Example Usage:**
```typescript
import { uploadMultipleDocuments } from '@/lib/membership/storage';

const result = await uploadMultipleDocuments([
  { file: idCardFile, type: 'id_card' },
  { file: houseRegFile, type: 'house_registration' },
  { file: birthCertFile, type: 'birth_certificate' },
], userId);

if (result.success) {
  console.log('All documents uploaded successfully');
} else {
  result.results.forEach(r => {
    if (r.error) {
      console.error(`${r.type}: ${r.error}`);
    }
  });
}
```

#### Utility Functions

```typescript
// Check if file type is allowed
isAllowedFileType(file: File): boolean

// Check if file size is within limit
isFileSizeValid(file: File): boolean

// Get file size in human readable format
formatFileSize(bytes: number): string

// Extract file extension from filename
getFileExtension(filename: string): string

// Check if file is an image
isImageFile(file: File): boolean

// Check if file is a PDF
isPdfFile(file: File): boolean
```

---

## Component API

### 1. RegistrationForm

**File:** `components/membership/RegistrationForm.tsx`

**Purpose:** Multi-step registration form with progress indicator

**Props:**
```typescript
interface RegistrationFormProps {
  userId: string;
  onSuccess?: () => void;
}
```

**Features:**
- 3-step form: Personal Info → Documents → Sport Selection
- Progress indicator (1/3, 2/3, 3/3)
- Step validation before progression
- Form state management
- Loading states during submission
- Error handling with user-friendly messages

**Example Usage:**
```tsx
import RegistrationForm from '@/components/membership/RegistrationForm';

<RegistrationForm
  userId={user.id}
  onSuccess={() => {
    toast.success('ส่งใบสมัครเรียบร้อยแล้ว');
    router.push('/dashboard/athlete/applications');
  }}
/>
```

**Validates:** Requirements US-1, US-2, NFR-1


### 2. PersonalInfoForm

**File:** `components/membership/PersonalInfoForm.tsx`

**Purpose:** Personal information input form with real-time validation

**Props:**
```typescript
interface PersonalInfoFormProps {
  value: PersonalInfoInput;
  onChange: (value: PersonalInfoInput) => void;
  errors?: Record<string, string>;
}
```

**Features:**
- Real-time validation with Zod
- Auto-format phone numbers (0XX-XXX-XXXX)
- Error messages in Thai
- Required and optional fields clearly marked
- Responsive layout

**Example Usage:**
```tsx
import PersonalInfoForm from '@/components/membership/PersonalInfoForm';

const [personalInfo, setPersonalInfo] = useState<PersonalInfoInput>({
  full_name: '',
  phone_number: '',
  address: '',
  emergency_contact: '',
});

<PersonalInfoForm
  value={personalInfo}
  onChange={setPersonalInfo}
  errors={validationErrors}
/>
```

**Validates:** Requirements US-1.1, US-1.4, NFR-7, NFR-8

### 3. DocumentUpload

**File:** `components/membership/DocumentUpload.tsx`

**Purpose:** Document upload component with drag & drop and preview

**Props:**
```typescript
interface DocumentUploadProps {
  documentType: 'id_card' | 'house_registration' | 'birth_certificate';
  value?: string;
  onChange: (url: string, fileName?: string, fileSize?: number) => void;
  error?: string;
  userId: string;
}
```

**Features:**
- Drag & drop support
- Image preview for JPG/PNG
- PDF icon for PDF files
- Upload progress indicator with percentage
- File validation feedback (real-time)
- Remove uploaded file button
- Responsive design

**Example Usage:**
```tsx
import DocumentUpload from '@/components/membership/DocumentUpload';

<DocumentUpload
  documentType="id_card"
  value={idCardUrl}
  onChange={(url, fileName, fileSize) => {
    setIdCardUrl(url);
    setIdCardInfo({ url, file_name: fileName, file_size: fileSize });
  }}
  error={errors.id_card}
  userId={userId}
/>
```

**Validates:** Requirements US-1.2, US-6.3, US-6.4, NFR-2, NFR-7

### 4. SportSelection

**File:** `components/membership/SportSelection.tsx`

**Purpose:** Sport/club selection component with search

**Props:**
```typescript
interface SportSelectionProps {
  onSelect: (clubId: string) => void;
  selectedClubId?: string;
}
```

**Features:**
- Single select (one sport per application)
- Search/filter by sport name
- Loading states with skeleton loaders
- Empty state if no clubs available
- Responsive grid layout
- Shows coach info and member count

**Example Usage:**
```tsx
import { SportSelection } from '@/components/membership/SportSelection';

<SportSelection
  onSelect={(clubId) => setSelectedClubId(clubId)}
  selectedClubId={selectedClubId}
/>
```

**Validates:** Requirements US-2, NFR-9


### 5. ApplicationList

**File:** `components/membership/ApplicationList.tsx`

**Purpose:** Display list of applications with filtering

**Props:**
```typescript
interface ApplicationListProps {
  applications: ApplicationWithClub[];
  onViewDetails: (application: ApplicationWithClub) => void;
  loading?: boolean;
}
```

**Features:**
- Table view with sortable columns
- Filter dropdown by status (all/pending/approved/rejected)
- Sort by date (newest first)
- Clickable rows to view details
- Status badges with colors
- Empty state when no applications

**Example Usage:**
```tsx
import { ApplicationList } from '@/components/membership/ApplicationList';

<ApplicationList
  applications={applications}
  onViewDetails={(app) => setSelectedApplication(app)}
  loading={isLoading}
/>
```

**Validates:** Requirements US-3, US-7

### 6. ApplicationDetailModal

**File:** `components/membership/ApplicationDetailModal.tsx`

**Purpose:** Modal displaying full application details with review actions

**Props:**
```typescript
interface ApplicationDetailModalProps {
  application: ApplicationWithClub | null;
  onApprove?: () => void;
  onReject?: () => void;
  onClose: () => void;
  isCoach?: boolean;
}
```

**Features:**
- Display personal info from JSONB
- Display all 3 documents with thumbnails
- Clickable documents to view full size
- Activity timeline
- Approve button (with confirmation dialog)
- Reject button (with reason textarea)
- Read-only mode for athletes

**Example Usage:**
```tsx
import { ApplicationDetailModal } from '@/components/membership/ApplicationDetailModal';

<ApplicationDetailModal
  application={selectedApplication}
  onApprove={() => {
    toast.success('อนุมัติใบสมัครเรียบร้อยแล้ว');
    refreshApplications();
  }}
  onReject={() => {
    toast.success('ปฏิเสธใบสมัครเรียบร้อยแล้ว');
    refreshApplications();
  }}
  onClose={() => setSelectedApplication(null)}
  isCoach={true}
/>
```

**Validates:** Requirements US-3.2, US-3.3, US-3.4, US-3.5, US-8

### 7. ApplicationStatusCard

**File:** `components/membership/ApplicationStatusCard.tsx`

**Purpose:** Card displaying application status for athletes

**Props:**
```typescript
interface ApplicationStatusCardProps {
  application: ApplicationWithClub;
  onViewDetails: (application: ApplicationWithClub) => void;
}
```

**Features:**
- Status badge (pending=yellow, approved=green, rejected=red)
- Club name and sport type
- Submitted date
- Rejection reason (if rejected)
- Approval date (if approved)
- Clickable to view full details

**Example Usage:**
```tsx
import { ApplicationStatusCard } from '@/components/membership/ApplicationStatusCard';

<ApplicationStatusCard
  application={application}
  onViewDetails={(app) => setSelectedApplication(app)}
/>
```

**Validates:** Requirements US-4


### 8. ActivityTimeline

**File:** `components/membership/ActivityTimeline.tsx`

**Purpose:** Display activity log as vertical timeline

**Props:**
```typescript
interface ActivityTimelineProps {
  activityLog: ActivityLogEntry[];
}
```

**Features:**
- Vertical timeline layout
- Icons for different action types
- Relative timestamps in Thai (e.g., "2 ชั่วโมงที่แล้ว")
- Action details and notes
- Simple and clean UI

**Example Usage:**
```tsx
import ActivityTimeline from '@/components/membership/ActivityTimeline';

const activityLog = application.activity_log as ActivityLogEntry[];

<ActivityTimeline activityLog={activityLog} />
```

**Validates:** Requirements US-8

---

## RLS Policies & Security

### Row Level Security (RLS) Policies

**Table:** `membership_applications`

#### 1. Athletes Policies

**Insert Policy: "Athletes can create applications"**
```sql
CREATE POLICY "Athletes can create applications"
ON membership_applications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```
- Athletes can only create applications for themselves
- Enforced by checking auth.uid() matches user_id

**Select Policy: "Athletes can view own applications"**
```sql
CREATE POLICY "Athletes can view own applications"
ON membership_applications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```
- Athletes can only view their own applications

#### 2. Coaches Policies

**Select Policy: "Coaches can view club applications"**
```sql
CREATE POLICY "Coaches can view club applications"
ON membership_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coaches
    WHERE coaches.user_id = auth.uid()
    AND coaches.club_id = membership_applications.club_id
  )
);
```
- Coaches can view applications for their clubs only
- Verified by checking coaches table

**Update Policy: "Coaches can review club applications"**
```sql
CREATE POLICY "Coaches can review club applications"
ON membership_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coaches
    WHERE coaches.user_id = auth.uid()
    AND coaches.club_id = membership_applications.club_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM coaches
    WHERE coaches.user_id = auth.uid()
    AND coaches.club_id = membership_applications.club_id
  )
);
```
- Coaches can update (approve/reject) applications for their clubs only

#### 3. Admins Policies

**Select Policy: "Admins can view all applications"**
```sql
CREATE POLICY "Admins can view all applications"
ON membership_applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```
- Admins can view all applications

**Update Policy: "Admins can update all applications"**
```sql
CREATE POLICY "Admins can update all applications"
ON membership_applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```
- Admins can update any application (override capability)


### Storage Policies

**Bucket:** `membership-documents`

#### 1. Upload Policy

**"Users can upload own documents"**
```sql
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'membership-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```
- Users can only upload to their own folder (userId)
- Path must start with their user ID

#### 2. View Own Documents Policy

**"Users can view own documents"**
```sql
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```
- Users can view documents in their own folder

#### 3. Coaches View Policy

**"Coaches can view club applicant documents"**
```sql
CREATE POLICY "Coaches can view club applicant documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents'
  AND EXISTS (
    SELECT 1 FROM membership_applications ma
    JOIN coaches c ON c.user_id = auth.uid()
    WHERE ma.user_id::text = (storage.foldername(name))[1]
    AND ma.club_id = c.club_id
  )
);
```
- Coaches can view documents of applicants to their clubs
- Verified by checking membership_applications and coaches tables

#### 4. Admins View Policy

**"Admins can view all documents"**
```sql
CREATE POLICY "Admins can view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-documents'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```
- Admins can view all documents in the bucket

### Security Model Summary

**Access Control Matrix:**

| Role    | Create App | View Own | View Club | View All | Update Club | Update All |
|---------|-----------|----------|-----------|----------|-------------|------------|
| Athlete | ✅        | ✅       | ❌        | ❌       | ❌          | ❌         |
| Coach   | ✅        | ✅       | ✅        | ❌       | ✅          | ❌         |
| Admin   | ✅        | ✅       | ✅        | ✅       | ✅          | ✅         |

**Document Access Matrix:**

| Role    | Upload Own | View Own | View Club Docs | View All Docs |
|---------|-----------|----------|----------------|---------------|
| Athlete | ✅        | ✅       | ❌             | ❌            |
| Coach   | ✅        | ✅       | ✅             | ❌            |
| Admin   | ✅        | ✅       | ✅             | ✅            |

**Key Security Features:**
1. All queries respect RLS policies at database level
2. Server actions verify authentication before processing
3. Storage policies prevent unauthorized document access
4. UNIQUE constraint prevents duplicate applications
5. Activity log provides complete audit trail
6. Sensitive data stored in JSONB (encrypted at rest by Supabase)

---

## Helper Functions

### Database Helper Functions

#### 1. `add_activity_log()`

**Purpose:** Add an entry to the activity_log JSONB array

**Signature:**
```sql
CREATE OR REPLACE FUNCTION add_activity_log(
  p_application_id UUID,
  p_action TEXT,
  p_by_user UUID,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void
```

**Parameters:**
- `p_application_id`: UUID of application
- `p_action`: Action type (submitted, status_changed, etc.)
- `p_by_user`: UUID of user performing action
- `p_details`: Additional details as JSONB object

**Process:**
1. Get user role from coaches/athletes/user_roles tables
2. Build log entry with timestamp, action, user, role
3. Append to activity_log JSONB array
4. Update updated_at timestamp

**Example Usage:**
```sql
SELECT add_activity_log(
  'application-uuid',
  'submitted',
  'user-uuid',
  '{"club_id": "club-uuid", "document_count": 3}'::jsonb
);
```

**Called By:**
- `submitApplication()` - Initial submission
- `update_application_status()` - Status changes
- `createAthleteProfile()` - Profile creation


#### 2. `update_application_status()`

**Purpose:** Update application status and add activity log entry

**Signature:**
```sql
CREATE OR REPLACE FUNCTION update_application_status(
  p_application_id UUID,
  p_new_status TEXT,
  p_reviewed_by UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS void
```

**Parameters:**
- `p_application_id`: UUID of application
- `p_new_status`: New status (approved, rejected, info_requested)
- `p_reviewed_by`: UUID of reviewer
- `p_notes`: Review notes or rejection reason

**Process:**
1. Get current status
2. Get reviewer role from coaches/user_roles tables
3. Update status and review_info JSONB
4. Call `add_activity_log()` to log the change
5. Update updated_at timestamp

**Example Usage:**
```sql
SELECT update_application_status(
  'application-uuid',
  'approved',
  'coach-uuid',
  'เอกสารครบถ้วน อนุมัติ'
);
```

**Called By:**
- `reviewApplication()` - Approve/reject actions

**Important Notes:**
- Automatically logs status change to activity_log
- Sets review_info with reviewer details and timestamp
- Atomic operation (all or nothing)

---

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Application Submission Fails

**Symptom:** `submitApplication()` returns error

**Possible Causes:**

**A. Duplicate Application**
```
Error: "คุณมีใบสมัครสำหรับกีฬานี้อยู่แล้ว"
```
**Solution:** Check existing applications for user+club combination
```typescript
const { data } = await supabase
  .from('membership_applications')
  .select('id, status')
  .eq('user_id', userId)
  .eq('club_id', clubId);
```

**B. Validation Error**
```
Error: "รูปแบบเบอร์โทรไม่ถูกต้อง"
```
**Solution:** Ensure phone numbers are in format 0XX-XXX-XXXX
```typescript
import { formatPhoneNumber } from '@/lib/membership/validation';
const formatted = formatPhoneNumber(phoneInput);
```

**C. Missing Documents**
```
Error: "ต้องอัปโหลดเอกสารครบทั้ง 3 ประเภท"
```
**Solution:** Verify all 3 document types are present
```typescript
const hasAllDocs = documents.length === 3 &&
  documents.some(d => d.type === 'id_card') &&
  documents.some(d => d.type === 'house_registration') &&
  documents.some(d => d.type === 'birth_certificate');
```

#### 2. Document Upload Fails

**Symptom:** `uploadDocument()` returns error

**Possible Causes:**

**A. File Too Large**
```
Error: "ขนาดไฟล์ต้องไม่เกิน 5MB"
```
**Solution:** Check file size before upload
```typescript
if (file.size > 5 * 1024 * 1024) {
  console.error('File too large:', file.size);
}
```

**B. Invalid File Type**
```
Error: "ประเภทไฟล์ต้องเป็น JPG, PNG หรือ PDF เท่านั้น"
```
**Solution:** Validate file type
```typescript
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  console.error('Invalid file type:', file.type);
}
```

**C. Storage Permission Error**
```
Error: "ไม่สามารถอัปโหลดไฟล์ได้"
```
**Solution:** Check RLS policies and authentication
```sql
-- Verify storage policies exist
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%documents%';
```


#### 3. Review Application Fails

**Symptom:** `reviewApplication()` returns error

**Possible Causes:**

**A. Permission Denied**
```
Error: "คุณไม่มีสิทธิ์ในการพิจารณาใบสมัครนี้"
```
**Solution:** Verify user is coach for the club or admin
```typescript
// Check if user is coach
const { data: coach } = await supabase
  .from('coaches')
  .select('id')
  .eq('user_id', userId)
  .eq('club_id', clubId)
  .single();

// Check if user is admin
const { data: admin } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', userId)
  .eq('role', 'admin')
  .single();
```

**B. Missing Rejection Reason**
```
Error: "กรุณาระบุเหตุผลในการปฏิเสธ"
```
**Solution:** Always provide reason when rejecting
```typescript
await reviewApplication(
  applicationId,
  'reject',
  'เอกสารไม่ชัดเจน กรุณาอัปโหลดใหม่' // Required
);
```

**C. Already Processed**
```
Error: "ใบสมัครนี้อนุมัติแล้ว"
```
**Solution:** Check application status before reviewing
```typescript
if (application.status !== 'pending' && application.status !== 'info_requested') {
  console.error('Application already processed:', application.status);
}
```

**D. Profile Creation Failed**
```
Error: "ไม่สามารถสร้างโปรไฟล์นักกีฬาได้"
```
**Solution:** Check athletes table and constraints
```sql
-- Check if profile already exists
SELECT * FROM athletes 
WHERE user_id = 'user-uuid' 
AND club_id = 'club-uuid';

-- Check for missing required fields
SELECT * FROM membership_applications 
WHERE id = 'application-uuid';
```

#### 4. Query Functions Return Empty

**Symptom:** Query functions return empty arrays

**Possible Causes:**

**A. RLS Policies Blocking Access**
**Solution:** Verify RLS policies are correctly configured
```sql
-- Check table policies
SELECT * FROM pg_policies 
WHERE tablename = 'membership_applications';

-- Test query as specific user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid';
SELECT * FROM membership_applications;
```

**B. No Data Exists**
**Solution:** Verify data exists in database
```sql
-- Check total applications
SELECT COUNT(*) FROM membership_applications;

-- Check applications by status
SELECT status, COUNT(*) 
FROM membership_applications 
GROUP BY status;
```

**C. Wrong User ID / Club ID**
**Solution:** Verify IDs are correct
```typescript
// Log IDs for debugging
console.log('User ID:', userId);
console.log('Club ID:', clubId);

// Verify user exists
const { data: user } = await supabase.auth.getUser();
console.log('Authenticated user:', user?.id);
```


#### 5. JSONB Data Not Displaying

**Symptom:** Personal info or documents not showing in UI

**Possible Causes:**

**A. Incorrect Type Casting**
**Solution:** Cast JSONB to proper TypeScript types
```typescript
// Correct way to access JSONB data
const personalInfo = application.personal_info as PersonalInfo;
const documents = application.documents as DocumentEntry[];
const activityLog = application.activity_log as ActivityLogEntry[];

// Access fields
console.log(personalInfo.full_name);
console.log(documents[0].url);
```

**B. JSONB Structure Mismatch**
**Solution:** Verify JSONB structure matches expected format
```sql
-- Check JSONB structure
SELECT 
  id,
  personal_info,
  jsonb_typeof(personal_info) as type,
  personal_info->>'full_name' as name
FROM membership_applications
WHERE id = 'application-uuid';
```

**C. Null or Empty JSONB**
**Solution:** Handle null/empty cases
```typescript
const documents = (application.documents as DocumentEntry[]) || [];
const activityLog = (application.activity_log as ActivityLogEntry[]) || [];

if (documents.length === 0) {
  console.warn('No documents found');
}
```

#### 6. Activity Log Not Updating

**Symptom:** Activity log entries not appearing

**Possible Causes:**

**A. Function Not Called**
**Solution:** Ensure `add_activity_log()` is called
```typescript
// After creating application
await supabase.rpc('add_activity_log', {
  p_application_id: applicationId,
  p_action: 'submitted',
  p_by_user: userId,
  p_details: { club_id: clubId } as any,
});
```

**B. Function Execution Failed**
**Solution:** Check function exists and has correct permissions
```sql
-- Verify function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'add_activity_log';

-- Check function permissions
SELECT has_function_privilege('add_activity_log(uuid,text,uuid,jsonb)', 'execute');
```

**C. JSONB Array Not Initialized**
**Solution:** Ensure activity_log is initialized as empty array
```sql
-- Check default value
SELECT column_default 
FROM information_schema.columns 
WHERE table_name = 'membership_applications' 
AND column_name = 'activity_log';
-- Should be: '[]'::jsonb
```

#### 7. Performance Issues

**Symptom:** Slow queries or timeouts

**Possible Causes:**

**A. Missing Indexes**
**Solution:** Verify all indexes exist
```sql
-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'membership_applications';

-- Should have 8 indexes total
```

**B. Large JSONB Arrays**
**Solution:** Limit activity log size or paginate
```typescript
// Get recent activity only
const recentActivity = activityLog.slice(0, 20);
```

**C. N+1 Query Problem**
**Solution:** Use proper joins in queries
```typescript
// Good: Single query with join
const { data } = await supabase
  .from('membership_applications')
  .select('*, clubs(name, sport_type)')
  .eq('user_id', userId);

// Bad: Multiple queries
const apps = await getApplications();
for (const app of apps) {
  const club = await getClub(app.club_id); // N+1 problem
}
```

