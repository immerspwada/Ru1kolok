# Input Validation and Sanitization Guide

## Overview

This document describes the comprehensive input validation and sanitization system implemented for the Sports Club Management System to prevent XSS attacks, SQL injection, and ensure data integrity.

**Requirement**: 9.2 - Input validation and sanitization

## Architecture

### Core Modules

1. **Sanitization** (`lib/utils/sanitization.ts`)
   - HTML sanitization to prevent XSS
   - Text escaping
   - SQL input sanitization
   - File name sanitization
   - URL sanitization
   - Phone number and email sanitization

2. **Enhanced Validation** (`lib/utils/enhanced-validation.ts`)
   - Field validation (required, length, format)
   - Email and phone validation
   - Date and time validation
   - Numeric range validation
   - UUID validation
   - Enum validation
   - Batch validation

3. **File Validation** (`lib/utils/file-validation.ts`)
   - File type validation (MIME type and extension)
   - File size validation
   - Magic number (file signature) validation
   - Image dimension validation
   - Multiple file validation

4. **API Validation** (`lib/utils/api-validation.ts`)
   - Request body validation with Zod schemas
   - Query parameter validation
   - Header validation
   - Rate limiting
   - Content type validation
   - Method validation

## Usage Examples

### 1. Sanitizing User Input

```typescript
import { sanitizeInput, sanitizeHtml, sanitizeEmail } from '@/lib/utils/sanitization';

// Basic text sanitization
const cleanName = sanitizeInput(userInput);

// HTML content sanitization (for rich text)
const cleanHtml = sanitizeHtml(userHtmlContent);

// Email sanitization
const cleanEmail = sanitizeEmail(userEmail);
```

### 2. Validating Form Data

```typescript
import { 
  validateRequired, 
  validateLength, 
  validateEmailFormat,
  batchValidate 
} from '@/lib/utils/enhanced-validation';

// Single field validation
const nameError = validateRequired(name, 'ชื่อ') || 
                  validateLength(name, 2, 100, 'ชื่อ');

if (nameError) {
  return { error: nameError.message };
}

// Batch validation
const result = batchValidate([
  () => validateRequired(email, 'อีเมล'),
  () => validateEmailFormat(email),
  () => validateRequired(phone, 'เบอร์โทรศัพท์'),
  () => validatePhoneFormat(phone),
]);

if (!result.isValid) {
  return { errors: result.errors };
}
```

### 3. Validating File Uploads

```typescript
import { validateFile, ALLOWED_MEMBERSHIP_TYPES } from '@/lib/utils/file-validation';

// Validate single file
const result = await validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ALLOWED_MEMBERSHIP_TYPES,
  checkMagicNumbers: true,
});

if (!result.isValid) {
  return { errors: result.errors };
}

// Use sanitized file name
const safeFileName = result.sanitizedFileName;
```

### 4. Server Action Validation

```typescript
'use server';

import { sanitizeInput, sanitizeHtml } from '@/lib/utils/sanitization';
import { validateRequired, validateLength } from '@/lib/utils/enhanced-validation';

export async function createAnnouncement(input: CreateAnnouncementInput) {
  // Validate
  const titleError = validateRequired(input.title, 'หัวข้อ') || 
                     validateLength(input.title, 3, 200, 'หัวข้อ');
  if (titleError) {
    return { success: false, error: titleError.message };
  }

  // Sanitize
  const sanitizedTitle = sanitizeInput(input.title);
  const sanitizedMessage = sanitizeHtml(input.message);

  // Use sanitized data in database operations
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: sanitizedTitle,
      message: sanitizedMessage,
    });

  return { success: true, data };
}
```

### 5. API Route Validation

```typescript
import { NextRequest } from 'next/server';
import { validateRequestBody, validateMethod } from '@/lib/utils/api-validation';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  // Validate method
  const methodCheck = validateMethod(request, ['POST']);
  if (!methodCheck.success) {
    return methodCheck.response;
  }

  // Validate and sanitize body
  const bodyResult = await validateRequestBody(request, schema);
  if (!bodyResult.success) {
    return bodyResult.response;
  }

  const { title, message } = bodyResult.data;
  
  // Process validated and sanitized data
  // ...
}
```

## Security Features

### XSS Prevention

1. **HTML Sanitization**
   - Removes `<script>` tags
   - Removes event handlers (onclick, onerror, etc.)
   - Removes dangerous protocols (javascript:, data:)
   - Removes iframe, object, embed tags
   - Removes style tags

2. **Text Escaping**
   - Escapes HTML special characters: `& < > " ' /`
   - Prevents injection of HTML entities

### SQL Injection Prevention

1. **Input Sanitization**
   - Removes SQL comment markers (-- /* */)
   - Removes statement terminators (;)
   - Removes dangerous SQL keywords

2. **Parameterized Queries**
   - Always use Supabase's parameterized queries
   - Never concatenate user input into SQL strings

### File Upload Security

1. **Type Validation**
   - MIME type checking
   - File extension validation
   - Magic number (file signature) verification

2. **Size Validation**
   - Maximum file size limits
   - Total upload size limits

