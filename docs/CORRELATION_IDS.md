# Correlation and Causation ID System

## Overview

The Sports Club Management System implements comprehensive request tracing using correlation and causation IDs. This enables debugging, monitoring, and understanding of request flows across the entire system.

**Validates: Requirements 20.5**

## Concepts

### Correlation ID
- **Purpose**: Groups all related operations that stem from a single user action
- **Scope**: Spans the entire request chain, including all nested operations
- **Generation**: Created when a request enters the system (or extracted from headers)
- **Propagation**: Passed through all operations and included in all logs

### Causation ID
- **Purpose**: Links cause and effect within a correlation
- **Scope**: Unique to each operation within a correlation
- **Generation**: Created for each new operation
- **Propagation**: Each operation generates a new causation ID

## Architecture

```
User Request → Middleware (generates/extracts correlation ID)
             → API Route (creates causation ID)
             → Business Logic (creates child causation ID)
             → Database Operation (logs with both IDs)
             → Response (includes both IDs in headers)
```

## Implementation

### Middleware Integration

The main middleware automatically adds correlation and causation IDs to all requests:

```typescript
// middleware.ts
import { generateCorrelationId, extractCorrelationId } from '@/lib/utils/correlation';

export async function middleware(request: NextRequest) {
  // Extract or generate correlation ID
  const correlationId = extractCorrelationId(request.headers) || generateCorrelationId();
  
  // Generate causation ID for this operation
  const causationId = generateCausationId();
  
  // Process request...
  const response = await updateSession(request);
  
  // Add headers to response
  response.headers.set('X-Correlation-ID', correlationId);
  response.headers.set('X-Causation-ID', causationId);
  
  return response;
}
```

### API Route Usage

API routes should use the context utilities to extract and propagate IDs:

```typescript
import { getApiContext } from '@/lib/utils/api-context';
import { createLogger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
  // Create request context with correlation IDs
  const context = getApiContext(request);
  const logger = createLogger(context);
  
  logger.info('API request started');
  
  try {
    // Your business logic here
    const result = await someOperation();
    
    logger.info('Operation completed', { result });
    
    // Return response with correlation headers
    const response = NextResponse.json({ success: true, data: result });
    response.headers.set('X-Correlation-ID', context.correlationId);
    response.headers.set('X-Causation-ID', context.causationId);
    return response;
    
  } catch (error) {
    logger.error('Operation failed', error as Error);
    
    const response = NextResponse.json(
      { success: false, error: 'Operation failed' },
      { status: 500 }
    );
    response.headers.set('X-Correlation-ID', context.correlationId);
    response.headers.set('X-Causation-ID', context.causationId);
    return response;
  }
}
```

### Server Actions

Server actions should create context and use structured logging:

```typescript
'use server';

import { createRequestContext } from '@/lib/utils/correlation';
import { createLogger } from '@/lib/utils/logger';

export async function myServerAction(data: any) {
  // Create context for this operation
  const context = createRequestContext(null, userId);
  const logger = createLogger(context);
  
  logger.info('Server action started', { data });
  
  try {
    // Your logic here
    const result = await processData(data);
    
    logger.info('Server action completed', { result });
    
    return { success: true, data: result };
  } catch (error) {
    logger.error('Server action failed', error as Error);
    return { success: false, error: 'Operation failed' };
  }
}
```

### Nested Operations

When calling nested operations, create child contexts:

```typescript
import { createChildContext } from '@/lib/utils/correlation';

async function parentOperation(context: RequestContext) {
  const logger = createLogger(context);
  logger.info('Parent operation started');
  
  // Create child context for nested operation
  const childContext = createChildContext(context);
  await childOperation(childContext);
  
  logger.info('Parent operation completed');
}

async function childOperation(context: RequestContext) {
  const logger = createLogger(context);
  logger.info('Child operation started');
  
  // This will have the same correlation ID but different causation ID
  // ...
  
  logger.info('Child operation completed');
}
```

## Structured Logging

### Log Format

All logs are output in JSON format with the following structure:

```json
{
  "level": "info",
  "message": "Operation completed",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "causationId": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "userId": "user-123",
  "timestamp": "2025-11-27T10:30:00.000Z",
  "data": {
    "sessionId": "session-456",
    "result": "success"
  }
}
```

### Log Levels

- **debug**: Detailed information for debugging
- **info**: General informational messages
- **warn**: Warning messages for potentially problematic situations
- **error**: Error messages for failures
- **critical**: Critical errors requiring immediate attention

### Logger Usage

```typescript
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger(context);

// Debug logging
logger.debug('Detailed debug information', { variable: value });

// Info logging
logger.info('Operation started', { userId, action });

// Warning logging
logger.warn('Potential issue detected', { issue: 'rate limit approaching' });

// Error logging
logger.error('Operation failed', error, { context: 'additional info' });

// Critical logging
logger.critical('System failure', error, { severity: 'high' });
```

## Response Headers

All API responses include correlation headers:

