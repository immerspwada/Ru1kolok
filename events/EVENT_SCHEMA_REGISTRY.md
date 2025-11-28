# Event Schema Registry

This document serves as the central registry for all asynchronous events in the Sports Club Management System. All events follow the naming convention: `org.club.<context>.<entity>.<action>.v<version>`

## Event Schema Overview

All event schemas are defined using JSON Schema (draft-07) and include the following standard fields:

- `eventId` (uuid): Unique identifier for the event instance
- `eventType` (string): Event type identifier following naming convention
- `timestamp` (date-time): ISO 8601 timestamp when event occurred
- `correlationId` (uuid): Links related operations across the system
- `causationId` (uuid): Links cause and effect relationships
- `data` (object): Event-specific payload

## Authentication Events

### org.club.auth.user.registered.v1
**Schema**: `events/schemas/auth/user.registered.v1.json`

**Description**: Published when a new user account is created in the system

**Producers**:
- `lib/auth/actions.ts::signUp()`
- `app/api/admin/create-user/route.ts`

**Consumers**:
- Notification service (welcome email)
- Analytics service (user registration tracking)
- Audit logging service

**Payload**:
```typescript
{
  userId: string;
  email: string;
  role: 'admin' | 'coach' | 'athlete' | 'parent';
  profileId: string;
  registeredAt: string;
}
```

---

### org.club.auth.user.verified.v1
**Schema**: `events/schemas/auth/user.verified.v1.json`

**Description**: Published when a user successfully verifies their email address

**Producers**:
- `lib/auth/actions.ts::verifyOTP()`
- Supabase Auth webhook handler

**Consumers**:
- Notification service (verification confirmation)
- Analytics service (conversion tracking)
- Membership service (enable application submission)

**Payload**:
```typescript
{
  userId: string;
  email: string;
  verifiedAt: string;
  verificationMethod: 'otp' | 'magic_link' | 'email_link';
}
```

---

### org.club.auth.session.created.v1
**Schema**: `events/schemas/auth/session.created.v1.json`

**Description**: Published when a user successfully logs in and a session is created

**Producers**:
- `lib/auth/actions.ts::signIn()`
- `lib/auth/device-tracking.ts::createLoginSession()`

**Consumers**:
- Security monitoring service (anomaly detection)
- Analytics service (login tracking)
- Audit logging service

**Payload**:
```typescript
{
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    screenResolution: string;
    timezone: string;
  };
  loginAt: string;
  ipAddress?: string;
}
```

---

### org.club.auth.session.ended.v1
**Schema**: `events/schemas/auth/session.ended.v1.json`

**Description**: Published when a user logs out or a session expires

**Producers**:
- `lib/auth/actions.ts::signOut()`
- Session timeout handler
- Admin forced logout

**Consumers**:
- Security monitoring service
- Analytics service (session duration tracking)
- Audit logging service

**Payload**:
```typescript
{
  sessionId: string;
  userId: string;
  endedAt: string;
  endReason: 'logout' | 'timeout' | 'expired' | 'forced';
  sessionDuration?: number;
}
```

---

## Membership Events

### org.club.membership.application.submitted.v1
**Schema**: `events/schemas/membership/application.submitted.v1.json`

**Description**: Published when an athlete submits a membership application to join a club

**Producers**:
- `lib/membership/actions.ts::submitApplication()`
- `app/api/membership/apply/route.ts`

**Consumers**:
- Notification service (notify coaches of new application)
- Analytics service (application funnel tracking)
- Audit logging service

**Payload**:
```typescript
{
  applicationId: string;
  userId: string;
  clubId: string;
  appliedAt: string;
  hasDocuments: boolean;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
  };
}
```

---

### org.club.membership.application.approved.v1
**Schema**: `events/schemas/membership/application.approved.v1.json`

**Description**: Published when a coach approves a membership application

**Producers**:
- `lib/membership/actions.ts::approveApplication()`
- Database function `approve_application_atomic()`

**Consumers**:
- Notification service (notify athlete of approval)
- Profile service (update membership status)
- Analytics service (conversion tracking)
- Parent notification service (notify connected parents)

