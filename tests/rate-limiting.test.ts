/**
 * Rate Limiting Tests
 * 
 * Tests for rate limiting functionality including:
 * - Authentication endpoint rate limiting (5 per minute)
 * - General API endpoint rate limiting (100 per minute)
 * - Client identification
 * - Rate limit reset
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
  getClientIdentifier,
  RATE_LIMIT_CONFIGS,
} from '@/lib/utils/rate-limit';

describe('Rate Limiting', () => {
  const testClientId = 'test-client-192.168.1.1';

  beforeEach(() => {
    // Reset rate limit before each test
    resetRateLimit(testClientId);
  });

  afterEach(() => {
    // Cleanup after each test
    resetRateLimit(testClientId);
  });

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH;

      for (let i = 0; i < config.maxRequests; i++) {
        const result = checkRateLimit(testClientId, config);
        expect(result.allowed).toBe(true);
        expect(result.retryAfter).toBeUndefined();
      }
    });

    it('should block requests exceeding limit', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH;

      // Make requests up to the limit
      for (let i = 0; i < config.maxRequests; i++) {
        checkRateLimit(testClientId, config);
      }

      // Next request should be blocked
      const result = checkRateLimit(testClientId, config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });

    it('should respect different rate limit configs', () => {
      const authConfig = RATE_LIMIT_CONFIGS.AUTH;
      const apiConfig = RATE_LIMIT_CONFIGS.API;

      // Auth limit is stricter (5 vs 100)
      expect(authConfig.maxRequests).toBeLessThan(apiConfig.maxRequests);

      // Fill up auth limit
      for (let i = 0; i < authConfig.maxRequests; i++) {
        checkRateLimit(testClientId, authConfig);
      }

      // Auth should be blocked
      let result = checkRateLimit(testClientId, authConfig);
      expect(result.allowed).toBe(false);

      // Reset and test API limit
      resetRateLimit(testClientId);

      for (let i = 0; i < apiConfig.maxRequests; i++) {
        checkRateLimit(testClientId, apiConfig);
      }

      // API should be blocked
      result = checkRateLimit(testClientId, apiConfig);
      expect(result.allowed).toBe(false);
    });

    it('should create new entry for new client', () => {
      const newClientId = 'new-client-10.0.0.1';
      const config = RATE_LIMIT_CONFIGS.AUTH;

      const result = checkRateLimit(newClientId, config);
      expect(result.allowed).toBe(true);

      // Cleanup
      resetRateLimit(newClientId);
    });

    it('should increment count on each request', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH;

      for (let i = 1; i <= config.maxRequests; i++) {
        checkRateLimit(testClientId, config);
        const status = getRateLimitStatus(testClientId);
        expect(status?.count).toBe(i);
      }
    });
  });

  describe('resetRateLimit', () => {
    it('should reset rate limit for a client', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH;

      // Fill up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        checkRateLimit(testClientId, config);
      }

      // Should be blocked
      let result = checkRateLimit(testClientId, config);
      expect(result.allowed).toBe(false);

      // Reset
      resetRateLimit(testClientId);

      // Should be allowed again
      result = checkRateLimit(testClientId, config);
      expect(result.allowed).toBe(true);
    });

    it('should not affect other clients', () => {
      const client1 = 'client-1';
      const client2 = 'client-2';
      const config = RATE_LIMIT_CONFIGS.AUTH;

      // Fill up client1
      for (let i = 0; i < config.maxRequests; i++) {
        checkRateLimit(client1, config);
      }

      // Client1 should be blocked
      let result1 = checkRateLimit(client1, config);
      expect(result1.allowed).toBe(false);

      // Client2 should still be allowed
      let result2 = checkRateLimit(client2, config);
      expect(result2.allowed).toBe(true);

      // Reset client1
      resetRateLimit(client1);

      // Client1 should be allowed again
      result1 = checkRateLimit(client1, config);
      expect(result1.allowed).toBe(true);

      // Client2 should still be blocked (if we fill it up)
      for (let i = 0; i < config.maxRequests - 1; i++) {
        checkRateLimit(client2, config);
      }
      result2 = checkRateLimit(client2, config);
      expect(result2.allowed).toBe(false);

      // Cleanup
      resetRateLimit(client1);
      resetRateLimit(client2);
    });
  });

  describe('getRateLimitStatus', () => {
    it('should return null for non-existent client', () => {
      const status = getRateLimitStatus('non-existent-client');
      expect(status).toBeNull();
    });

    it('should return current status for existing client', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH;

      checkRateLimit(testClientId, config);
      checkRateLimit(testClientId, config);

      const status = getRateLimitStatus(testClientId);
      expect(status).not.toBeNull();
      expect(status?.count).toBe(2);
      expect(status?.resetTime).toBeGreaterThan(Date.now());
    });

    it('should return null after reset', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH;

      checkRateLimit(testClientId, config);
      resetRateLimit(testClientId);

      const status = getRateLimitStatus(testClientId);
      expect(status).toBeNull();
    });
  });

  describe('getClientIdentifier', () => {
    it('should extract IP from X-Forwarded-For header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should extract IP from CF-Connecting-IP header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'cf-connecting-ip': '203.0.113.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('203.0.113.1');
    });

    it('should extract IP from X-Real-IP header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '198.51.100.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('198.51.100.1');
    });

    it('should prioritize X-Forwarded-For over other headers', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'cf-connecting-ip': '203.0.113.1',
          'x-real-ip': '198.51.100.1',
        },
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('192.168.1.1');
    });

    it('should return unknown for missing headers', () => {
      const request = new Request('http://localhost', {
        headers: {},
      });

      const identifier = getClientIdentifier(request);
      expect(identifier).toBe('unknown');
    });
  });

  describe('Rate Limit Configs', () => {
    it('should have correct AUTH config', () => {
      expect(RATE_LIMIT_CONFIGS.AUTH.maxRequests).toBe(5);
      expect(RATE_LIMIT_CONFIGS.AUTH.windowMs).toBe(60 * 1000);
    });

    it('should have correct API config', () => {
      expect(RATE_LIMIT_CONFIGS.API.maxRequests).toBe(100);
      expect(RATE_LIMIT_CONFIGS.API.windowMs).toBe(60 * 1000);
    });

    it('should have correct SENSITIVE config', () => {
      expect(RATE_LIMIT_CONFIGS.SENSITIVE.maxRequests).toBe(3);
      expect(RATE_LIMIT_CONFIGS.SENSITIVE.windowMs).toBe(60 * 1000);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests correctly', () => {
      const config = RATE_LIMIT_CONFIGS.API;
      const results = [];

      // Simulate 150 concurrent requests
      for (let i = 0; i < 150; i++) {
        const result = checkRateLimit(testClientId, config);
        results.push(result.allowed);
      }

      // First 100 should be allowed
      const allowedCount = results.filter(r => r).length;
      expect(allowedCount).toBe(config.maxRequests);

      // Remaining should be blocked
      const blockedCount = results.filter(r => !r).length;
      expect(blockedCount).toBe(150 - config.maxRequests);
    });
  });

  describe('Retry-After Calculation', () => {
    it('should provide reasonable retry-after time', () => {
      const config = RATE_LIMIT_CONFIGS.AUTH;

      // Fill up the limit
      for (let i = 0; i < config.maxRequests; i++) {
        checkRateLimit(testClientId, config);
      }

      // Get blocked response
      const result = checkRateLimit(testClientId, config);
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();

      // Retry-after should be between 1 and window size
      expect(result.retryAfter).toBeGreaterThanOrEqual(1);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });
  });
});
