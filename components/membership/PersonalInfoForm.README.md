# PersonalInfoForm Component

## Overview

A comprehensive form component for collecting personal information during membership registration. Features real-time validation, auto-formatting for phone numbers, and responsive design.

## Features

- ✅ Real-time validation with Zod schema
- ✅ Auto-format phone numbers (0XX-XXX-XXXX)
- ✅ Thai error messages
- ✅ Responsive layout
- ✅ Required and optional fields
- ✅ Accessible form controls
- ✅ Touch-based validation (validates on blur)

## Usage

```tsx
import PersonalInfoForm from '@/components/membership/PersonalInfoForm';
import { useState } from 'react';
import type { PersonalInfoInput } from '@/lib/membership/validation';

function MyComponent() {
  const [formData, setFormData] = useState<PersonalInfoInput>({
    full_name: '',
    phone_number: '',
    address: '',
    emergency_contact: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <PersonalInfoForm
      value={formData}
      onChange={setFormData}
      errors={errors}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `value` | `PersonalInfoInput` | Yes | Current form data |
| `onChange` | `(value: PersonalInfoInput) => void` | Yes | Callback when form data changes |
| `errors` | `Record<string, string>` | No | External validation errors to display |

## Form Fields

### Required Fields
- **ชื่อ-นามสกุล** (full_name): 2-100 characters
- **เบอร์โทรศัพท์** (phone_number): Format 0XX-XXX-XXXX
- **ที่อยู่** (address): 10-500 characters
- **เบอร์โทรฉุกเฉิน** (emergency_contact): Format 0XX-XXX-XXXX

### Optional Fields
- **วันเกิด** (date_of_birth): Date picker
- **กรุ๊ปเลือด** (blood_type): Text input (max 3 chars)
- **โรคประจำตัว / ข้อมูลสุขภาพ** (medical_conditions): Textarea

## Validation

The component uses the `personalInfoSchema` from `@/lib/membership/validation`:

- Phone numbers are validated against regex: `/^0[0-9]{2}-[0-9]{3}-[0-9]{4}$/`
- Auto-formatting applies as user types
- Validation triggers on blur (after field is touched)
- Real-time error messages in Thai

## Auto-Formatting

Phone number fields automatically format input:
- Input: `0812345678` → Output: `081-234-5678`
- Input: `081-234-5678` → Output: `081-234-5678` (no change)

## Accessibility

- All fields have proper labels
- Required fields marked with red asterisk
- Error messages linked to inputs via `aria-invalid`
- Keyboard navigation supported
- Screen reader friendly

## Styling

- Uses Tailwind CSS for styling
- Responsive design (mobile-first)
- Consistent with existing UI components
- Error states with red borders and text
- Optional fields grouped in gray section

## Testing

Test the component at: `/test-personal-info-form`

## Requirements Validation

This component validates the following requirements:
- **US-1.1**: Form fields for personal information
- **US-1.4**: Data validation before submission
- **NFR-7**: Responsive design on mobile
- **NFR-8**: Clear error messages in Thai

## Example: Full Integration

```tsx
'use client';

import { useState } from 'react';
import PersonalInfoForm from '@/components/membership/PersonalInfoForm';
import { Button } from '@/components/ui/button';
import { personalInfoSchema, type PersonalInfoInput } from '@/lib/membership/validation';

export default function RegistrationPage() {
  const [formData, setFormData] = useState<PersonalInfoInput>({
    full_name: '',
    phone_number: '',
    address: '',
    emergency_contact: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = () => {
    try {
      // Validate entire form
      personalInfoSchema.parse(formData);
      setErrors({});
      
      // Proceed to next step
      console.log('Valid data:', formData);
    } catch (error: any) {
      // Extract validation errors
      const validationErrors: Record<string, string> = {};
      error.issues?.forEach((issue: any) => {
        const field = issue.path[0];
        validationErrors[field] = issue.message;
      });
      setErrors(validationErrors);
    }
  };

  return (
    <div>
      <PersonalInfoForm
        value={formData}
        onChange={setFormData}
        errors={errors}
      />
      <Button onClick={handleSubmit}>Next Step</Button>
    </div>
  );
}
```

## Notes

- Component is controlled - parent manages state
- Validation is progressive (only after field is touched)
- Phone formatting happens automatically on change
- Optional fields are clearly separated visually
- All error messages are in Thai language