**Payload**:
```typescript
{
  applicationId: string;
  athleteId: string;
  clubId: string;
  coachId: string;
  approvedAt: string;
  reviewedBy: string;
  membershipStatus: 'active';
}
```

---

### org.club.membership.application.rejected.v1
**Schema**: `events/schemas/membership/application.rejected.v1.json`

**Description**: Published when a coach rejects a membership application

**Producers**:
- `lib/membership/actions.ts::rejectApplication()`

**Consumers**:
- Notification service (notify athlete with reason)
- Analytics service (rejection tracking)
- Audit logging service

**Payload**:
```typescript
{
  applicationId: string;
  athleteId: string;
  clubId: string;
  rejectedAt: string;
  rejectionReason: string;
  reviewedBy: string;
  membershipStatus: 'rejected';
}
```

---

## Training Events

### org.club.training.session.created.v1
**Schema**: `events/schemas/training/session.created.v1.json`

**Description**: Published when a coach creates a new training session

**Producers**:
- `lib/coach/session-actions.ts::createSession()`
- `app/api/coach/sessions/route.ts`

**Consumers**:
- Notification service (notify athletes in club)
- Calendar service (add to athlete calendars)
- Analytics service (session creation tracking)

**Payload**:
```typescript
{
  sessionId: string;
  clubId: string;
  coachId: string;
  teamId?: string;
  title: string;
  description?: string;
  sessionType: 'practice' | 'match' | 'fitness' | 'other';
  scheduledAt: string;
  durationMinutes: number;
  location: string;
  maxParticipants?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}
```

---

### org.club.training.session.updated.v1
**Schema**: `events/schemas/training/session.updated.v1.json`

**Description**: Published when a coach modifies an existing training session

**Producers**:
- `lib/coach/session-actions.ts::updateSession()`

**Consumers**:
- Notification service (notify athletes of changes)
- Calendar service (update athlete calendars)
- Analytics service (session modification tracking)

**Payload**:
```typescript
{
  sessionId: string;
  clubId: string;
  coachId: string;
  updatedAt: string;
  changes: {
    [field: string]: {
      before: any;
      after: any;
    };
  };
  notifyAthletes: boolean;
}
```

---

### org.club.training.session.cancelled.v1
**Schema**: `events/schemas/training/session.cancelled.v1.json`

**Description**: Published when a coach cancels a training session

**Producers**:
- `lib/coach/session-actions.ts::cancelSession()`

**Consumers**:
- Notification service (notify all registered athletes)
- Calendar service (remove from athlete calendars)
- Leave request service (auto-approve pending leave requests)
- Analytics service (cancellation tracking)

**Payload**:
```typescript
{
  sessionId: string;
  clubId: string;
  coachId: string;
  cancelledAt: string;
  cancellationReason?: string;
  originalScheduledAt: string;
  affectedAthletes: string[];
}
```

---

### org.club.training.attendance.recorded.v1
**Schema**: `events/schemas/training/attendance.recorded.v1.json`

**Description**: Published when attendance is recorded for a training session

**Producers**:
- `lib/athlete/attendance-actions.ts::checkIn()`
- `lib/coach/attendance-actions.ts::markAttendance()`
- `app/api/athlete/check-in/route.ts`

**Consumers**:
- Notification service (notify parents of check-in)
- Analytics service (attendance tracking)
- Performance service (update attendance statistics)
- Parent notification service

**Payload**:
```typescript
{
  attendanceId: string;
  sessionId: string;
  athleteId: string;
  clubId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: string;
  checkInMethod: 'manual' | 'qr' | 'auto';
  markedBy: string;
  notes?: string;
  recordedAt: string;
}
```

---

## Communication Events

### org.club.communication.announcement.published.v1
**Schema**: `events/schemas/communication/announcement.published.v1.json`

**Description**: Published when a coach or admin posts an announcement

**Producers**:
- `lib/coach/announcement-actions.ts::createAnnouncement()`
- Admin announcement creation

**Consumers**:
- Notification service (send to all recipients)
- Analytics service (announcement engagement tracking)

**Payload**:
```typescript
{
  announcementId: string;
  clubId?: string;
  authorId: string;
  authorRole: 'admin' | 'coach';
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  publishedAt: string;
  expiresAt?: string;
  targetAudience: 'club' | 'system-wide';
  recipientCount: number;
}
```

