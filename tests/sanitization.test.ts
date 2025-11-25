import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeInput,
  sanitizeFileName,
  sanitizeUrl,
  sanitizePhoneNumber,
  sanitizeEmail,
} from '@/lib/utils/sanitization';

describe('Sanitization Functions', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toBe('Hello');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>Hello';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<iframe>');
      expect(result).toBe('Hello');
    });

    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should preserve safe HTML', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHtml(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });
  });

  describe('sanitizeText', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeText(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const result = sanitizeText(input);
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('should escape quotes', () => {
      const input = 'He said "Hello"';
      const result = sanitizeText(input);
      expect(result).toContain('&quot;');
    });

    it('should handle empty string', () => {
      const result = sanitizeText('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should remove null bytes', () => {
      const input = 'Hello\0World';
      const result = sanitizeInput(input);
      expect(result).toBe('HelloWorld');
    });

    it('should normalize multiple spaces', () => {
      const input = 'Hello    World';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove path separators', () => {
      const input = '../../../etc/passwd';
      const result = sanitizeFileName(input);
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
    });

    it('should remove dangerous characters', () => {
      const input = 'file<>:"|?*.txt';
      const result = sanitizeFileName(input);
      expect(result).toBe('file.txt');
    });

    it('should remove leading/trailing dots', () => {
      const input = '...file.txt...';
      const result = sanitizeFileName(input);
      expect(result).toBe('file.txt');
    });

    it('should limit length to 255 characters', () => {
      const input = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(input);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should handle empty string', () => {
      const result = sanitizeFileName('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    it('should block javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeUrl(input);
      expect(result).toBe('');
    });

    it('should block data: protocol', () => {
      const input = 'data:text/html,<script>alert("xss")</script>';
      const result = sanitizeUrl(input);
      expect(result).toBe('');
    });

    it('should allow http URLs', () => {
      const input = 'http://example.com';
      const result = sanitizeUrl(input);
      expect(result).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
      const input = 'https://example.com';
      const result = sanitizeUrl(input);
      expect(result).toBe('https://example.com');
    });

    it('should allow relative URLs', () => {
      const input = '/path/to/page';
      const result = sanitizeUrl(input);
      expect(result).toBe('/path/to/page');
    });

    it('should handle empty string', () => {
      const result = sanitizeUrl('');
      expect(result).toBe('');
    });
  });

  describe('sanitizePhoneNumber', () => {
    it('should remove non-digit characters', () => {
      const input = '081-234-5678';
      const result = sanitizePhoneNumber(input);
      expect(result).toBe('0812345678');
    });

    it('should preserve leading plus', () => {
      const input = '+66 81 234 5678';
      const result = sanitizePhoneNumber(input);
      expect(result).toBe('+66812345678');
    });

    it('should remove multiple plus signs', () => {
      const input = '+66+812345678';
      const result = sanitizePhoneNumber(input);
      expect(result).toBe('+66812345678');
    });

    it('should handle empty string', () => {
      const result = sanitizePhoneNumber('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const input = 'User@Example.COM';
      const result = sanitizeEmail(input);
      expect(result).toBe('user@example.com');
    });

    it('should trim whitespace', () => {
      const input = '  user@example.com  ';
      const result = sanitizeEmail(input);
      expect(result).toBe('user@example.com');
    });

    it('should remove spaces', () => {
      const input = 'user @example.com';
      const result = sanitizeEmail(input);
      expect(result).toBe('user@example.com');
    });

    it('should return empty for invalid email', () => {
      const input = 'not-an-email';
      const result = sanitizeEmail(input);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = sanitizeEmail('');
      expect(result).toBe('');
    });
  });
});
