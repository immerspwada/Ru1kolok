# Event Schemas

This directory contains JSON Schema definitions for all asynchronous events in the Sports Club Management System.

## Directory Structure

```
events/
├── schemas/
│   ├── auth/                    # Authentication events
│   │   ├── user.registered.v1.json
│   │   ├── user.verified.v1.json
│   │   ├── session.created.v1.json
│   │   └── session.ended.v1.json
│   ├── membership/              # Membership application events
│   │   ├── application.submitted.v1.json
│   │   ├── application.approved.v1.json
│   │   └── application.rejected.v1.json
│   ├── training/                # Training session and attendance events
│   │   ├── session.created.v1.json
│   │   ├── session.updated.v1.json
│   │   ├── session.cancelled.v1.json
│   │   └── attendance.recorded.v1.json
│   ├── communication/           # Announcement and notification events
│   │   ├── announcement.published.v1.json
│   │   └── notification.sent.v1.json
│   └── performance/             # Performance tracking events
│       ├── record.created.v1.json
│       └── report.published.v1.json
├── EVENT_SCHEMA_REGISTRY.md     # Complete registry with producers/consumers
└── README.md                    # This file
```

## Event Naming Convention

All events follow the naming convention:

```
org.club.<context>.<entity>.<action>.v<version>
```

**Examples:**
- `org.club.auth.user.registered.v1`
- `org.club.membership.application.approved.v1`
- `org.club.training.session.created.v1`

## Event Structure

All events share a common structure:

```json
{
  "eventId": "uuid",
  "eventType": "org.club.<context>.<entity>.<action>.v<version>",
  "timestamp": "ISO 8601 date-time",
  "correlationId": "uuid",
  "causationId": "uuid",
  "data": {
    // Event-specific payload
  }
}
```

### Standard Fields

- **eventId**: Unique identifier for this event instance
- **eventType**: Event type following naming convention
- **timestamp**: When the event occurred (ISO 8601 format)
- **correlationId**: Links related operations across the system
- **causationId**: Links cause and effect relationships
- **data**: Event-specific payload defined in the schema

## Using Event Schemas

### Publishing Events

```typescript
import { publishEvent } from '@/lib/utils/event-publisher';

await publishEvent(
  'org.club.training.session.created.v1',
  {
    sessionId: session.id,
    clubId: session.club_id,
    coachId: session.coach_id,
    title: session.title,
    scheduledAt: session.scheduled_at,
    durationMinutes: session.duration_minutes,
    location: session.location,
    sessionType: session.session_type,
    status: session.status,
    createdAt: session.created_at
  },
  correlationId,
  causationId
);
```

### Consuming Events

```typescript
import { supabase } from '@/lib/supabase/client';

// Subscribe to events
const channel = supabase.channel('events');

channel.on('broadcast', { event: 'org.club.training.session.created.v1' }, (payload) => {
  const event = payload.payload;
  console.log('New session created:', event.data.sessionId);
  
  // Handle the event
  handleSessionCreated(event.data);
});

channel.subscribe();
```

### Validating Events

```typescript
import { validateEventSchema } from '@/lib/utils/event-validator';

const event = {
  eventId: generateUUID(),
  eventType: 'org.club.auth.user.registered.v1',
  timestamp: new Date().toISOString(),
  correlationId,
  causationId,
  data: {
    userId: user.id,
    email: user.email,
    role: user.role,
    profileId: profile.id,
    registeredAt: user.created_at
  }
};

const isValid = await validateEventSchema(event);
if (!isValid) {
  throw new Error('Event validation failed');
}
```

## Event Categories

### Authentication Events (auth/)
Events related to user authentication, registration, and session management.

### Membership Events (membership/)
Events related to club membership applications and approvals.

### Training Events (training/)
Events related to training sessions, attendance, and scheduling.

### Communication Events (communication/)
Events related to announcements and notifications.

### Performance Events (performance/)
Events related to performance tracking and progress reports.

## Schema Validation

All schemas are defined using JSON Schema draft-07 and can be validated using standard JSON Schema validators.

### Validation Tools

- **Online**: [JSON Schema Validator](https://www.jsonschemavalidator.net/)
- **CLI**: `ajv-cli` - Install with `npm install -g ajv-cli`
- **Library**: `ajv` - Used in the application for runtime validation

### Example Validation

```bash
# Validate a schema file
ajv validate -s schemas/auth/user.registered.v1.json -d example-event.json
```

## Event Versioning

When making changes to event schemas:

1. **Non-breaking changes** (adding optional fields):
   - Update the existing schema
   - Increment patch version in documentation

2. **Breaking changes** (removing/renaming fields, changing types):
   - Create a new version (e.g., v2)
   - Keep old version for backward compatibility
   - Update EVENT_SCHEMA_REGISTRY.md with migration guide

## Testing

Test event schemas using the provided test utilities:

```typescript
import { describe, it, expect } from 'vitest';
import { validateEventSchema } from '@/lib/utils/event-validator';
import userRegisteredSchema from '@/events/schemas/auth/user.registered.v1.json';

describe('User Registered Event Schema', () => {
  it('validates correct event', async () => {
    const event = {
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      eventType: 'org.club.auth.user.registered.v1',
      timestamp: '2025-11-27T10:00:00Z',
      correlationId: '123e4567-e89b-12d3-a456-426614174001',
      causationId: '123e4567-e89b-12d3-a456-426614174002',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174003',
        email: 'user@example.com',
        role: 'athlete',
        profileId: '123e4567-e89b-12d3-a456-426614174004',
        registeredAt: '2025-11-27T10:00:00Z'
      }
    };
    
    const isValid = await validateEventSchema(event);
    expect(isValid).toBe(true);
  });
  
  it('rejects event with missing required fields', async () => {
    const event = {
      eventId: '123e4567-e89b-12d3-a456-426614174000',
      eventType: 'org.club.auth.user.registered.v1',
      timestamp: '2025-11-27T10:00:00Z',
      data: {
        userId: '123e4567-e89b-12d3-a456-426614174003',
        // Missing email and role
      }
    };
    
    const isValid = await validateEventSchema(event);
    expect(isValid).toBe(false);
  });
});
```

## Documentation

For complete documentation including event producers, consumers, and usage examples, see:

- [EVENT_SCHEMA_REGISTRY.md](./EVENT_SCHEMA_REGISTRY.md) - Complete event registry
- [System Design](../.kiro/specs/system-view-master/design.md) - Event-driven architecture
- [Correlation IDs](../docs/CORRELATION_IDS.md) - Request tracing

## Contributing

When adding new event schemas:

1. Create the JSON Schema file in the appropriate category directory
2. Follow the naming convention: `<entity>.<action>.v<version>.json`
3. Update EVENT_SCHEMA_REGISTRY.md with:
   - Event description
   - Producers (where the event is published)
   - Consumers (who listens to the event)
   - Payload example
4. Add tests for the new schema
5. Update this README if adding a new category

## Related Files

- `/lib/utils/event-publisher.ts` - Event publishing utilities
- `/lib/utils/event-validator.ts` - Event validation utilities
- `/lib/utils/correlation.ts` - Correlation ID management
- `/openapi/*.yaml` - HTTP API specifications