3. **Name Sanitization**
   - Removes path separators (/ \)
   - Removes dangerous characters
   - Prevents directory traversal attacks

## Validation Rules

### Text Fields

| Field Type | Min Length | Max Length | Additional Rules |
|------------|------------|------------|------------------|
| Name | 2 | 100 | No special characters |
| Email | 5 | 255 | Valid email format |
| Phone | 10 | 15 | Thai or international format |
| Title | 3 | 200 | Required |
| Description | 0 | 1000 | Optional |
| Message | 10 | 5000 | Required |
| Address | 10 | 500 | Required |

### Numeric Fields

| Field Type | Min | Max | Additional Rules |
|------------|-----|-----|------------------|
| Age | 5 | 100 | Calculated from DOB |
| Score | 0 | 999999 | Positive number |
| File Size | 0 | 10MB | Depends on type |

### Date/Time Fields

| Field Type | Min | Max | Additional Rules |
|------------|-----|-----|------------------|
| Date of Birth | 100 years ago | Today | Valid date |
| Session Date | Today | No limit | Future dates only |
| Start Time | 00:00 | 23:59 | HH:MM format |
| End Time | Start Time + 1 min | 23:59 | After start time |

### File Uploads

| Document Type | Max Size | Allowed Types | Magic Number Check |
|---------------|----------|---------------|-------------------|
| Images | 5MB | JPG, PNG | Yes |
| PDFs | 10MB | PDF | Yes |
| Profile Pictures | 5MB | JPG, PNG | Yes |
| Membership Docs | 5MB | JPG, PNG, PDF | Yes |

## Best Practices

### 1. Always Validate Before Sanitize

```typescript
// ✅ Good
const error = validateEmail(email);
if (error) return { error: error.message };
const cleanEmail = sanitizeEmail(email);

// ❌ Bad
const cleanEmail = sanitizeEmail(email);
// No validation!
```

### 2. Sanitize Before Database Operations

```typescript
// ✅ Good
const cleanTitle = sanitizeInput(title);
await supabase.from('posts').insert({ title: cleanTitle });

// ❌ Bad
await supabase.from('posts').insert({ title }); // Unsanitized!
```

### 3. Use Appropriate Sanitization

```typescript
// ✅ Good - HTML content
const cleanHtml = sanitizeHtml(richTextContent);

// ✅ Good - Plain text
const cleanText = sanitizeInput(plainText);

// ❌ Bad - Over-sanitizing
const cleanText = sanitizeHtml(plainText); // Unnecessary
```

### 4. Validate File Uploads

```typescript
// ✅ Good
const result = await validateFile(file, {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ALLOWED_IMAGE_TYPES,
  checkMagicNumbers: true,
});

// ❌ Bad
if (file.size > 5000000) { // Incomplete validation
  return { error: 'File too large' };
}
```

### 5. Handle Validation Errors Gracefully

```typescript
// ✅ Good
const result = batchValidate([...validators]);
if (!result.isValid) {
  return {
    success: false,
    errors: result.errors.map(e => ({
      field: e.field,
      message: e.message,
    })),
  };
}

// ❌ Bad
if (!email) throw new Error('Email required'); // Crashes
```

## Testing

### Unit Tests

Test validation functions with various inputs:

```typescript
describe('validateEmail', () => {
  it('should accept valid emails', () => {
    const result = validateEmailFormat('user@example.com');
    expect(result).toBeNull();
  });

  it('should reject invalid emails', () => {
    const result = validateEmailFormat('invalid-email');
    expect(result).not.toBeNull();
    expect(result?.code).toBe('INVALID_EMAIL');
  });
});
```

### Integration Tests

Test complete validation flows:

```typescript
describe('createAnnouncement', () => {
  it('should sanitize and validate input', async () => {
    const result = await createAnnouncement({
      title: '<script>alert("xss")</script>Test',
      message: 'Valid message',
    });

    expect(result.success).toBe(true);
    expect(result.data.title).not.toContain('<script>');
  });
});
```

## Maintenance

### Adding New Validation Rules

1. Add validation function to `enhanced-validation.ts`
2. Add tests for the new validation
3. Update this documentation
4. Apply to relevant forms and actions

### Adding New Sanitization Rules

1. Add sanitization function to `sanitization.ts`
2. Add tests for the new sanitization
3. Update this documentation
4. Apply to relevant data flows

## References

- OWASP XSS Prevention Cheat Sheet
- OWASP Input Validation Cheat Sheet
- OWASP File Upload Cheat Sheet
- Supabase Security Best Practices

## Checklist for New Features

When implementing new features, ensure:

- [ ] All user inputs are validated
- [ ] All text inputs are sanitized
- [ ] File uploads are validated (type, size, content)
- [ ] Email addresses are validated and sanitized
- [ ] Phone numbers are validated and sanitized
- [ ] Dates and times are validated
- [ ] Numeric inputs are range-checked
- [ ] HTML content is sanitized
- [ ] URLs are validated and sanitized
- [ ] Error messages are user-friendly
- [ ] Validation errors are logged
- [ ] Tests cover validation logic
