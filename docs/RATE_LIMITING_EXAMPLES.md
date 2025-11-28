# Rate Limiting Usage Examples

This document provides practical examples of how to use the rate limiting system in the Sports Club Management System.

## Quick Start

### Automatic Rate Limiting (Middleware)

Rate limiting is automatically applied at the middleware level for all API routes:

- **Authentication endpoints** (`/api/auth/*`): 5 requests per minute
- **General API endpoints** (`/api/*`): 100 requests per minute

No additional code is needed for these routes.

### Manual Rate Limiting in API Routes

If you need custom rate limiting for specific routes, use the wrapper functions:

```typescript
// app/api/athlete/check-in/route.ts
import { withRateLimitApi } from '@/lib/utils/rate-limit-middleware';

export const POST = withRateLimitApi(async (request) => {
  // Your handler logic
  return NextResponse.json({ success: true });
});
```

## Examples by Use Case

### Example 1: Authentication Endpoint with Rate Limiting

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimitAuth } from '@/lib/utils/rate-limit-middleware';
import { createClient } from '@/lib/supabase/server';

async function loginHandler(request: NextRequest) {
  const supabase = await createClient();
  const { email, password } = await request.json();

  // Your login logic
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, user: data.user });
}

// Apply rate limiting: 5 requests per minute
export const POST = withRateLimitAuth(loginHandler);
```

### Example 2: API Endpoint with Standard Rate Limiting

```typescript
// app/api/athlete/check-in/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimitApi } from '@/lib/utils/rate-limit-middleware';

async function checkInHandler(request: NextRequest) {
  const { sessionId } = await request.json();

  // Your check-in logic
  // ...

  return NextResponse.json({ success: true });
}

// Apply rate limiting: 100 requests per minute
export const POST = withRateLimitApi(checkInHandler);
```

### Example 3: Sensitive Operation with Strict Rate Limiting

```typescript
// app/api/admin/delete-user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimitSensitive } from '@/lib/utils/rate-limit-middleware';

async function deleteUserHandler(request: NextRequest) {
  // Verify admin access
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Your delete logic
  // ...

  return NextResponse.json({ success: true });
}

// Apply strict rate limiting: 3 requests per minute
export const POST = withRateLimitSensitive(deleteUserHandler);
```

### Example 4: Custom Rate Limit Configuration

```typescript
// app/api/custom/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/utils/rate-limit-middleware';

async function customHandler(request: NextRequest) {
  // Your logic
  return NextResponse.json({ success: true });
}

// Custom rate limit: 20 requests per 5 minutes
export const POST = withRateLimit(customHandler, {
  maxRequests: 20,
  windowMs: 5 * 60 * 1000, // 5 minutes
});
```

### Example 5: Manual Rate Limit Check

```typescript
// app/api/special/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit';

export async function POST(request: NextRequest) {
  // Get client identifier
  const clientId = getClientIdentifier(request);

  // Check rate limit
  const { allowed, retryAfter } = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter?.toString() || '60',
        },
      }
    );
  }

  // Your logic here
  return NextResponse.json({ success: true });
}
```

### Example 6: Rate Limit with User-Specific Tracking

```typescript
// app/api/user/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use user ID as identifier for per-user rate limiting
  const { allowed, retryAfter } = checkRateLimit(
    `user:${user.id}`,
    RATE_LIMIT_CONFIGS.API
  );

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429 }
    );
  }

  // Your logic
  return NextResponse.json({ success: true });
}
```

### Example 7: Rate Limit with Admin Bypass

```typescript
// app/api/admin/bulk-operation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = (profile as any)?.role === 'admin';

  // Skip rate limiting for admins
  if (!isAdmin) {
    const clientId = getClientIdentifier(request);
    const { allowed, retryAfter } = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        { status: 429 }
      );
    }
  }

  // Your logic
  return NextResponse.json({ success: true });
}
```

### Example 8: Rate Limit with Logging

```typescript
// app/api/monitored/endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit';
import { createLogger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const logger = createLogger({ clientId });

  const { allowed, retryAfter } = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.API);

  if (!allowed) {
    logger.warn('Rate limit exceeded', { retryAfter });
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429 }
    );
  }

  logger.info('Request allowed');

  // Your logic
  return NextResponse.json({ success: true });
}
```

## Client-Side Handling

### Example: Handling 429 Responses

```typescript
// lib/api-client.ts
async function makeRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const data = await response.json();
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));

    // Retry the request
    return makeRequest(url, options);
  }

  return response;
}
```

### Example: React Hook for Rate Limit Handling

```typescript
// hooks/useRateLimitedApi.ts
import { useState } from 'react';

