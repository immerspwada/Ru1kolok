# Idempotency System Documentation

## Overview

The idempotency system prevents duplicate operations when clients retry failed requests. This is critical for mutation operations (POST, PUT, DELETE) to ensure that network failures or timeouts don't result in duplicate data.

**Requirements**: 20.6, 20.7

## Architecture

### Database Table

The `idempotency_keys` table stores request results keyed by:
- `key`: Client-provided unique identifier (UUID or alphanumeric string)
- `user_id`: Authenticated user making the request
- `endpoint`: API endpoint being called

**Composite Primary Key**: `(key, user_id, endpoint)` ensures uniqueness per user+endpoint+key combination.

### Key Components

1. **Database Table** (`idempotency_keys`)
   - Stores cached responses for duplicate detection
   - Automatic cleanup after 24 hours
   - RLS policies for security

2. **Core Utility** (`lib/utils/idempotency.ts`)
   - `handleIdempotentRequest()`: Main handler for idempotent operations
   - `extractIdempotencyKey()`: Extract key from request headers
   - `isValidIdempotencyKey()`: Validate key format
   - `generateIdempotencyKey()`: Generate UUID for clients
   - `cleanupOldIdempotencyKeys()`: Remove expired keys

3. **Middleware** (`lib/utils/idempotency-middleware.ts`)
   - `withIdempotency()`: Wrapper for Next.js API routes
   - `createIdempotentResponse()`: Helper for consistent responses
   - `createErrorResponse()`: Helper for error responses

4. **API Routes**
   - `/api/membership/apply`: Membership application submission
   - `/api/coach/sessions`: Training session creation
   - `/api/athlete/check-in`: Attendance check-in
   - `/api/athlete/leave-request`: Leave request submission

## Usage

### Client-Side

Clients should generate and send an `Idempotency-Key` header with mutation requests:

```typescript
// Generate idempotency key
const idempotencyKey = crypto.randomUUID();

// Send request with idempotency key
const response = await fetch('/api/membership/apply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': idempotencyKey,
  },
  body: JSON.stringify(applicationData),
});

// Check if response was cached
const cached = response.headers.get('X-Idempotency-Cached') === 'true';
if (cached) {
  const originalTimestamp = response.headers.get('X-Original-Timestamp');
  console.log('Duplicate request detected, returning cached response from:', originalTimestamp);
}
```

### Server-Side API Routes

API routes use the idempotency utilities to handle duplicate requests:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { 
  handleIdempotentRequest, 
  extractIdempotencyKey, 
  isValidIdempotencyKey 
} from '@/lib/utils/idempotency';

export async function POST(request: NextRequest) {
  // Get authenticated user
  const user = await getAuthenticatedUser(request);
  
  // Extract idempotency key
  const idempotencyKey = extractIdempotencyKey(request.headers);
  
  if (idempotencyKey) {
    // Validate key format
    if (!isValidIdempotencyKey(idempotencyKey)) {
      return NextResponse.json({ error: 'Invalid idempotency key' }, { status: 400 });
    }
    
    // Handle with idempotency
    const result = await handleIdempotentRequest(
      idempotencyKey,
      user.id,
      '/api/your-endpoint',
      async () => {
        // Your operation logic here
        return await performOperation(data);
      }
    );
    
    // Return response with headers
    return NextResponse.json(result, {
      headers: {
        'X-Request-Id': result.metadata?.requestId || '',
        'X-Idempotency-Cached': result.metadata?.cached ? 'true' : 'false',
      }
    });
  }
  
  // No idempotency key, execute normally
  return await performOperation(data);
}
```

## Idempotency Key Format

Valid idempotency keys must be:
- **UUID v4**: `550e8400-e29b-41d4-a716-446655440000`
- **Alphanumeric string**: 16-255 characters, containing `[a-zA-Z0-9_-]`

Examples:
```
✅ Valid: 550e8400-e29b-41d4-a716-446655440000
✅ Valid: user_123_application_2024_abc123
✅ Valid: req-1234567890abcdef
❌ Invalid: short
❌ Invalid: contains spaces
❌ Invalid: special@chars!
```

## Response Format

### Successful Response (First Request)

```json
{
  "success": true,
  "data": {
    "applicationId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "metadata": {
    "cached": false,
    "timestamp": "2025-11-27T10:30:00.000Z",
    "requestId": "req-123456"
  }
}
```

### Successful Response (Duplicate Request)

```json
{
  "success": true,
  "data": {
    "applicationId": "550e8400-e29b-41d4-a716-446655440000"
  },
  "metadata": {
    "cached": true,
    "originalTimestamp": "2025-11-27T10:30:00.000Z",
    "timestamp": "2025-11-27T10:30:05.000Z",
    "requestId": "req-789012"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data"
  },
  "metadata": {
    "timestamp": "2025-11-27T10:30:00.000Z",
    "requestId": "req-123456"
  }
}
```

## Response Headers

- `X-Request-Id`: Unique identifier for this request
- `X-Idempotency-Cached`: `true` if response was cached, `false` otherwise
- `X-Original-Timestamp`: Timestamp of original request (only for cached responses)

## Race Condition Handling

The system handles concurrent requests with the same idempotency key:

1. **First Request**: Executes operation and stores result
2. **Concurrent Request**: Attempts to insert, gets unique constraint violation
3. **Fallback**: Fetches the result inserted by the first request
4. **Response**: Returns the cached result

This ensures that even if two requests arrive simultaneously, only one operation executes and both requests receive the same response.

## Cleanup

Old idempotency keys (older than 24 hours) are automatically cleaned up:

```sql
-- Manual cleanup (if needed)
SELECT cleanup_old_idempotency_keys();
```

For automated cleanup, set up a cron job or scheduled task:

```typescript
// Run daily cleanup
import { cleanupOldIdempotencyKeys } from '@/lib/utils/idempotency';

