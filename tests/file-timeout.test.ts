/**
 * Tests for FileTimeout module
 */

import { describe, it, expect } from 'vitest';
import { runWithFileTimeout, createTimeoutViolation } from '../src/core/file-timeout.js';

describe('FileTimeout', () => {
  describe('runWithFileTimeout', () => {
    it('should return result when function completes within timeout', async () => {
      const fn = async () => 'test-result';
      const result = await runWithFileTimeout(fn, '/test/file.ts', { timeoutMs: 1000 });

      expect(result.success).toBe(true);
      expect(result.result).toBe('test-result');
      expect(result.error).toBeUndefined();
      expect(result.isTimeout).toBeUndefined();
    });

    it('should return timeout result when function exceeds timeout', async () => {
      const fn = async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
        return 'should-not-return';
      };
      const result = await runWithFileTimeout(fn, '/test/slow-file.ts', { timeoutMs: 50 });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
      expect(result.isTimeout).toBe(true);
      expect(result.result).toBeUndefined();
    });

    it('should return error result when function throws', async () => {
      const fn = async () => {
        throw new Error('Test error');
      };
      const result = await runWithFileTimeout(fn, '/test/error-file.ts', { timeoutMs: 1000 });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
      expect(result.isTimeout).toBe(false);
      expect(result.result).toBeUndefined();
    });

    it('should use default timeout when not specified', async () => {
      const fn = async () => 'test-result';
      const result = await runWithFileTimeout(fn, '/test/file.ts');

      expect(result.success).toBe(true);
      expect(result.result).toBe('test-result');
    });

    it('should handle async functions that return objects', async () => {
      const fn = async () => ({ data: 'test', count: 42 });
      const result = await runWithFileTimeout(fn, '/test/file.ts', { timeoutMs: 1000 });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ data: 'test', count: 42 });
    });
  });

  describe('createTimeoutViolation', () => {
    it('should create a timeout violation object', () => {
      const violation = createTimeoutViolation('/test/file.ts', 60000);

      expect(violation.id).toBeDefined();
      expect(violation.type).toBe('timeout');
      expect(violation.severity).toBe('warning');
      expect(violation.file.path).toBe('/test/file.ts');
      expect(violation.message).toContain('60000ms');
      expect(violation.rule).toBe('file-timeout');
      expect(violation.autoFixable).toBe(false);
      expect(violation.confidence).toBe(1.0);
    });

    it('should include file extension in violation', () => {
      const violation = createTimeoutViolation('/test/file.ts', 60000);

      expect(violation.file.extension).toBe('ts');
    });

    it('should handle different timeout values', () => {
      const violation = createTimeoutViolation('/test/file.js', 30000);

      expect(violation.message).toContain('30000ms');
    });
  });
});
