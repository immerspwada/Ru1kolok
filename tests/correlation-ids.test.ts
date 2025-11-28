/**
 * Correlation and Causation ID Tests
 * 
 * Tests the correlation ID generation, propagation, and logging infrastructure.
 * Validates: Requirements 20.5
 */

import { describe, it, expect } from 'vitest';
import {
  generateCorrelationId,
  generateCausationId,
  createRequestContext,
  extractCorrelationId,
  createChildContext,
  formatContextForLogging,
} from '@/lib/utils/correlation';
import { createLogger } from '@/lib/utils/logger';

describe('Correlation ID Generation', () => {
  it('generates valid UUID correlation IDs', () => {
    const id = generateCorrelationId();
    
    // UUID v4 format
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates unique correlation IDs', () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    
    expect(id1).not.toBe(id2);
  });

  it('generates valid UUID causation IDs', () => {
    const id = generateCausationId();
    
    // UUID v4 format
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('generates unique causation IDs', () => {
    const id1 = generateCausationId();
    const id2 = generateCausationId();
    
    expect(id1).not.toBe(id2);
  });
});

describe('Request Context Creation', () => {
  it('creates context with provided correlation ID', () => {
    const correlationId = 'test-correlation-id';
    const context = createRequestContext(correlationId, 'user-123', '/api/test', 'POST');
    
    expect(context.correlationId).toBe(correlationId);
    expect(context.userId).toBe('user-123');
    expect(context.requestUrl).toBe('/api/test');
    expect(context.requestMethod).toBe('POST');
    expect(context.causationId).toBeTruthy();
    expect(context.timestamp).toBeTruthy();
  });

  it('generates correlation ID when not provided', () => {
    const context = createRequestContext(null);
    
    expect(context.correlationId).toBeTruthy();
    expect(context.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('always generates new causation ID', () => {
    const context1 = createRequestContext('same-correlation-id');
    const context2 = createRequestContext('same-correlation-id');
    
    expect(context1.correlationId).toBe(context2.correlationId);
    expect(context1.causationId).not.toBe(context2.causationId);
  });
});

describe('Header Extraction', () => {
  it('extracts correlation ID from headers', () => {
    const headers = new Headers();
    headers.set('X-Correlation-ID', 'test-correlation-id');
    
    const id = extractCorrelationId(headers);
    expect(id).toBe('test-correlation-id');
  });

  it('handles case-insensitive header names', () => {
    const headers = new Headers();
    headers.set('x-correlation-id', 'test-correlation-id');
    
    const id = extractCorrelationId(headers);
    expect(id).toBe('test-correlation-id');
  });

  it('returns null when header is missing', () => {
    const headers = new Headers();
    
    const id = extractCorrelationId(headers);
    expect(id).toBeNull();
  });
});

describe('Child Context Creation', () => {
  it('preserves correlation ID in child context', () => {
    const parentContext = createRequestContext('parent-correlation-id', 'user-123');
    const childContext = createChildContext(parentContext);
    
    expect(childContext.correlationId).toBe(parentContext.correlationId);
  });

  it('generates new causation ID in child context', () => {
    const parentContext = createRequestContext('parent-correlation-id', 'user-123');
    const childContext = createChildContext(parentContext);
    
    expect(childContext.causationId).not.toBe(parentContext.causationId);
  });

  it('preserves user ID in child context', () => {
    const parentContext = createRequestContext('parent-correlation-id', 'user-123');
    const childContext = createChildContext(parentContext);
    
    expect(childContext.userId).toBe(parentContext.userId);
  });

  it('allows overriding user ID in child context', () => {
    const parentContext = createRequestContext('parent-correlation-id', 'user-123');
    const childContext = createChildContext(parentContext, 'user-456');
    
    expect(childContext.userId).toBe('user-456');
  });
});

describe('Context Formatting', () => {
  it('formats context for logging', () => {
    const context = createRequestContext(
      'test-correlation-id',
      'user-123',
      '/api/test',
      'POST'
    );
    
    const formatted = formatContextForLogging(context);
    
    expect(formatted).toHaveProperty('correlationId', 'test-correlation-id');
    expect(formatted).toHaveProperty('causationId');
    expect(formatted).toHaveProperty('userId', 'user-123');
    expect(formatted).toHaveProperty('timestamp');
    expect(formatted).toHaveProperty('requestUrl', '/api/test');
    expect(formatted).toHaveProperty('requestMethod', 'POST');
  });
});

describe('Structured Logger', () => {
  it('creates logger with context', () => {
    const context = createRequestContext('test-correlation-id', 'user-123');
    const logger = createLogger(context);
    
    expect(logger).toBeDefined();
  });

  it('creates logger without context', () => {
    const logger = createLogger();
    
    expect(logger).toBeDefined();
  });

  it('creates child logger with new context', () => {
    const context1 = createRequestContext('correlation-1', 'user-123');
    const logger1 = createLogger(context1);
    
    const context2 = createRequestContext('correlation-2', 'user-456');
    const logger2 = logger1.child(context2);
    
    expect(logger2).toBeDefined();
    expect(logger2).not.toBe(logger1);
  });

  it('logs debug messages', () => {
    const context = createRequestContext('test-correlation-id');
    const logger = createLogger(context);
    
    // Should not throw
    expect(() => logger.debug('Test debug message')).not.toThrow();
  });

  it('logs info messages', () => {
    const context = createRequestContext('test-correlation-id');
    const logger = createLogger(context);
    
    // Should not throw
    expect(() => logger.info('Test info message')).not.toThrow();
  });

  it('logs warning messages', () => {
    const context = createRequestContext('test-correlation-id');
    const logger = createLogger(context);
    
    // Should not throw
    expect(() => logger.warn('Test warning message')).not.toThrow();
  });

  it('logs error messages', () => {
    const context = createRequestContext('test-correlation-id');
    const logger = createLogger(context);
    const error = new Error('Test error');
    
    // Should not throw
    expect(() => logger.error('Test error message', error)).not.toThrow();
  });

  it('logs critical messages', () => {
    const context = createRequestContext('test-correlation-id');
    const logger = createLogger(context);
    const error = new Error('Test critical error');
    
    // Should not throw
    expect(() => logger.critical('Test critical message', error)).not.toThrow();
  });

  it('includes data in log messages', () => {
    const context = createRequestContext('test-correlation-id');
    const logger = createLogger(context);
    
    // Should not throw
    expect(() => logger.info('Test message', { key: 'value' })).not.toThrow();
  });
});

describe('Correlation ID Propagation', () => {
  it('maintains correlation ID through operation chain', () => {
    const correlationId = generateCorrelationId();
    
    // Parent operation
    const parentContext = createRequestContext(correlationId, 'user-123');
    expect(parentContext.correlationId).toBe(correlationId);
    
    // Child operation 1
    const child1Context = createChildContext(parentContext);
    expect(child1Context.correlationId).toBe(correlationId);
    
    // Child operation 2
    const child2Context = createChildContext(parentContext);
    expect(child2Context.correlationId).toBe(correlationId);
    
    // Grandchild operation
    const grandchildContext = createChildContext(child1Context);
    expect(grandchildContext.correlationId).toBe(correlationId);
  });

  it('generates unique causation IDs for each operation', () => {
    const correlationId = generateCorrelationId();
    
    const parentContext = createRequestContext(correlationId);
    const child1Context = createChildContext(parentContext);
    const child2Context = createChildContext(parentContext);
    const grandchildContext = createChildContext(child1Context);
    
    const causationIds = [
      parentContext.causationId,
      child1Context.causationId,
      child2Context.causationId,
      grandchildContext.causationId,
    ];
    
    // All should be unique
    const uniqueIds = new Set(causationIds);
    expect(uniqueIds.size).toBe(causationIds.length);
  });
});