---

### org.club.communication.notification.sent.v1
**Schema**: `events/schemas/communication/notification.sent.v1.json`

**Description**: Published when a notification is sent to a user

**Producers**:
- `lib/notifications/actions.ts::createNotification()`
- All services that trigger notifications

**Consumers**:
- Analytics service (notification delivery tracking)
- Audit logging service
- Push notification service (for mobile)
- Email service (for email notifications)

**Payload**:
```typescript
{
  notificationId: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  sentAt: string;
  channels: ('in-app' | 'email' | 'push' | 'sms')[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  deepLink?: string;
}
```

---

## Performance Events

### org.club.performance.record.created.v1
**Schema**: `events/schemas/performance/record.created.v1.json`

**Description**: Published when a coach records a performance test result for an athlete

**Producers**:
- `lib/coach/performance-actions.ts::recordPerformance()`

**Consumers**:
- Notification service (notify athlete of new record)
- Analytics service (performance tracking)
- Parent notification service (notify parents of achievements)
- Achievement service (check for personal bests)

**Payload**:
```typescript
{
  recordId: string;
  athleteId: string;
  coachId: string;
  clubId: string;
  testType: string;
  testName: string;
  score: number;
  unit: string;
  testDate: string;
  notes?: string;
  createdAt: string;
  previousBest?: number;
  isPersonalBest: boolean;
}
```

---

### org.club.performance.report.published.v1
**Schema**: `events/schemas/performance/report.published.v1.json`

**Description**: Published when a coach creates a formal progress report for an athlete

**Producers**:
- `lib/progress/actions.ts::createProgressReport()`

**Consumers**:
- Notification service (notify athlete)
- Parent notification service (notify connected parents)
- Analytics service (report tracking)
- Document generation service (PDF export)

**Payload**:
```typescript
{
  reportId: string;
  athleteId: string;
  coachId: string;
  clubId: string;
  reportDate: string;
  overallRating: number;
  strengths: string;
  areasForImprovement: string;
  recommendations: string;
  goals?: string;
  publishedAt: string;
  notifyParents: boolean;
  parentIds: string[];
}
```

---

## Event Publishing Pattern

All events should be published using the standard event publishing function:

```typescript
import { publishEvent } from '@/lib/utils/event-publisher';

// Example: Publishing a session created event
await publishEvent(
  'org.club.training.session.created.v1',
  {
    sessionId: session.id,
    clubId: session.club_id,
    coachId: session.coach_id,
    title: session.title,
    scheduledAt: session.scheduled_at,
    // ... other fields
  },
  correlationId,
  causationId
);
```

## Event Validation

All events are validated against their JSON Schema before publishing:

```typescript
import { validateEventSchema } from '@/lib/utils/event-validator';

const event = {
  eventId: generateUUID(),
  eventType: 'org.club.auth.user.registered.v1',
  timestamp: new Date().toISOString(),
  correlationId,
  causationId,
  data: { /* ... */ }
};

const isValid = await validateEventSchema(event);
if (!isValid) {
  throw new Error('Event validation failed');
}
```

## Event Versioning

When making breaking changes to an event schema:

1. Create a new version (e.g., `v2`)
2. Keep the old version for backward compatibility
3. Update producers to publish both versions during transition
4. Update consumers to handle both versions
5. Deprecate old version after transition period
6. Remove old version after all consumers updated

Example:
- `org.club.auth.user.registered.v1` (current)
- `org.club.auth.user.registered.v2` (new version with breaking changes)

## Testing Event Schemas

All event schemas should be tested:

```typescript
import { describe, it, expect } from 'vitest';
import { validateEventSchema } from '@/lib/utils/event-validator';

describe('org.club.auth.user.registered.v1', () => {
  it('validates correct event structure', async () => {
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
});
```

## Event Monitoring

Monitor event publishing and consumption:

- Track event publishing rate
- Monitor event processing latency
- Alert on event validation failures
- Track consumer lag
- Monitor dead letter queues

## Related Documentation

- [Correlation IDs](../docs/CORRELATION_IDS.md)
- [OpenAPI Specifications](../openapi/)
- [System Architecture](../.kiro/specs/system-view-master/design.md)
