# Pact Contract Testing Setup

## Overview

This project uses [Pact](https://docs.pact.io/) for consumer-driven contract testing. Contract tests ensure that the frontend (consumer) and backend API (provider) agree on the interface contracts.

## Installation

Pact has been installed as a dev dependency:

```bash
npm install --save-dev @pact-foundation/pact
```

## Configuration

### File-Based Contracts

Currently configured to use file-based contracts stored in `tests/contracts/pacts/`. This is suitable for:
- Local development
- Small teams
- Simple CI/CD pipelines

### Pact Broker (Future Enhancement)

For production use, consider migrating to a Pact Broker for:
- Centralized contract storage
- Version management
- Can-I-Deploy checks
- Better CI/CD integration

## Directory Structure

```
tests/contracts/
├── consumer/              # Consumer tests (frontend)
│   ├── auth.consumer.test.ts
│   ├── membership.consumer.test.ts
│   ├── training.consumer.test.ts
│   └── attendance.consumer.test.ts
├── provider/              # Provider tests (backend)
│   ├── auth.provider.test.ts
│   ├── membership.provider.test.ts
│   ├── training.provider.test.ts
│   └── attendance.provider.test.ts
├── helpers/               # Shared utilities
│   ├── pact-setup.ts     # Consumer test utilities
│   └── provider-setup.ts # Provider test utilities
├── pacts/                 # Generated contract files
└── logs/                  # Pact logs (gitignored)
```

## Running Tests

### Consumer Tests (Generate Contracts)

```bash
npm run test:contracts:consumer
```

This will:
1. Run consumer tests
2. Generate pact files in `tests/contracts/pacts/`
3. Define expectations for API responses

### Provider Tests (Verify Contracts)

```bash
npm run test:contracts:provider
```

This will:
1. Read pact files from `tests/contracts/pacts/`
2. Replay requests against the provider
3. Verify responses match consumer expectations

### All Contract Tests

```bash
npm run test:contracts
```

Runs both consumer and provider tests in sequence.

## Writing Consumer Tests

Consumer tests define what the frontend expects from the API:

```typescript
import { createConsumerPact, commonMatchers, authenticatedHeaders } from '../helpers/pact-setup';

describe('Auth API Consumer', () => {
  const pact = createConsumerPact('Frontend', 'Auth API');

  beforeAll(() => pact.setup());
  afterAll(() => pact.finalize());

  it('signs in user with valid credentials', async () => {
    await pact.addInteraction({
      state: 'user exists with valid credentials',
      uponReceiving: 'a signin request',
      withRequest: {
        method: 'POST',
        path: '/api/auth/signin',
        headers: commonHeaders,
        body: {
          email: commonMatchers.email,
          password: 'ValidPassword123!',
        },
      },
      willRespondWith: {
        status: 200,
        headers: commonHeaders,
        body: commonMatchers.apiResponse({
          user: {
            id: commonMatchers.uuid,
            email: commonMatchers.email,
          },
          session: {
            access_token: like('jwt-token'),
          },
        }),
      },
    });

    // Make actual request to mock server
    const response = await fetch('http://localhost:8080/api/auth/signin', {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'ValidPassword123!',
      }),
    });

    expect(response.status).toBe(200);
    await pact.verify();
  });
});
```

## Writing Provider Tests

Provider tests verify the backend honors the contracts:

```typescript
import { verifyProvider } from '../helpers/provider-setup';

describe('Auth API Provider', () => {
  it('honors consumer contracts', async () => {
    await verifyProvider('Auth API', {
      // Custom configuration
      providerBaseUrl: 'http://localhost:3000',
      
      // State handlers
      stateHandlers: {
        'user exists with valid credentials': async () => {
          // Set up test data
          await createTestUser({
            email: 'user@example.com',
            password: 'ValidPassword123!',
          });
        },
      },
    });
  });
});
```

## Best Practices

### 1. Use Matchers

Use Pact matchers instead of exact values:

```typescript
// ❌ Bad - brittle, exact matching
body: {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'user@example.com',
}

// ✅ Good - flexible, type-based matching
body: {
  id: commonMatchers.uuid,
  email: commonMatchers.email,
}
```

### 2. Define Provider States

Use provider states to set up test data:

```typescript
state: 'user is authenticated'
state: 'athlete has pending application'
state: 'training session exists'
```

### 3. Test Happy Paths First

Focus on successful scenarios before error cases:

1. Valid authentication
2. Successful data retrieval
3. Successful mutations
4. Then add error scenarios

### 4. Keep Contracts Minimal

Only include fields the consumer actually uses:

```typescript
// ❌ Bad - includes unused fields
body: {
  id: uuid,
  email: email,
  created_at: timestamp,
  updated_at: timestamp,
  metadata: {...},
}

// ✅ Good - only what consumer needs
body: {
  id: uuid,
  email: email,
}
```

### 5. Version Your Contracts

When making breaking changes:

```typescript
// Old contract
path: '/api/v1/auth/signin'

// New contract
path: '/api/v2/auth/signin'
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Contract Tests

on: [push, pull_request]

jobs:
  consumer-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:contracts:consumer
      - uses: actions/upload-artifact@v3
        with:
          name: pacts
          path: tests/contracts/pacts/

  provider-tests:
    needs: consumer-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - uses: actions/download-artifact@v3
        with:
          name: pacts
          path: tests/contracts/pacts/
      - run: npm run build
      - run: npm start &
      - run: npm run test:contracts:provider
```

## Troubleshooting

### Mock Server Port Conflicts

If port 8080 is in use, change in `pact-setup.ts`:

```typescript
port: 8081, // Use different port
```

### Provider Verification Fails

1. Ensure provider is running: `npm start`
2. Check provider base URL in config
3. Verify state handlers set up data correctly
4. Check provider logs for errors

### Pact Files Not Generated

1. Ensure consumer tests pass
2. Check `pact.verify()` is called
3. Check `pact.finalize()` is called in afterAll
4. Verify write permissions on pacts directory

## References

- [Pact Documentation](https://docs.pact.io/)
- [Pact JS GitHub](https://github.com/pact-foundation/pact-js)
- [Contract Testing Guide](https://martinfowler.com/articles/consumerDrivenContracts.html)
- OpenAPI Specs: `sports-club-management/openapi/`
- Event Schemas: `sports-club-management/events/schemas/`

## Next Steps

1. ✅ Pact framework installed
2. ✅ Test infrastructure created
3. ⏳ Write consumer tests (Task 7.2)
4. ⏳ Write provider tests (Task 7.3)
5. ⏳ Add to CI/CD pipeline
