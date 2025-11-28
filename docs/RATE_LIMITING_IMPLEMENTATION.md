# Rate Limiting Implementation

## Overview

Rate limiting has been implemented to protect the Sports Club Management System from abuse and ensure fair resource usage. The system uses an in-memory sliding window approach with automatic cleanup of expired entries.

## Configuration

### Rate Limit Tiers

The system defines three rate limit configurations:

1. **Authentication Endpoints (AUTH)**
   - Limit: 5 requests per minute
   - Applies to: `/api/auth/*` endpoints
   - Purpose: Prevent brute force attacks on login/registration

2. **General API Endpoints (API)**
   - Limit: 100 requests per minute
   - Applies to: All `/api/*` endpoints
   - Purpose: Prevent general API abuse

3. **Sensitive Operations (SENSITIVE)**
   - Limit: 3 requests per minute
   - Applies to: Specific sensitive endpoints (optional)
   - Purpose: Extra protection for critical operations

## Implementation Details

### Core Components

#### 1. Rate Limit Utility (`lib/utils/rate-limit.ts`)

Provides the core rate limiting logic:

```typescript
// Check if a request should be allowed
const { allowed, retryAfter } = checkRateLimit(clientId, config);

// Reset rate limit for a client
resetRateLimit(clientId);

// Get current status
const status = getRateLimitStatus(clientId);
```

**Features:**
- In-memory sliding window implementation
- Automatic cleanup of expired entries (every 5 minutes)
- Client identification from multiple sources (X-Forwarded-For, CF-Connecting-IP, X-Real-IP)
- Retry-After calculation in seconds

#### 2. Rate Limit Middleware (`lib/utils/rate-limit-middleware.ts`)

Provides middleware wrappers for API routes:

```typescript
// Wrap an API handler
export const POST = withRateLimitAuth(async (request) => {
  // Your handler logic
});

// Or use predefined middleware
export const POST = withRateLimitApi(handler);
```

#### 3. Main Middleware (`middleware.ts`)

Applies rate limiting at the request level:

- Checks authentication endpoints first (stricter limit)
- Then checks general API endpoints (looser limit)
- Returns 429 Too Many Requests if limit exceeded
- Includes Retry-After header for client guidance

## Response Format

When rate limit is exceeded, the API returns:

```json
{
  "error": "Too many requests",
  "message": "คุณส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
  "retryAfter": 45
}
```

**Response Headers:**
- `Retry-After`: Seconds to wait before retrying
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining (0 when limited)
- `X-RateLimit-Reset`: ISO timestamp when limit resets

## Client Identification

The system identifies clients using the following priority:

1. `X-Forwarded-For` header (proxy/load balancer)
2. `CF-Connecting-IP` header (Cloudflare)
3. `X-Real-IP` header (nginx/reverse proxy)
4. Fallback to 'unknown' identifier

This ensures accurate rate limiting even behind proxies and CDNs.

## Usage Examples

### Example 1: Protect an API Route

```typescript
// app/api/athlete/check-in/route.ts
import { withRateLimitApi } from '@/lib/utils/rate-limit-middleware';

export const POST = withRateLimitApi(async (request) => {
  // Your handler logic
  return NextResponse.json({ success: true });
});
```

### Example 2: Custom Rate Limit

```typescript
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/utils/rate-limit-middleware';

export const POST = withRateLimit(
  handler,
  {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }
);
```

### Example 3: Manual Rate Limit Check

```typescript
import { checkRateLimit, getClientIdentifier } from '@/lib/utils/rate-limit';

export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const { allowed, retryAfter } = checkRateLimit(clientId, {
    maxRequests: 5,
    windowMs: 60 * 1000,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests', retryAfter },
      { status: 429 }
    );
  }

  // Process request
}
```

## Middleware Integration

The rate limiting is automatically applied at the middleware level for all API routes:

1. **Authentication endpoints** (`/api/auth/*`): 5 requests/minute
2. **General API endpoints** (`/api/*`): 100 requests/minute

No additional configuration is needed for these routes.

## Monitoring and Debugging

### Check Rate Limit Status

```typescript
import { getRateLimitStatus } from '@/lib/utils/rate-limit';

const status = getRateLimitStatus(clientId);
if (status) {
  console.log(`Current count: ${status.count}`);
  console.log(`Resets at: ${new Date(status.resetTime)}`);
}
```

### Reset Rate Limit

```typescript
import { resetRateLimit } from '@/lib/utils/rate-limit';

// Manually reset for a client (e.g., after admin intervention)
resetRateLimit(clientId);
```

## Performance Considerations

### Memory Usage

- Each rate-limited client stores: `{ count: number, resetTime: number }`
- Approximately 50 bytes per entry
- Automatic cleanup every 5 minutes removes expired entries
- Expected memory usage: < 10MB for 100,000 active clients

### Cleanup Strategy

- Cleanup runs every 5 minutes
- Removes entries where `resetTime < now`
- Non-blocking operation
- Can be adjusted via `CLEANUP_INTERVAL` constant

## Security Notes

1. **Client Identification**: Uses IP address from request headers
   - Respects proxy headers for accurate identification
   - Fallback to 'unknown' if no IP found

2. **Rate Limit Bypass**: Admin operations using service role key are not rate limited
   - Applies only to client-side requests
   - Server-to-server operations bypass middleware

3. **Distributed Systems**: Current implementation is in-memory
   - Works for single-instance deployments
   - For multi-instance deployments, consider Redis-based rate limiting

## Future Enhancements

1. **Redis-based Rate Limiting**: For distributed deployments
2. **Per-User Rate Limiting**: Different limits for different user roles
3. **Adaptive Rate Limiting**: Adjust limits based on system load
4. **Rate Limit Analytics**: Track and report on rate limit violations
5. **Whitelist/Blacklist**: Allow specific IPs to bypass or be blocked

## Troubleshooting

### Issue: "Too many requests" error on legitimate traffic

**Solution:**
- Check if client is behind a proxy (multiple requests from same IP)
- Increase rate limit threshold if needed
- Use `resetRateLimit()` to manually reset for specific client

### Issue: Rate limiting not working

**Solution:**
- Verify middleware is enabled in `middleware.ts`
- Check that route matches middleware pattern
- Verify `getClientIdentifier()` is correctly extracting IP

### Issue: High memory usage

**Solution:**
- Reduce `CLEANUP_INTERVAL` for more frequent cleanup
- Lower rate limit thresholds to reduce active entries
- Monitor with `getRateLimitStatus()` for specific clients

## Testing

Rate limiting can be tested using curl:

```bash
# Test authentication endpoint rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}'
  echo "Request $i"
done

# Should see 429 responses after 5 requests
```

## References

- **Requirements**: 9.4 (Rate limiting for authentication endpoints)
- **Design Document**: Error Handling section
- **Implementation**: `lib/utils/rate-limit.ts`, `lib/utils/rate-limit-middleware.ts`, `middleware.ts`
