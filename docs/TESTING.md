# Testing Guide

Complete testing guide for the Sports Club Management System.

## Test Accounts

### Demo Accounts

**Admin Account**
- Email: `admin@test.com`
- Password: `Admin123!`
- Role: Admin
- Access: Full system access

**Coach Account**
- Email: `coach@test.com`
- Password: `Coach123!`
- Role: Coach
- Club: Basketball Club

**Athlete Account**
- Email: `athlete@test.com`
- Password: `Athlete123!`
- Role: Athlete
- Status: Active

**Parent Account**
- Email: `parent@test.com`
- Password: `Parent123!`
- Role: Parent
- Access: View child's progress

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/auth-integration.test.ts
```

### Property-Based Tests

```bash
# Run property tests
npm test -- tests/*.property.test.ts
```

### Integration Tests

```bash
# Run integration tests
npm test -- tests/*-integration.test.ts
```

## Manual Testing Checklist

### Authentication Flow

- [ ] User can register new account
- [ ] User can login with email/password
- [ ] User can logout
- [ ] Session persists across page refresh
- [ ] Invalid credentials show error
- [ ] Rate limiting works after 5 failed attempts

### Membership Application Flow

- [ ] Athlete can submit application
- [ ] Coach can view applications for their club
- [ ] Coach can approve application
- [ ] Coach can reject application with reason
- [ ] Approved athlete can access dashboard
- [ ] Rejected athlete sees rejection reason

### Training Sessions

- [ ] Coach can create training session
- [ ] Coach can edit session details
- [ ] Coach can delete session
- [ ] Athlete can view schedule
- [ ] Athlete can check-in to session
- [ ] Check-in only works within time window

### Attendance Tracking

- [ ] Coach can mark attendance
- [ ] Athlete can view attendance history
- [ ] Attendance statistics calculate correctly
- [ ] Leave requests work properly
- [ ] Coach can approve/reject leave requests

### Performance Tracking

- [ ] Coach can record performance data
- [ ] Athlete can view performance history
- [ ] Performance charts display correctly
- [ ] Performance trends calculate accurately

### Announcements

- [ ] Coach can create announcement
- [ ] Coach can edit announcement
- [ ] Coach can delete announcement
- [ ] Athletes see announcements for their club
- [ ] Announcement notifications work

### Parent Features

- [ ] Parent can login
- [ ] Parent can view child's progress
- [ ] Parent receives notifications
- [ ] Parent can view attendance
- [ ] Parent can view performance reports

## Quick Test Reference

### Test User Registration

```bash
# Create test user via API
node scripts/create-test-user-via-api.js
```

### Test Database Connection

```bash
# Test Supabase connection
node scripts/test-supabase-connection.js
```

### Test Rate Limiting

```bash
# Test rate limiting
./scripts/test-rate-limiting.sh
```

### Verify Database Setup

```bash
# Verify schema
./scripts/run-sql-via-api.sh scripts/check-schema.sql

# Verify RLS policies
./scripts/run-sql-via-api.sh scripts/verify-33-rls-policies.sql
```

## Test Data Setup

### Create Test Users

```bash
# Create basic test users
./scripts/run-sql-via-api.sh scripts/create-test-users.sql

# Create demo accounts
./scripts/run-sql-via-api.sh scripts/create-demo-users.sql
```

### Create Test Clubs

```bash
# Create test club and profiles
./scripts/run-sql-via-api.sh scripts/06-create-test-club-and-profiles.sql
```

## Automated Testing

### CI/CD Pipeline

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

### Test Coverage Goals

- Unit tests: > 80%
- Integration tests: > 70%
- Property-based tests: Critical paths covered

## Troubleshooting Tests

### Tests Failing

1. Check database connection
2. Verify environment variables
3. Ensure test data exists
4. Check for race conditions
5. Review error messages

### Slow Tests

1. Use test database
2. Mock external services
3. Optimize database queries
4. Run tests in parallel

## Best Practices

- Write tests before fixing bugs
- Keep tests independent
- Use descriptive test names
- Clean up test data after tests
- Mock external dependencies
- Test edge cases and error conditions
