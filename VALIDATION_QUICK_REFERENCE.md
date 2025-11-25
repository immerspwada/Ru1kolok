# Validation & Sanitization Quick Reference

## Quick Import Guide

```typescript
// Sanitization
import { 
  sanitizeInput,      // For plain text
  sanitizeHtml,       // For HTML content
  sanitizeEmail,      // For emails
  sanitizePhoneNumber // For phone numbers
} from '@/lib/utils/sanitization';

// Validation
import { 
  validateRequired,
  validateLength,
  validateEmailFormat,
  validatePhoneFormat,
  validateDateRange,
  validateTimeRange,
  batchValidate
} from '@/lib/utils/enhanced-validation';

// File Validation
import { 
  validateFile,
  ALLOWED_MEMBERSHIP_TYPES,
  DEFAULT_MAX_FILE_SIZE
} from '@/lib/utils/file-validation';
```

## Common Patterns

### 1. Validate & Sanitize Text Input

```typescript
// Validate
const error = validateRequired(input, 'ชื่อ') || 
              validateLength(input, 2, 100, 'ชื่อ');
if (error) return { error: error.message };

// Sanitize
const clean = sanitizeInput(input);
```

### 2. Validate & Sanitize HTML Content

```typescript
// Validate
const error = validateRequired(content, 'เนื้อหา') || 
              validateLength(content, 10, 5000, 'เนื้อหา');
if (error) return { error: error.message };

// Sanitize (removes dangerous HTML)
const clean = sanitizeHtml(content);
```

### 3. Validate Email

```typescript
const error = validateRequired(email, 'อีเมล') || 
              validateEmailFormat(email);
if (error) return { error: error.message };

const clean = sanitizeEmail(email);
```

### 4. Validate Phone Number

```typescript
const error = validateRequired(phone, 'เบอร์โทร') || 
              validatePhoneFormat(phone);
if (error) return { error: error.message };

const clean = sanitizePhoneNumber(phone);
```

### 5. Validate Date Range

```typescript
const today = new Date();
const error = validateDateRange(date, today, undefined, 'วันที่');
if (error) return { error: error.message };
```

### 6. Validate Time Range

```typescript
const error = validateTimeRange(startTime, endTime);
if (error) return { error: error.message };
```

### 7. Validate File Upload

```typescript
const result = await validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ALLOWED_MEMBERSHIP_TYPES,
  checkMagicNumbers: true,
});

if (!result.isValid) {
  return { errors: result.errors };
}

// Use sanitized file name
const safeName = result.sanitizedFileName;
```

### 8. Batch Validation

```typescript
const result = batchValidate([
  () => validateRequired(name, 'ชื่อ'),
  () => validateLength(name, 2, 100, 'ชื่อ'),
  () => validateRequired(email, 'อีเมล'),
  () => validateEmailFormat(email),
]);

if (!result.isValid) {
  return { errors: result.errors };
}
```

## Validation Rules Reference

### Text Fields

| Field | Min | Max | Validation |
|-------|-----|-----|------------|
| Name | 2 | 100 | Required, sanitize |
| Title | 3 | 200 | Required, sanitize |
| Description | 0 | 1000 | Optional, sanitize |
| Message | 10 | 5000 | Required, sanitize HTML |
| Location | 2 | 200 | Required, sanitize |
| Address | 10 | 500 | Required, sanitize |

### Contact Fields

| Field | Format | Validation |
|-------|--------|------------|
| Email | user@domain.com | Email format, sanitize |
| Phone (Thai) | 0812345678 | 10 digits starting with 0 |
| Phone (Intl) | +66812345678 | +[country][number] |

### Date/Time Fields

| Field | Rule | Validation |
|-------|------|------------|
| Date of Birth | 5-100 years ago | Age range |
| Session Date | Today or future | Not in past |
| Start Time | HH:MM | Valid time format |
| End Time | > Start Time | After start time |

### File Uploads

| Type | Max Size | Allowed Types |
|------|----------|---------------|
| Images | 5MB | JPG, PNG |
| PDFs | 10MB | PDF |
| Membership Docs | 5MB | JPG, PNG, PDF |

## Error Handling

```typescript
// Single error
if (error) {
  return { 
    success: false, 
    error: error.message 
  };
}

// Multiple errors
if (!result.isValid) {
  return { 
    success: false, 
    errors: result.errors.map(e => ({
      field: e.field,
      message: e.message,
    }))
  };
}
```

## Server Action Template

```typescript
'use server';

import { sanitizeInput, sanitizeHtml } from '@/lib/utils/sanitization';
import { validateRequired, validateLength } from '@/lib/utils/enhanced-validation';

export async function myAction(input: MyInput) {
  // 1. Validate all inputs
  const titleError = validateRequired(input.title, 'หัวข้อ') || 
                     validateLength(input.title, 3, 200, 'หัวข้อ');
  if (titleError) {
    return { success: false, error: titleError.message };
  }

  // 2. Sanitize all inputs
  const sanitizedTitle = sanitizeInput(input.title);
  const sanitizedContent = sanitizeHtml(input.content);

  // 3. Use sanitized data in database operations
  const { data, error } = await supabase
    .from('table')
    .insert({
      title: sanitizedTitle,
      content: sanitizedContent,
    });

  if (error) {
    return { success: false, error: 'Database error' };
  }

  return { success: true, data };
}
```

## API Route Template

```typescript
import { NextRequest } from 'next/server';
import { validateRequestBody, validateMethod } from '@/lib/utils/api-validation';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
});

export async function POST(request: NextRequest) {
  // 1. Validate method
  const methodCheck = validateMethod(request, ['POST']);
  if (!methodCheck.success) return methodCheck.response;

  // 2. Validate and sanitize body
  const bodyResult = await validateRequestBody(request, schema);
  if (!bodyResult.success) return bodyResult.response;

  // 3. Use validated data
  const { title, content } = bodyResult.data;
  
  // Process...
  
  return NextResponse.json({ success: true });
}
```

## Common Mistakes to Avoid

❌ **Don't**: Use unsanitized input
```typescript
await supabase.from('posts').insert({ title: userInput });
```

✅ **Do**: Sanitize before using
```typescript
const clean = sanitizeInput(userInput);
await supabase.from('posts').insert({ title: clean });
```

❌ **Don't**: Skip validation
```typescript
const clean = sanitizeInput(input);
await supabase.from('posts').insert({ title: clean });
```

✅ **Do**: Validate then sanitize
```typescript
const error = validateLength(input, 3, 200, 'Title');
if (error) return { error: error.message };
const clean = sanitizeInput(input);
await supabase.from('posts').insert({ title: clean });
```

❌ **Don't**: Use wrong sanitization
```typescript
const clean = sanitizeHtml(plainText); // Over-sanitizing
```

✅ **Do**: Use appropriate sanitization
```typescript
const clean = sanitizeInput(plainText); // For plain text
const cleanHtml = sanitizeHtml(richText); // For HTML content
```

## Testing

```typescript
import { validateEmail, sanitizeInput } from '@/lib/utils/...';

describe('Validation', () => {
  it('should validate email', () => {
    const error = validateEmailFormat('test@example.com');
    expect(error).toBeNull();
  });

  it('should sanitize input', () => {
    const clean = sanitizeInput('<script>alert("xss")</script>');
    expect(clean).not.toContain('<script>');
  });
});
```

## Need Help?

- See full documentation: `docs/INPUT_VALIDATION_SANITIZATION.md`
- See implementation summary: `VALIDATION_IMPLEMENTATION_SUMMARY.md`
- Check examples in: `lib/coach/announcement-actions.ts`