```
X-Correlation-ID: 550e8400-e29b-41d4-a716-446655440000
X-Causation-ID: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

Clients can include these headers in subsequent requests to maintain correlation:

```typescript
// Client-side request
fetch('/api/some-endpoint', {
  headers: {
    'X-Correlation-ID': previousCorrelationId,
  }
});
```

## Debugging with Correlation IDs

### Finding Related Logs

To trace a request through the system:

1. Extract the correlation ID from the response headers or error message
2. Search logs for that correlation ID
3. All operations related to that request will have the same correlation ID

Example log search:
```bash
# Search for all logs with a specific correlation ID
grep "550e8400-e29b-41d4-a716-446655440000" logs/*.log

# Or using jq for JSON logs
cat logs/app.log | jq 'select(.correlationId == "550e8400-e29b-41d4-a716-446655440000")'
```

### Understanding Operation Flow

Causation IDs help understand the sequence of operations:

1. Each operation has a unique causation ID
2. Parent operations create child contexts with new causation IDs
3. By following causation IDs chronologically, you can see the operation flow

## Best Practices

### Always Use Context

```typescript
// ✅ Good: Use context for logging
const context = getApiContext(request);
const logger = createLogger(context);
logger.info('Operation started');

// ❌ Bad: Direct console.log without context
console.log('Operation started');
```

### Propagate Headers

```typescript
// ✅ Good: Add correlation headers to response
response.headers.set('X-Correlation-ID', context.correlationId);
response.headers.set('X-Causation-ID', context.causationId);

// ❌ Bad: Return response without headers
return NextResponse.json(data);
```

### Include Relevant Data

```typescript
// ✅ Good: Include relevant context in logs
logger.info('User checked in', { 
  sessionId, 
  userId, 
  method: 'qr' 
});

// ❌ Bad: Vague log message
logger.info('Operation completed');
```

### Handle Errors Properly

```typescript
// ✅ Good: Log error with context
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', error as Error, { 
    operation: 'check-in',
    sessionId 
  });
  throw error;
}

// ❌ Bad: Silent failure
try {
  await operation();
} catch (error) {
  // Nothing
}
```

## Monitoring and Alerting

### Log Aggregation

Correlation IDs enable powerful log aggregation:

- Group all logs by correlation ID to see complete request flows
- Track error rates by correlation ID patterns
- Identify slow operations by analyzing timestamps within correlations

### Error Tracking

When errors occur:

1. The correlation ID is included in the error response
2. Users can report the correlation ID for support
3. Support can search logs using the correlation ID
4. All related operations are visible for debugging

### Performance Monitoring

Track operation performance:

```typescript
logger.info('Operation started', { operation: 'check-in' });
const startTime = Date.now();

await performOperation();

const duration = Date.now() - startTime;
logger.info('Operation completed', { 
  operation: 'check-in',
  duration 
});
```

## Testing

### Unit Tests

Test that correlation IDs are properly generated:

```typescript
import { generateCorrelationId, generateCausationId } from '@/lib/utils/correlation';

test('generates valid UUID correlation ID', () => {
  const id = generateCorrelationId();
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});
```

### Integration Tests

Test that correlation IDs flow through the system:

```typescript
test('correlation ID propagates through request chain', async () => {
  const correlationId = generateCorrelationId();
  
  const response = await fetch('/api/test', {
    headers: {
      'X-Correlation-ID': correlationId,
    },
  });
  
  expect(response.headers.get('X-Correlation-ID')).toBe(correlationId);
  expect(response.headers.get('X-Causation-ID')).toBeTruthy();
});
```

## Migration Guide

### Updating Existing Code

To add correlation ID support to existing code:

1. **Import utilities**:
   ```typescript
   import { getApiContext } from '@/lib/utils/api-context';
   import { createLogger } from '@/lib/utils/logger';
   ```

2. **Create context**:
   ```typescript
   const context = getApiContext(request);
   const logger = createLogger(context);
   ```

3. **Replace console.log**:
   ```typescript
   // Before
   console.log('Operation started');
   
   // After
   logger.info('Operation started');
   ```

4. **Add headers to responses**:
   ```typescript
   response.headers.set('X-Correlation-ID', context.correlationId);
   response.headers.set('X-Causation-ID', context.causationId);
   ```

## Troubleshooting

### Missing Correlation IDs

If correlation IDs are missing from logs:

1. Check that middleware is running (should be automatic)
2. Verify context is created in API routes
3. Ensure logger is created with context

### Duplicate Correlation IDs

If seeing unexpected duplicate correlation IDs:

1. Check that new causation IDs are generated for each operation
2. Verify child contexts are created properly
3. Ensure correlation IDs are not being regenerated unnecessarily

### Performance Impact

Correlation ID generation and logging has minimal performance impact:

- UUID generation: ~0.001ms
- JSON serialization: ~0.01ms per log
- Header addition: ~0.001ms

Total overhead per request: < 1ms

## Future Enhancements

- **Distributed Tracing**: Integration with OpenTelemetry for distributed tracing
- **Log Aggregation**: Integration with log aggregation services (Datadog, Splunk)
- **Visualization**: Request flow visualization tools
- **Sampling**: Configurable sampling rates for high-volume endpoints
- **Metrics**: Automatic metric generation from correlation data

## References

- Requirements: 20.5 (Correlation and Causation IDs)
- Design Document: System View Master - Observability and Monitoring
- Related: Idempotency System, Error Logging, Audit Logging
