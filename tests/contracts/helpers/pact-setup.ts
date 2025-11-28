/**
 * Pact Test Setup Utilities
 * 
 * Provides common configuration and utilities for Pact contract tests
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import path from 'path';

const { like, eachLike, regex, string } = MatchersV3;

// ISO8601 datetime pattern for timestamps
const iso8601DateTime = () => regex(
  '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{3})?Z?$',
  '2024-01-01T12:00:00Z'
);

/**
 * Create a Pact instance for consumer tests
 */
export function createConsumerPact(consumer: string, provider: string): PactV3 {
  return new PactV3({
    consumer,
    provider,
    dir: path.resolve(process.cwd(), 'tests/contracts/pacts'),
    logLevel: 'warn',
  });
}

/**
 * Common matchers for API responses
 */
export const commonMatchers = {
  uuid: regex(
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    '550e8400-e29b-41d4-a716-446655440000'
  ),
  
  email: regex(
    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    'user@example.com'
  ),
  
  timestamp: iso8601DateTime(),
  
  phoneNumber: regex(
    '^0[0-9]{9}$',
    '0812345678'
  ),
  
  apiResponse: (data: any) => ({
    success: true,
    data: like(data),
    metadata: like({
      timestamp: iso8601DateTime(),
      requestId: commonMatchers.uuid,
      correlationId: commonMatchers.uuid,
    }),
  }),
  
  errorResponse: (code: string, message: string) => ({
    success: false,
    error: like({
      code,
      message,
      details: like({}),
    }),
    metadata: like({
      timestamp: iso8601DateTime(),
      requestId: commonMatchers.uuid,
      correlationId: commonMatchers.uuid,
    }),
  }),
};

/**
 * Common request headers
 */
export const commonHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

/**
 * Authenticated request headers
 */
export const authenticatedHeaders = {
  ...commonHeaders,
  'Authorization': regex(
    '^Bearer .+$',
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
  ),
  'X-Correlation-ID': commonMatchers.uuid,
};

/**
 * Setup function to run before each consumer test
 */
export async function setupConsumerTest(pact: PactV3): Promise<void> {
  // PactV3 doesn't require explicit setup
}

/**
 * Cleanup function to run after each consumer test
 */
export async function cleanupConsumerTest(pact: PactV3): Promise<void> {
  // PactV3 handles cleanup automatically
}

/**
 * Verify interaction and write pact file
 */
export async function verifyConsumerTest(pact: PactV3): Promise<void> {
  // PactV3 verifies automatically after executeTest
}

export { like, eachLike, regex, iso8601DateTime, string };
