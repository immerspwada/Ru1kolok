# Feature Flag System

## Overview

The Feature Flag System provides gradual feature rollout and kill-switch capability for all major features in the Sports Club Management System. This allows safe deployment of new features with the ability to quickly disable them if issues arise.

**Requirements**: 20.8, 20.9

## Architecture

### Database Schema

```sql
CREATE TABLE feature_flags (
  name VARCHAR(255) PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER NOT NULL DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Key Features

- **Master Kill-Switch**: `enabled` flag provides instant feature disable
- **Gradual Rollout**: `rollout_percentage` controls what percentage of users see the feature
- **User-Based Bucketing**: Consistent user experience (same user always in same bucket)
- **Caching**: 5-minute cache for performance
- **Admin Management**: Full CRUD operations for feature flags

## Usage

### Basic Usage

```typescript
import { isFeatureEnabled } from '@/lib/utils/feature-flags';

// In a server component or API route
export default async function MyComponent() {
  const userId = await getCurrentUserId();
  
  if (await isFeatureEnabled('attendance_qr_checkin_v1', userId)) {
    // Show QR code check-in feature
    return <QRCodeCheckIn />;
  } else {
    // Show manual check-in only
    return <ManualCheckIn />;
  }
}
```

### Global Feature Check

For features that don't need gradual rollout:

```typescript
import { isFeatureEnabledGlobal } from '@/lib/utils/feature-flags';

if (await isFeatureEnabledGlobal('maintenance_mode')) {
  return <MaintenancePage />;
}
```

### Admin Management

```typescript
import {
  getAllFeatureFlags,
  updateFeatureFlag,
  createFeatureFlag,
  deleteFeatureFlag
} from '@/lib/utils/feature-flags';

// Get all flags
const flags = await getAllFeatureFlags();

// Update a flag
await updateFeatureFlag('attendance_qr_checkin_v1', {
  enabled: true,
  rollout_percentage: 50
});

// Create a new flag
await createFeatureFlag({
  name: 'new_feature_v1',
  enabled: false,
  rollout_percentage: 0,
  description: 'New experimental feature'
});

// Delete a flag
await deleteFeatureFlag('old_feature_v1');
```

## Existing Feature Flags

The following feature flags are pre-configured:

| Flag Name | Description | Default Status |
|-----------|-------------|----------------|
| `attendance_qr_checkin_v1` | QR code-based attendance check-in | Enabled (100%) |
| `parent_dashboard_v1` | Parent portal for monitoring athletes | Enabled (100%) |
| `home_training_v1` | Self-directed home training logging | Enabled (100%) |
| `tournament_management_v1` | Tournament creation and management | Enabled (100%) |
| `activity_checkin_v1` | QR code check-in for general activities | Enabled (100%) |

## Rollout Strategy

### Phase 1: Development (0%)
- Flag OFF for all users
- Test in development environment
- Verify functionality

### Phase 2: Internal Testing (0% with admin override)
- Flag ON for admins only
- Internal team testing
- Bug fixes

### Phase 3: Beta (10-25%)
- Gradual rollout to small percentage
- Monitor error rates
- Gather feedback

### Phase 4: Staged Rollout (25% → 50% → 75%)
- Increase percentage gradually
- Monitor metrics at each stage
- Pause if issues detected

### Phase 5: Full Release (100%)
- Enable for all users
- Continue monitoring
- Keep flag for potential rollback

### Phase 6: Cleanup
- After stable period (2-4 weeks)
- Remove flag checks from code
- Delete flag from database

## How Rollout Works

### User Bucketing

Users are consistently assigned to buckets 0-99 based on their user ID:

```typescript
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}
```

**Example**: If `rollout_percentage = 25`:
- Users in buckets 0-24 see the feature (25%)
- Users in buckets 25-99 don't see the feature (75%)
- Same user always gets same bucket

### Caching

Feature flags are cached for 5 minutes to reduce database load:

```typescript
const cached = cache.get<FeatureFlag>(`feature_flag:${flagName}`);
if (cached) {
  return cached;
}
```

**Cache Invalidation**:
- Automatic after 5 minutes
- Manual via `clearFeatureFlagCache()`
- On flag update/delete

## Kill-Switch Usage

### Emergency Disable

If a feature causes issues in production:

```sql
-- Disable immediately for all users
UPDATE feature_flags 
SET enabled = false 
WHERE name = 'problematic_feature_v1';
```

Or via admin API:

```typescript
await updateFeatureFlag('problematic_feature_v1', {
  enabled: false
});
```

### Gradual Disable

To reduce rollout percentage:

```typescript
// Reduce from 100% to 50%
await updateFeatureFlag('feature_name', {
  rollout_percentage: 50
});

