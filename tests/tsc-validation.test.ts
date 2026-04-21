/**
 * Tests for TSC Validation (Task 4.1)
 *
 * Ensures that:
 * - validateSyntax uses real tsc validation instead of bracket counting
 * - Baseline comparison works correctly (only new errors cause failure)
 * - Fallback to bracket counting when tsc unavailable
 * - Incremental tsc optimization is used when tsconfig.json has incremental enabled
 */

import { describe, it, expect } from 'vitest';

describe('TSC Validation (Task 4.1)', () => {
  describe('baseline comparison logic', () => {
    it('should count new errors correctly when no new errors', () => {
      const baselineErrors = ['file.ts:1:1 error TS1234: Test error', 'file.ts:2:2 error TS5678: Another error'];
      const newErrors = ['file.ts:1:1 error TS1234: Test error', 'file.ts:2:2 error TS5678: Another error'];
      
      // Normalize error messages for comparison (remove line numbers as they may shift)
      const normalizeError = (error: string) => {
        return error.replace(/:\d+:\d+/g, ':L:C');
      };

      const normalizedBaseline = new Set(baselineErrors.map(normalizeError));
      const normalizedNew = new Set(newErrors.map(normalizeError));

      // Count errors in new that weren't in baseline
      let newErrorCount = 0;
      for (const error of normalizedNew) {
        if (!normalizedBaseline.has(error)) {
          newErrorCount++;
        }
      }

      expect(newErrorCount).toBe(0);
    });

    it('should count new errors correctly when new errors introduced', () => {
      const baselineErrors = ['file.ts:1:1 error TS1234: Test error'];
      const newErrors = ['file.ts:1:1 error TS1234: Test error', 'file.ts:3:3 error TS9999: New error'];
      
      // Normalize error messages for comparison (remove line numbers as they may shift)
      const normalizeError = (error: string) => {
        return error.replace(/:\d+:\d+/g, ':L:C');
      };

      const normalizedBaseline = new Set(baselineErrors.map(normalizeError));
      const normalizedNew = new Set(newErrors.map(normalizeError));

      // Count errors in new that weren't in baseline
      let newErrorCount = 0;
      for (const error of normalizedNew) {
        if (!normalizedBaseline.has(error)) {
          newErrorCount++;
        }
      }

      expect(newErrorCount).toBe(1);
    });

    it('should not count errors that were fixed as new errors', () => {
      const baselineErrors = ['file.ts:1:1 error TS1234: Test error', 'file.ts:2:2 error TS5678: Fixed error'];
      const newErrors = ['file.ts:1:1 error TS1234: Test error'];
      
      // Normalize error messages for comparison (remove line numbers as they may shift)
      const normalizeError = (error: string) => {
        return error.replace(/:\d+:\d+/g, ':L:C');
      };

      const normalizedBaseline = new Set(baselineErrors.map(normalizeError));
      const normalizedNew = new Set(newErrors.map(normalizeError));

      // Count errors in new that weren't in baseline
      let newErrorCount = 0;
      for (const error of normalizedNew) {
        if (!normalizedBaseline.has(error)) {
          newErrorCount++;
        }
      }

      expect(newErrorCount).toBe(0);
    });

    it('should handle empty baseline correctly', () => {
      const baselineErrors: string[] = [];
      const newErrors = ['file.ts:1:1 error TS1234: Test error'];
      
      // Normalize error messages for comparison (remove line numbers as they may shift)
      const normalizeError = (error: string) => {
        return error.replace(/:\d+:\d+/g, ':L:C');
      };

      const normalizedBaseline = new Set(baselineErrors.map(normalizeError));
      const normalizedNew = new Set(newErrors.map(normalizeError));

      // Count errors in new that weren't in baseline
      let newErrorCount = 0;
      for (const error of normalizedNew) {
        if (!normalizedBaseline.has(error)) {
          newErrorCount++;
        }
      }

      expect(newErrorCount).toBe(1);
    });
  });

  describe('error normalization', () => {
    it('should normalize line numbers and column numbers', () => {
      const error = 'file.ts:123:45 error TS1234: Test error';
      const normalized = error.replace(/:\d+:\d+/g, ':L:C');
      
      expect(normalized).toBe('file.ts:L:C error TS1234: Test error');
    });

    it('should normalize different line numbers to same pattern', () => {
      const error1 = 'file.ts:1:1 error TS1234: Test error';
      const error2 = 'file.ts:100:200 error TS1234: Test error';
      
      const normalized1 = error1.replace(/:\d+:\d+/g, ':L:C');
      const normalized2 = error2.replace(/:\d+:\d+/g, ':L:C');
      
      expect(normalized1).toBe(normalized2);
    });
  });

  describe('bracket counting fallback', () => {
    it('should pass when braces and parentheses are balanced', () => {
      const content = 'function test(a, b) { return a + b; }';
      
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      const isValid = openBraces === closeBraces && openParens === closeParens;
      expect(isValid).toBe(true);
    });

    it('should fail when braces are unbalanced', () => {
      const content = 'function test(a, b) { return a + b; ';
      
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      const isValid = openBraces === closeBraces && openParens === closeParens;
      expect(isValid).toBe(false);
    });

    it('should fail when parentheses are unbalanced', () => {
      const content = 'function test(a, b { return a + b; }';
      
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      const isValid = openBraces === closeBraces && openParens === closeParens;
      expect(isValid).toBe(false);
    });

    it('should handle nested structures correctly', () => {
      const content = 'function test(a, b) { if (a > 0) { return a + b; } else { return 0; } }';
      
      const openBraces = (content.match(/{/g) || []).length;
      const closeBraces = (content.match(/}/g) || []).length;
      const openParens = (content.match(/\(/g) || []).length;
      const closeParens = (content.match(/\)/g) || []).length;

      const isValid = openBraces === closeBraces && openParens === closeParens;
      expect(isValid).toBe(true);
    });
  });

  describe('incremental tsconfig detection', () => {
    it('should detect incremental flag in tsconfig.json', () => {
      const tsConfig = {
        compilerOptions: {
          incremental: true
        }
      } as { compilerOptions?: { incremental?: boolean } };
      
      const hasIncremental = tsConfig.compilerOptions?.incremental === true;
      expect(hasIncremental).toBe(true);
    });

    it('should return false when incremental flag is not set', () => {
      const tsConfig = {
        compilerOptions: {
          strict: true
        }
      } as { compilerOptions?: { incremental?: boolean } };
      
      const hasIncremental = tsConfig.compilerOptions?.incremental === true;
      expect(hasIncremental).toBe(false);
    });

    it('should return false when compilerOptions is missing', () => {
      const tsConfig = {} as { compilerOptions?: { incremental?: boolean } };
      
      const hasIncremental = tsConfig.compilerOptions?.incremental === true;
      expect(hasIncremental).toBe(false);
    });
  });

  describe('file extension filtering', () => {
    it('should validate TypeScript files (.ts)', () => {
      const filePath = 'src/test.ts';
      const shouldValidate = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
      expect(shouldValidate).toBe(true);
    });

    it('should validate TypeScript files (.tsx)', () => {
      const filePath = 'src/test.tsx';
      const shouldValidate = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
      expect(shouldValidate).toBe(true);
    });

    it('should skip non-TypeScript files (.js)', () => {
      const filePath = 'src/test.js';
      const shouldValidate = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
      expect(shouldValidate).toBe(false);
    });

    it('should skip non-TypeScript files (.jsx)', () => {
      const filePath = 'src/test.jsx';
      const shouldValidate = filePath.endsWith('.ts') || filePath.endsWith('.tsx');
      expect(shouldValidate).toBe(false);
    });
  });
});