async function dailyCleanup() {
  const deletedCount = await cleanupOldIdempotencyKeys();
  console.log(`Cleaned up ${deletedCount} old idempotency keys`);
}
```

## Security

### Row Level Security (RLS)

The `idempotency_keys` table has RLS policies:

1. **Users can view their own keys**: `users_own_idempotency_keys`
2. **Service role can insert keys**: `service_role_insert_idempotency_keys`
3. **Admins can view all keys**: `admins_view_all_idempotency_keys`

### Key Isolation

Keys are isolated by:
- **User ID**: Different users can use the same key
- **Endpoint**: Same key can be used for different endpoints
- **Composite Primary Key**: Ensures uniqueness per (key, user_id, endpoint)

## Critical Endpoints with Idempotency

### 1. Membership Application Submission

**Endpoint**: `POST /api/membership/apply`

**Why**: Prevents duplicate applications when network fails during submission.

**Usage**:
```typescript
const response = await fetch('/api/membership/apply', {
  method: 'POST',
  headers: {
    'Idempotency-Key': crypto.randomUUID(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    club_id: 'club-uuid',
    personal_info: { /* ... */ },
    documents: [ /* ... */ ],
  }),
});
```

### 2. Training Session Creation

**Endpoint**: `POST /api/coach/sessions`

**Why**: Prevents duplicate sessions when coach retries after timeout.

**Usage**:
```typescript
const response = await fetch('/api/coach/sessions', {
  method: 'POST',
  headers: {
    'Idempotency-Key': crypto.randomUUID(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Morning Practice',
    session_date: '2025-12-01',
    start_time: '09:00',
    end_time: '11:00',
    location: 'Main Field',
  }),
});
```

### 3. Attendance Check-in

**Endpoint**: `POST /api/athlete/check-in`

**Why**: Prevents duplicate check-ins when athlete retries.

**Usage**:
```typescript
const response = await fetch('/api/athlete/check-in', {
  method: 'POST',
  headers: {
    'Idempotency-Key': crypto.randomUUID(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: 'session-uuid',
    method: 'qr',
  }),
});
```

### 4. Leave Request Submission

**Endpoint**: `POST /api/athlete/leave-request`

**Why**: Prevents duplicate leave requests when network fails.

**Usage**:
```typescript
const response = await fetch('/api/athlete/leave-request', {
  method: 'POST',
  headers: {
    'Idempotency-Key': crypto.randomUUID(),
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    sessionId: 'session-uuid',
    reason: 'Family emergency - need to attend to urgent matter',
  }),
});
```

## Best Practices

### 1. Always Use Idempotency Keys for Mutations

```typescript
// ✅ Good: Use idempotency key for mutations
const key = crypto.randomUUID();
await fetch('/api/mutation', {
  method: 'POST',
  headers: { 'Idempotency-Key': key },
  body: JSON.stringify(data),
});

