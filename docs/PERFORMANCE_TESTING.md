# Performance Testing Guide

## Overview

This document provides comprehensive guidance on performance testing for the Sports Club Management System. It covers testing methodology, baseline definitions, execution procedures, and optimization strategies.

## Table of Contents

1. [Performance Baselines](#performance-baselines)
2. [Testing Methodology](#testing-methodology)
3. [Running Performance Tests](#running-performance-tests)
4. [Interpreting Results](#interpreting-results)
5. [Optimization Strategies](#optimization-strategies)
6. [Monitoring and Alerting](#monitoring-and-alerting)

## Performance Baselines

### Response Time Targets

#### Critical Endpoints (P95 < 200ms)
These endpoints are in the critical path for user experience:

- **Authentication**
  - POST /api/auth/signin: < 200ms
  - POST /api/auth/signup: < 300ms
  - POST /api/auth/signout: < 100ms

- **Check-in (High Frequency)**
  - POST /api/athlete/check-in/:sessionId: < 150ms
  - GET /api/coach/attendance/:sessionId: < 200ms

#### Important Endpoints (P95 < 500ms)
These endpoints are frequently used but not time-critical:

- **Membership Operations**
  - POST /api/membership/apply: < 500ms
  - PUT /api/membership/applications/:id: < 400ms
  - GET /api/membership/applications: < 300ms

- **Training Sessions**
  - POST /api/coach/sessions: < 400ms
  - GET /api/coach/sessions: < 300ms
  - GET /api/athlete/sessions: < 300ms

#### Standard Endpoints (P95 < 1000ms)
These endpoints involve complex operations:

- **Reports and Analytics**
  - GET /api/coach/performance/trends: < 800ms
  - GET /api/admin/reports: < 1000ms
  - GET /api/athlete/progress-reports: < 600ms

### Database Query Performance

#### Query Time Targets

**Simple Queries (Single table, indexed):**
- SELECT with primary key: < 5ms
- SELECT with indexed foreign key: < 10ms
- SELECT with composite index: < 15ms

**Complex Queries (Joins, aggregations):**
- 2-table join with indexes: < 30ms
- 3-table join with indexes: < 50ms
- Aggregation queries: < 100ms

**Bulk Operations:**
- Batch insert (10 records): < 50ms
- Batch update (10 records): < 60ms
- Bulk delete with cascade: < 100ms

### Throughput Targets

#### Concurrent Users

**Normal Load:**
- 50 concurrent users
- 500 requests/minute
- < 1% error rate

**Peak Load:**
- 100 concurrent users
- 1000 requests/minute
- < 2% error rate

**Stress Test:**
- 200 concurrent users
- 2000 requests/minute
- < 5% error rate

## Testing Methodology

### Test Types

#### 1. Load Testing
Simulates expected user load to verify system handles normal traffic:
- Gradually ramp up from 1 to target users
- Maintain steady load for duration
- Measure response times and error rates

#### 2. Stress Testing
Pushes system beyond normal capacity to find breaking point:
- Increase load until system fails
- Identify resource bottlenecks
- Determine maximum capacity

#### 3. Spike Testing
Tests system response to sudden load increases:
- Sudden jump from normal to peak load
- Measure recovery time
- Verify graceful degradation

#### 4. Sustained Load Testing
Verifies system stability over extended period:
- Maintain constant load for 30+ minutes
- Monitor for memory leaks
- Check for performance degradation

#### 5. Database Performance Testing
Focuses on database query optimization:
- Verify index usage
- Measure query execution times
- Test connection pool efficiency

### Test Scenarios

#### Scenario 1: Morning Check-in Rush
Simulates peak check-in period:
- 100 athletes checking in simultaneously
- 10 coaches viewing attendance
- 5 admins monitoring system

**Expected Behavior:**
- Check-in requests complete in < 200ms
- No duplicate check-ins
- Error rate < 1%

#### Scenario 2: Session Creation Peak
Simulates coaches creating sessions:
- 20 coaches creating sessions
- 50 athletes viewing schedules
- 10 parents checking athlete progress

**Expected Behavior:**
- Session creation completes in < 400ms
- All data integrity maintained
- Error rate < 1%

#### Scenario 3: Dashboard Heavy Load
Simulates users viewing dashboards:
- 50 athletes viewing dashboards
- 20 coaches viewing analytics
- 10 admins generating reports

**Expected Behavior:**
- Dashboard loads in < 500ms
- All queries use indexes
- Cache hit rate > 90%

## Running Performance Tests

### Prerequisites

1. **Environment Setup**
   ```bash
   cd sports-club-management
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

2. **Test Data**
   - Ensure database has sufficient test data
   - At least 100 users, 50 sessions, 500 attendance records

3. **Dependencies**
   ```bash
   npm install
   ```

### Execute Performance Tests

#### Run All Performance Tests
```bash
npm run test:performance
```

#### Run Specific Test Suites
```bash
# Load testing only
npx vitest tests/performance/load-test.ts --run

# Database performance only
npx vitest tests/performance/database-performance.test.ts --run
```

#### Run with Detailed Output
```bash
npx vitest tests/performance --run --reporter=verbose
```

### Test Execution Flow

1. **Baseline Test**: Measure single-user performance
2. **Ramp-up Test**: Gradually increase to 100 users
3. **Sustained Load**: Maintain 100 users for 30 seconds
4. **Spike Test**: Jump from 50 to 200 users
5. **Database Tests**: Verify query performance

## Interpreting Results

### Performance Metrics

#### Response Time Metrics
- **Average**: Mean response time across all requests
- **P50 (Median)**: 50% of requests complete faster
- **P95**: 95% of requests complete faster (key metric)
- **P99**: 99% of requests complete faster
- **Min/Max**: Fastest and slowest requests

#### Throughput Metrics
- **Requests/Second**: Total requests processed per second
- **Concurrent Users**: Number of simultaneous users
- **Success Rate**: Percentage of successful requests

#### Error Metrics
- **Error Rate**: Percentage of failed requests
- **Timeout Rate**: Percentage of requests that timeout

### Good Performance Example

```
✅ Load test completed: Profile Queries
   Total duration: 5234ms
   Successful: 500/500
   Failed: 0/500
   Error rate: 0.00%
   Avg response time: 45.23ms
   P50 response time: 42ms
   P95 response time: 89ms
   P99 response time: 124ms
   Requests/second: 95.53
```

**Analysis:**
- ✅ All requests successful
- ✅ P95 well below 200ms baseline
- ✅ High throughput (95 req/s)
- ✅ No errors

### Performance Issue Example

```
⚠️  Load test completed: Complex Queries
   Total duration: 15234ms
   Successful: 480/500
   Failed: 20/500
   Error rate: 4.00%
   Avg response time: 245.67ms
   P50 response time: 180ms
   P95 response time: 1250ms  ⚠️ EXCEEDS BASELINE
   P99 response time: 2340ms  ⚠️ EXCEEDS BASELINE
   Requests/second: 32.81
```

**Analysis:**
- ⚠️ 4% error rate (exceeds 2% threshold)
- ⚠️ P95 exceeds baseline by 2.5x
- ⚠️ Low throughput indicates bottleneck
- 🔍 Investigation required

## Optimization Strategies

### Database Optimization

#### 1. Index Optimization
```sql
-- Verify indexes exist
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';

-- Add missing indexes
CREATE INDEX idx_table_column ON table_name(column_name);

-- Composite indexes for common queries
CREATE INDEX idx_attendance_session_athlete 
ON attendance(session_id, athlete_id);
```

#### 2. Query Optimization
```typescript
// ❌ Bad: N+1 query problem
for (const session of sessions) {
  const attendance = await getAttendance(session.id);
}

// ✅ Good: Single query with join
const sessionsWithAttendance = await supabase
  .from('training_sessions')
  .select(`
    *,
    attendance(*)
  `);
```

#### 3. Pagination
```typescript
// ❌ Bad: Load all records
const { data } = await supabase
  .from('profiles')
  .select('*');

// ✅ Good: Paginate results
const { data } = await supabase
  .from('profiles')
  .select('*')
  .range(0, 49); // First 50 records
```

### Application Optimization

#### 1. Caching
```typescript
// Implement simple cache
const cache = new Map();

async function getCachedData(key: string, fetcher: () => Promise<any>) {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  setTimeout(() => cache.delete(key), 300000); // 5 min TTL
  
  return data;
}
```

#### 2. Connection Pooling
```typescript
// Supabase handles this automatically, but verify settings
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
});
```

#### 3. Batch Operations
```typescript
// ❌ Bad: Individual inserts
for (const record of records) {
  await supabase.from('table').insert(record);
}

// ✅ Good: Batch insert
await supabase.from('table').insert(records);
```

### Frontend Optimization

#### 1. Code Splitting
```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

#### 2. Debouncing
```typescript
// Debounce search inputs
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    performSearch(value);
  }, 300),
  []
);
```

#### 3. Optimistic Updates
```typescript
// Update UI immediately, sync in background
const handleCheckIn = async () => {
  // Optimistic update
  setAttendance([...attendance, newRecord]);
  
  try {
    await checkIn(sessionId);
  } catch (error) {
    // Rollback on error
    setAttendance(attendance);
  }
};
```

## Monitoring and Alerting

### Key Metrics to Monitor

#### Application Metrics
- Request rate (requests/second)
- Response time (P50, P95, P99)
- Error rate (%)
- Active connections

#### Database Metrics
- Query execution time
- Connection pool usage
- Cache hit ratio
- Slow query count

#### Infrastructure Metrics
- CPU utilization (%)
- Memory utilization (%)
- Network I/O (MB/s)
- Disk I/O (IOPS)

### Alert Configuration

#### Critical Alerts (Immediate Response)
- Error rate > 5%
- Response time > 5s
- Database connections > 90
- CPU > 90%

#### Warning Alerts (Investigation Required)
- Error rate > 1%
- Response time > 2s
- Database connections > 70
- CPU > 70%

### Monitoring Tools

**Application Monitoring:**
- Vercel Analytics
- Custom error logging
- Response time tracking

**Database Monitoring:**
- Supabase Dashboard
- Query performance logs
- Connection pool metrics

**Infrastructure Monitoring:**
- CPU/Memory utilization
- Network I/O
- Disk I/O

## Performance Testing Schedule

### Regular Testing

**Weekly:**
- Smoke tests on critical paths
- Database query performance checks
- Cache hit ratio verification

**Monthly:**
- Full load testing suite
- Stress testing
- Capacity planning review

**Quarterly:**
- Comprehensive performance audit
- Baseline updates
- Scalability testing

## Troubleshooting Guide

### High Response Times

**Symptoms:**
- P95 > 2x baseline
- User complaints about slowness
- Timeout errors

**Investigation Steps:**
1. Check database query performance
2. Verify indexes are being used
3. Look for N+1 query problems
4. Check network latency
5. Review RLS policy complexity

**Solutions:**
- Add missing indexes
- Optimize queries
- Implement caching
- Use pagination

### High Error Rates

**Symptoms:**
- Error rate > 2%
- Failed requests in logs
- User reports of failures

**Investigation Steps:**
1. Check error logs for patterns
2. Verify database connection pool
3. Check rate limiting
4. Review RLS policies
5. Test with single user

**Solutions:**
- Increase connection pool size
- Adjust rate limits
- Fix RLS policy conflicts
- Add retry logic

### Resource Exhaustion

**Symptoms:**
- CPU > 80%
- Memory > 90%
- Connection pool exhausted

**Investigation Steps:**
1. Profile memory usage
2. Check for connection leaks
3. Review caching strategy
4. Monitor concurrent connections

**Solutions:**
- Optimize memory usage
- Implement connection cleanup
- Add request queuing
- Scale infrastructure

## Success Criteria

Performance testing is successful when:

1. ✅ All critical endpoints meet P95 targets
2. ✅ System handles 100 concurrent users with < 2% error rate
3. ✅ Database queries use indexes (no full table scans)
4. ✅ Resource utilization stays within limits
5. ✅ No performance degradation over 30-minute sustained load
6. ✅ System recovers gracefully from spike tests
7. ✅ Monitoring and alerting configured correctly

## References

- [Performance Baselines](../tests/performance/performance-baselines.md)
- [Load Test Suite](../tests/performance/load-test.ts)
- [Database Performance Tests](../tests/performance/database-performance.test.ts)
- [Performance Testing README](../tests/performance/README.md)

## Revision History

- 2025-11-27: Initial performance testing guide created