export function useRateLimitedApi() {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');

        setIsRateLimited(true);
        setRetryAfter(retryAfter);

        // Clear rate limit after retry-after time
        setTimeout(() => {
          setIsRateLimited(false);
          setRetryAfter(null);
        }, retryAfter * 1000);

        throw new Error('Rate limited. Please try again later.');
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  return { makeRequest, isRateLimited, retryAfter };
}
```

## Testing Rate Limiting

### Using curl

```bash
# Test authentication endpoint rate limiting
for i in {1..10}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    -w "\nStatus: %{http_code}\n\n"
done

# Should see 429 responses after 5 requests
```

### Using Node.js

```typescript
// scripts/test-rate-limit.ts
async function testRateLimit() {
  const url = 'http://localhost:3000/api/auth/login';
  const payload = {
    email: 'test@example.com',
    password: 'test',
  };

  for (let i = 1; i <= 10; i++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    console.log(`Request ${i}: ${response.status}`);

    if (response.status === 429) {
      const data = await response.json();
      console.log(`Rate limited. Retry after: ${data.retryAfter}s`);
    }
  }
}

testRateLimit();
```

## Monitoring and Debugging

### Check Rate Limit Status

```typescript
// lib/debug/rate-limit-status.ts
import { getRateLimitStatus } from '@/lib/utils/rate-limit';

export function debugRateLimitStatus(clientId: string) {
  const status = getRateLimitStatus(clientId);

  if (!status) {
    console.log(`No rate limit entry for ${clientId}`);
    return;
  }

  const now = Date.now();
  const timeUntilReset = Math.ceil((status.resetTime - now) / 1000);

  console.log(`Client: ${clientId}`);
  console.log(`Current count: ${status.count}`);
  console.log(`Time until reset: ${timeUntilReset}s`);
}
```

### Reset Rate Limit for Testing

```typescript
// lib/debug/reset-rate-limit.ts
import { resetRateLimit } from '@/lib/utils/rate-limit';

export function debugResetRateLimit(clientId: string) {
  resetRateLimit(clientId);
  console.log(`Rate limit reset for ${clientId}`);
}
```

## Best Practices

1. **Use Wrapper Functions**: Prefer `withRateLimitAuth`, `withRateLimitApi`, etc. over manual checks
2. **Consistent Identifiers**: Use IP address for general endpoints, user ID for user-specific limits
3. **Meaningful Error Messages**: Provide clear messages in Thai for Thai users
4. **Retry-After Header**: Always include Retry-After header in 429 responses
5. **Logging**: Log rate limit violations for monitoring
6. **Testing**: Test rate limiting with automated tests
7. **Documentation**: Document custom rate limits in code comments

## Troubleshooting

### Rate Limiting Not Working

1. Check that middleware is enabled in `middleware.ts`
2. Verify route matches middleware pattern (`/api/*`)
3. Check that `getClientIdentifier()` correctly extracts IP

### False Positives (Legitimate Traffic Blocked)

1. Check if client is behind a proxy (multiple requests from same IP)
2. Increase rate limit threshold if needed
3. Use `resetRateLimit()` to manually reset for specific client

### High Memory Usage

1. Reduce cleanup interval for more frequent cleanup
2. Lower rate limit thresholds to reduce active entries
3. Monitor with `getRateLimitStatus()` for specific clients

## References

- **Implementation**: `lib/utils/rate-limit.ts`, `lib/utils/rate-limit-middleware.ts`
- **Middleware**: `middleware.ts`
- **Tests**: `tests/rate-limiting.test.ts`
- **Documentation**: `docs/RATE_LIMITING_IMPLEMENTATION.md`
