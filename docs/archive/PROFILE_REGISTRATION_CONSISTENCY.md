# Profile and Registration Consistency Update

## Overview
Updated the registration form (`/register-membership`) to collect all fields that are displayed in the athlete profile page (`/dashboard/athlete/profile`), ensuring data consistency throughout the application.

## Changes Made

### 1. Updated Registration Form Fields
**File:** `components/membership/PersonalInfoForm.tsx`

Added required fields to match athlete profile:
- ✅ **Nickname** - Optional field for athlete's nickname
- ✅ **Gender** - Required dropdown (male/female/other)
- ✅ **Date of Birth** - Changed from optional to required

Moved fields to appropriate sections:
- Date of Birth moved from "Optional" to main required section
- Blood Type and Medical Conditions remain optional

### 2. Updated Validation Schema
**File:** `lib/membership/validation.ts`

Updated `personalInfoSchema` to include:
```typescript
{
  full_name: string (required, 2-100 chars)
  nickname: string (optional)
  gender: 'male' | 'female' | 'other' (required)
  date_of_birth: string (required, age 5-100)
  phone_number: string (required, format: 0XX-XXX-XXXX)
  address: string (required, 10-500 chars)
  emergency_contact: string (required, format: 0XX-XXX-XXXX)
  blood_type: string (optional)
  medical_conditions: string (optional)
}
```

### 3. Updated Type Definitions
**File:** `types/database.types.ts`

Updated `PersonalInfo` interface:
```typescript
export interface PersonalInfo {
  full_name: string;
  nickname?: string;           // NEW
  gender: 'male' | 'female' | 'other';  // NEW (required)
  date_of_birth: string;       // Changed from optional to required
  phone_number: string;
  address: string;
  emergency_contact: string;
  blood_type?: string;
  medical_conditions?: string;
}
```

### 4. Updated Profile Creation Logic
**File:** `lib/membership/actions.ts`

Enhanced `createAthleteProfile()` function:
- Added validation for required `gender` field
- Added validation for required `date_of_birth` field
- Now uses `nickname` from registration data
- Now uses `gender` from registration data (no more hardcoded 'other')
- Now uses actual `date_of_birth` (no more default '2000-01-01')

## Field Mapping

### Registration Form → Athletes Table

| Registration Field | Athletes Table Field | Notes |
|-------------------|---------------------|-------|
| `full_name` | `first_name` + `last_name` | Auto-split by space |
| `nickname` | `nickname` | Optional |
| `gender` | `gender` | Required: male/female/other |
| `date_of_birth` | `date_of_birth` | Required, validated age 5-100 |
| `phone_number` | `phone_number` | Required, format validated |
| `email` (from auth) | `email` | From Supabase Auth |
| `medical_conditions` | `health_notes` | Optional |
| N/A | `profile_picture_url` | Can be added later via profile edit |

### Fields NOT in Athletes Table
These fields are stored in `membership_applications.personal_info` JSONB:
- `address` - Stored for reference but not in athletes table
- `emergency_contact` - Stored for reference but not in athletes table
- `blood_type` - Stored for reference but not in athletes table

## Profile Display Consistency

### Before Changes
- ❌ Profile showed fields that weren't collected during registration
- ❌ Gender was hardcoded to 'other'
- ❌ Date of birth defaulted to '2000-01-01'
- ❌ Nickname was always null

### After Changes
- ✅ All profile fields are collected during registration
- ✅ Gender is properly collected and stored
- ✅ Date of birth is validated and required
- ✅ Nickname can be provided during registration
- ✅ Profile page shows accurate data from registration

## User Experience Improvements

1. **Complete Data Collection**: Users provide all necessary information upfront
2. **No Surprises**: Profile page shows exactly what was entered during registration
3. **Better Validation**: Age validation ensures realistic birth dates
4. **Gender Accuracy**: No more default 'other' gender
5. **Nickname Support**: Athletes can provide their preferred nickname immediately

## Testing Checklist

- [ ] Register new user with all fields filled
- [ ] Verify gender dropdown works correctly
- [ ] Verify date of birth validation (age 5-100)
- [ ] Verify nickname is optional
- [ ] Submit application and get it approved
- [ ] Check athlete profile page shows correct data
- [ ] Verify first_name and last_name are split correctly
- [ ] Verify health_notes contains medical_conditions data
- [ ] Edit profile and verify nickname can be changed
- [ ] Verify read-only fields (name, email, DOB, gender, club) cannot be edited

## Database Schema

No database changes required. The `athletes` table already has all necessary fields:
- `first_name` (text)
- `last_name` (text)
- `nickname` (text, nullable)
- `date_of_birth` (date)
- `gender` (text)
- `phone_number` (text)
- `email` (text)
- `health_notes` (text, nullable)
- `profile_picture_url` (text, nullable)

## Related Files

### Modified Files
1. `components/membership/PersonalInfoForm.tsx` - Added nickname, gender, moved DOB
2. `lib/membership/validation.ts` - Updated schema with new required fields
3. `types/database.types.ts` - Updated PersonalInfo interface
4. `lib/membership/actions.ts` - Enhanced createAthleteProfile validation

### Unchanged Files (Already Consistent)
1. `app/dashboard/athlete/profile/page.tsx` - Profile display page
2. `components/athlete/ProfileEditForm.tsx` - Profile edit form
3. `app/register-membership/page.tsx` - Registration page wrapper
4. `components/membership/RegistrationForm.tsx` - Multi-step form wrapper

## Notes

- The `full_name` field is still used in registration for simplicity
- Name splitting logic: first word = first_name, rest = last_name
- If only one word provided, both first_name and last_name get the same value
- Profile edit form keeps name, email, DOB, gender, and club as read-only
- Only nickname, phone, and health_notes can be edited after profile creation