// ❌ Bad: No idempotency key for mutation
await fetch('/api/mutation', {
  method: 'POST',
  body: JSON.stringify(data),
});
```

### 2. Store Keys Client-Side for Retries

```typescript
// Store key before request
const key = crypto.randomUUID();
localStorage.setItem('pending-application-key', key);

try {
  const response = await fetch('/api/membership/apply', {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
    body: JSON.stringify(data),
  });
  
  // Success - remove stored key
  localStorage.removeItem('pending-application-key');
} catch (error) {
  // Failure - key remains for retry
  console.error('Request failed, can retry with same key');
}
```

### 3. Generate New Keys for New Operations

```typescript
// ✅ Good: New key for each distinct operation
const key1 = crypto.randomUUID();
await submitApplication(data1, key1);

const key2 = crypto.randomUUID();
await submitApplication(data2, key2);

// ❌ Bad: Reusing key for different operations
const key = crypto.randomUUID();
await submitApplication(data1, key);
await submitApplication(data2, key); // Will return cached result from data1!
```

### 4. Check Cached Flag in Response

```typescript
const response = await fetch('/api/mutation', {
  method: 'POST',
  headers: { 'Idempotency-Key': key },
  body: JSON.stringify(data),
});

const result = await response.json();

if (result.metadata?.cached) {
  console.log('This was a duplicate request');
  console.log('Original request was at:', result.metadata.originalTimestamp);
} else {
  console.log('This was a new request');
}
```

## Troubleshooting

### Issue: "Invalid idempotency key" error

**Cause**: Key doesn't match required format (UUID or alphanumeric 16-255 chars)

**Solution**: Use `crypto.randomUUID()` or ensure custom keys match format

### Issue: Getting cached response for new operation

**Cause**: Reusing the same idempotency key for different operations

**Solution**: Generate a new key for each distinct operation

### Issue: Idempotency not working

**Cause**: Missing `Idempotency-Key` header or authentication

**Solution**: Ensure header is set and user is authenticated

### Issue: Old keys not being cleaned up

**Cause**: Cleanup function not running

**Solution**: Set up cron job to call `cleanupOldIdempotencyKeys()` daily

## Testing

### Unit Tests

```typescript
import { isValidIdempotencyKey, generateIdempotencyKey } from '@/lib/utils/idempotency';

describe('Idempotency Key Validation', () => {
  it('accepts valid UUID', () => {
    const key = '550e8400-e29b-41d4-a716-446655440000';
    expect(isValidIdempotencyKey(key)).toBe(true);
  });
  
  it('accepts valid alphanumeric string', () => {
    const key = 'user_123_application_2024';
    expect(isValidIdempotencyKey(key)).toBe(true);
  });
  
  it('rejects short strings', () => {
    const key = 'short';
    expect(isValidIdempotencyKey(key)).toBe(false);
  });
  
  it('generates valid keys', () => {
    const key = generateIdempotencyKey();
    expect(isValidIdempotencyKey(key)).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Idempotent API Requests', () => {
  it('returns same result for duplicate requests', async () => {
    const key = crypto.randomUUID();
    const data = { /* test data */ };
    
    // First request
    const response1 = await fetch('/api/membership/apply', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(data),
    });
    const result1 = await response1.json();
    
    // Duplicate request
    const response2 = await fetch('/api/membership/apply', {
      method: 'POST',
      headers: { 'Idempotency-Key': key },
      body: JSON.stringify(data),
    });
    const result2 = await response2.json();
    
    // Should return same result
    expect(result1.data).toEqual(result2.data);
    expect(result2.metadata.cached).toBe(true);
  });
});
```

## Migration

The idempotency system was added via migration `104-create-idempotency-keys-table.sql`.

To rollback:
```bash
# Execute DOWN section of migration
./scripts/run-sql-via-api.sh scripts/104-create-idempotency-keys-table.sql
```

## References

- Requirements: 20.6, 20.7
- Design Document: `.kiro/specs/system-view-master/design.md`
- Migration: `scripts/104-create-idempotency-keys-table.sql`
- Core Utility: `lib/utils/idempotency.ts`
- Middleware: `lib/utils/idempotency-middleware.ts`