// Further reduce to 10%
await updateFeatureFlag('feature_name', {
  rollout_percentage: 10
});

// Disable completely
await updateFeatureFlag('feature_name', {
  enabled: false
});
```

## Best Practices

### Naming Convention

```
<domain>_<feature>_v<version>

Examples:
- attendance_qr_checkin_v1
- parent_dashboard_v1
- home_training_v1
- payment_integration_v2
```

### Default State

Always create new flags as disabled:

```typescript
await createFeatureFlag({
  name: 'new_feature_v1',
  enabled: false,        // Start disabled
  rollout_percentage: 0, // 0% rollout
  description: 'Description of the feature'
});
```

### Monitoring

Monitor these metrics during rollout:
- Error rates
- Performance metrics
- User feedback
- Feature usage statistics

### Code Organization

Keep feature flag checks at the highest level possible:

```typescript
// ✅ Good: Check at component level
export default async function AttendancePage() {
  if (await isFeatureEnabled('attendance_qr_checkin_v1', userId)) {
    return <QRCheckInFlow />;
  }
  return <ManualCheckInFlow />;
}

// ❌ Bad: Check deep in business logic
function processCheckIn() {
  if (await isFeatureEnabled('attendance_qr_checkin_v1', userId)) {
    // Complex logic mixed with flag check
  }
}
```

### Cleanup

Remove feature flags after features are stable:

1. Wait 2-4 weeks after 100% rollout
2. Remove flag checks from code
3. Delete flag from database
4. Update documentation

## Troubleshooting

### Feature Not Showing for User

1. Check flag is enabled:
   ```sql
   SELECT * FROM feature_flags WHERE name = 'feature_name';
   ```

2. Check user's bucket:
   ```typescript
   const bucket = hashUserId(userId);
   console.log(`User bucket: ${bucket}`);
   ```

3. Check rollout percentage:
   - If bucket < rollout_percentage, user should see feature
   - If bucket >= rollout_percentage, user won't see feature

### Cache Issues

Clear cache if flags not updating:

```typescript
import { clearFeatureFlagCache } from '@/lib/utils/feature-flags';

clearFeatureFlagCache();
```

### Performance Issues

If feature flag checks are slow:
1. Verify caching is working
2. Check database indexes exist
3. Consider reducing cache TTL if flags change frequently

## API Reference

### `isFeatureEnabled(flagName, userId)`

Check if feature is enabled for specific user.

**Parameters**:
- `flagName` (string): Feature flag name
- `userId` (string): User ID for rollout calculation

**Returns**: `Promise<boolean>`

### `isFeatureEnabledGlobal(flagName)`

Check if feature is enabled globally (100% rollout).

**Parameters**:
- `flagName` (string): Feature flag name

**Returns**: `Promise<boolean>`

### `getAllFeatureFlags()`

Get all feature flags (admin use).

**Returns**: `Promise<FeatureFlag[]>`

### `updateFeatureFlag(flagName, updates)`

Update a feature flag (admin use).

**Parameters**:
- `flagName` (string): Feature flag name
- `updates` (object): Fields to update

**Returns**: `Promise<{ success: boolean; error?: string }>`

### `createFeatureFlag(flag)`

Create a new feature flag (admin use).

**Parameters**:
- `flag` (object): Feature flag data

**Returns**: `Promise<{ success: boolean; error?: string }>`

### `deleteFeatureFlag(flagName)`

Delete a feature flag (admin use).

**Parameters**:
- `flagName` (string): Feature flag name

**Returns**: `Promise<{ success: boolean; error?: string }>`

### `clearFeatureFlagCache()`

Clear all feature flag cache entries.

**Returns**: `void`

## Migration Reference

**Migration File**: `scripts/105-create-feature-flags-table.sql`

**Created**: 2025-11-27

**Includes**:
- Table creation with constraints
- Performance indexes
- Initial feature flag seeding

## Testing

Run feature flag tests:

```bash
npm test -- feature-flags.test.ts --run
```

Tests cover:
- Table creation
- Seeded flags
- Constraint validation
- CRUD operations
- Index performance
- Default values

## Related Documentation

- [Database Schema](./DATABASE.md)
- [Testing Guide](./TESTING.md)
- [Deployment Guide](./DEPLOYMENT.md)
