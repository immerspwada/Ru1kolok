/**
 * Idempotency System Tests
 * 
 * Tests the idempotency key validation and utility functions.
 * Requirements: 20.6, 20.7
 */

import { describe, it, expect } from 'vitest';
import { 
  isValidIdempotencyKey, 
  generateIdempotencyKey 
} from '@/lib/utils/idempotency';

describe('Idempotency Key Validation', () => {
  describe('isValidIdempotencyKey', () => {
    it('accepts valid UUID v4', () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        '00000000-0000-0000-0000-000000000000',
      ];

      validUUIDs.forEach(uuid => {
        expect(isValidIdempotencyKey(uuid)).toBe(true);
      });
    });

    it('accepts valid alphanumeric strings', () => {
      const validKeys = [
        'user_123_application_2024',
        'req-1234567890abcdef',
        'application_abc123_xyz789',
        'a'.repeat(16), // Minimum length
        'a'.repeat(255), // Maximum length
      ];

      validKeys.forEach(key => {
        expect(isValidIdempotencyKey(key)).toBe(true);
      });
    });

    it('rejects short strings', () => {
      const shortKeys = [
        'short',
        'abc',
        '12345',
        'a'.repeat(15), // One less than minimum
      ];

      shortKeys.forEach(key => {
        expect(isValidIdempotencyKey(key)).toBe(false);
      });
    });

    it('rejects long strings', () => {
      const longKey = 'a'.repeat(256); // One more than maximum
      expect(isValidIdempotencyKey(longKey)).toBe(false);
    });

    it('rejects strings with invalid characters', () => {
      const invalidKeys = [
        'contains spaces here',
        'special@chars!',
        'has#hash',
        'has$dollar',
        'has%percent',
      ];

      invalidKeys.forEach(key => {
        expect(isValidIdempotencyKey(key)).toBe(false);
      });
    });

    it('rejects empty string', () => {
      expect(isValidIdempotencyKey('')).toBe(false);
    });

    it('rejects strings with only digits and hyphens (no letters)', () => {
      const noLetterKeys = [
        '1234567890123456', // 16 digits, no letters
        '12345678-9012-3456', // Digits with hyphens, no letters
        '1234-5678-9012-3456-7890', // More digits with hyphens
      ];

      noLetterKeys.forEach(key => {
        expect(isValidIdempotencyKey(key)).toBe(false);
      });
    });

    it('accepts UUID-like strings with extra characters as alphanumeric', () => {
      // These are technically valid alphanumeric keys even though they look like malformed UUIDs
      const validAlphanumeric = [
        '550e8400-e29b-41d4-a716-446655440000-extra', // Valid alphanumeric (has letters)
        'gggggggg-gggg-gggg-gggg-gggggggggggg', // Valid alphanumeric (has letters)
      ];

      validAlphanumeric.forEach(key => {
        expect(isValidIdempotencyKey(key)).toBe(true);
      });
    });
  });

  describe('generateIdempotencyKey', () => {
    it('generates valid UUID', () => {
      const key = generateIdempotencyKey();
      expect(isValidIdempotencyKey(key)).toBe(true);
    });

    it('generates unique keys', () => {
      const keys = new Set<string>();
      const count = 100;

      for (let i = 0; i < count; i++) {
        keys.add(generateIdempotencyKey());
      }

      // All keys should be unique
      expect(keys.size).toBe(count);
    });

    it('generates keys in UUID format', () => {
      const key = generateIdempotencyKey();
      const uuidRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
      expect(uuidRegex.test(key)).toBe(true);
    });
  });
});

describe('Idempotency Key Format Examples', () => {
  it('accepts real-world UUID examples', () => {
    const realWorldUUIDs = [
      crypto.randomUUID(),
      crypto.randomUUID(),
      crypto.randomUUID(),
    ];

    realWorldUUIDs.forEach(uuid => {
      expect(isValidIdempotencyKey(uuid)).toBe(true);
    });
  });

  it('accepts real-world alphanumeric examples', () => {
    const realWorldKeys = [
      'membership_app_2024_user123',
      'session_create_20241127_abc',
      'checkin_athlete456_session789',
    ];

    realWorldKeys.forEach(key => {
      expect(isValidIdempotencyKey(key)).toBe(true);
    });
  });
});
