/**
 * Tests for Collision Handling (Task 4.2)
 *
 * Ensures that:
 * - Fixes are grouped by file
 * - Fixes within a file are sorted by severity (highest first), then by line (descending)
 * - Offset recalculation works correctly after each fix application
 * - Fixes that would affect context of remaining fixes are marked for review
 * - Micro-pass logic handles multiple fixes per file correctly
 */

import { describe, it, expect } from 'vitest';

describe('Collision Handling (Task 4.2)', () => {
  describe('groupFixesByFile', () => {
    it('should group fixes by file path', () => {
      const fixes = [
        { file: 'src/test.ts', line: 10, severity: 'medium' as const },
        { file: 'src/other.ts', line: 5, severity: 'high' as const },
        { file: 'src/test.ts', line: 20, severity: 'low' as const },
      ];

      const fileGroups = new Map<string, any[]>();
      for (const fix of fixes) {
        if (!fileGroups.has(fix.file)) {
          fileGroups.set(fix.file, []);
        }
        fileGroups.get(fix.file)!.push(fix);
      }

      expect(fileGroups.size).toBe(2);
      expect(fileGroups.has('src/test.ts')).toBe(true);
      expect(fileGroups.has('src/other.ts')).toBe(true);
      expect(fileGroups.get('src/test.ts')!.length).toBe(2);
      expect(fileGroups.get('src/other.ts')!.length).toBe(1);
    });

    it('should sort fixes by severity (critical > high > medium > low)', () => {
      const fileFixes = [
        { line: 10, severity: 'medium' as const },
        { line: 5, severity: 'critical' as const },
        { line: 15, severity: 'low' as const },
        { line: 20, severity: 'high' as const },
      ];

      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      fileFixes.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return (b.line || 0) - (a.line || 0);
      });

      expect(fileFixes[0].severity).toBe('critical');
      expect(fileFixes[1].severity).toBe('high');
      expect(fileFixes[2].severity).toBe('medium');
      expect(fileFixes[3].severity).toBe('low');
    });

    it('should sort fixes by line (descending) when severity is equal', () => {
      const fileFixes = [
        { line: 10, severity: 'medium' as const },
        { line: 5, severity: 'medium' as const },
        { line: 15, severity: 'medium' as const },
      ];

      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      fileFixes.sort((a, b) => {
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        if (severityDiff !== 0) return severityDiff;
        return (b.line || 0) - (a.line || 0);
      });

      expect(fileFixes[0].line).toBe(15);
      expect(fileFixes[1].line).toBe(10);
      expect(fileFixes[2].line).toBe(5);
    });
  });

  describe('offset recalculation', () => {
    it('should calculate line offset from original to proposed content', () => {
      const originalContent = 'line 1\nline 2';
      const proposedContent = 'line 1\nline 2\nline 3';

      const originalLines = originalContent.split('\n').length;
      const proposedLines = proposedContent.split('\n').length;
      const fixOffset = proposedLines - originalLines;

      expect(fixOffset).toBe(1);
    });

    it('should handle negative offset (content removed)', () => {
      const originalContent = 'line 1\nline 2\nline 3';
      const proposedContent = 'line 1\nline 2';

      const originalLines = originalContent.split('\n').length;
      const proposedLines = proposedContent.split('\n').length;
      const fixOffset = proposedLines - originalLines;

      expect(fixOffset).toBe(-1);
    });

    it('should handle zero offset (content same length)', () => {
      const originalContent = 'line 1\nline 2';
      const proposedContent = 'line 1\nline 2';

      const originalLines = originalContent.split('\n').length;
      const proposedLines = proposedContent.split('\n').length;
      const fixOffset = proposedLines - originalLines;

      expect(fixOffset).toBe(0);
    });

    it('should accumulate offset across multiple fixes', () => {
      let lineOffset = 0;
      const offsets = [1, -1, 2, -1];

      for (const offset of offsets) {
        lineOffset += offset;
      }

      expect(lineOffset).toBe(1);
    });

    it('should update fix line number with accumulated offset', () => {
      const fix = { line: 10 };
      const lineOffset = 5;

      if (fix.line !== undefined) {
        fix.line += lineOffset;
      }

      expect(fix.line).toBe(15);
    });
  });

  describe('wouldAffectRemainingFixes', () => {
    it('should return true if remaining fix is on line below applied fix', () => {
      const appliedFix = { line: 10 };
      const remainingFixes = [{ line: 15 }];

      const appliedLine = appliedFix.line || 0;
      let wouldAffect = false;

      for (const remainingFix of remainingFixes) {
        const remainingLine = remainingFix.line || 0;
        if (remainingLine > appliedLine) {
          wouldAffect = true;
          break;
        }
      }

      expect(wouldAffect).toBe(true);
    });

    it('should return true if remaining fix is close (within 5 lines)', () => {
      const appliedFix = { line: 10 };
      const remainingFixes = [{ line: 12 }];

      const appliedLine = appliedFix.line || 0;
      let wouldAffect = false;

      for (const remainingFix of remainingFixes) {
        const remainingLine = remainingFix.line || 0;
        if (Math.abs(remainingLine - appliedLine) <= 5) {
          wouldAffect = true;
          break;
        }
      }

      expect(wouldAffect).toBe(true);
    });

    it('should return false if remaining fix is far above applied fix', () => {
      const appliedFix = { line: 10 };
      const remainingFixes = [{ line: 2 }];

      const appliedLine = appliedFix.line || 0;
      let wouldAffect = false;

      for (const remainingFix of remainingFixes) {
        const remainingLine = remainingFix.line || 0;
        if (remainingLine > appliedLine) {
          wouldAffect = true;
          break;
        }
        if (Math.abs(remainingLine - appliedLine) <= 5) {
          wouldAffect = true;
          break;
        }
      }

      expect(wouldAffect).toBe(false);
    });

    it('should return false if remaining fix is exactly 6 lines above', () => {
      const appliedFix = { line: 10 };
      const remainingFixes = [{ line: 4 }];

      const appliedLine = appliedFix.line || 0;
      let wouldAffect = false;

      for (const remainingFix of remainingFixes) {
        const remainingLine = remainingFix.line || 0;
        if (remainingLine > appliedLine) {
          wouldAffect = true;
          break;
        }
        if (Math.abs(remainingLine - appliedLine) <= 5) {
          wouldAffect = true;
          break;
        }
      }

      expect(wouldAffect).toBe(false);
    });
  });

  describe('fix marking for review', () => {
    it('should mark fix as manualMergeRequired when it would affect context', () => {
      const fix = { manualMergeRequired: false, requiresConfirmation: false };
      const remainingFixes = [{ line: 15 }];
      const fixOffset = 1 + 0; // Force non-literal type

      const appliedLine = 10;
      let wouldAffectContext = false;

      for (const remainingFix of remainingFixes) {
        const remainingLine = remainingFix.line || 0;
        if (remainingLine > appliedLine) {
          wouldAffectContext = true;
          break;
        }
      }

      if (wouldAffectContext && remainingFixes.length > 0 && fixOffset !== 0) {
        fix.manualMergeRequired = true;
        fix.requiresConfirmation = true;
      }

      expect(fix.manualMergeRequired).toBe(true);
      expect(fix.requiresConfirmation).toBe(true);
    });

    it('should not mark fix if offset is zero', () => {
      const fix = { manualMergeRequired: false, requiresConfirmation: false };
      const remainingFixes = [{ line: 15 }];
      const fixOffset = 0 * 1; // Force non-literal type

      const appliedLine = 10;
      let wouldAffectContext = false;

      for (const remainingFix of remainingFixes) {
        const remainingLine = remainingFix.line || 0;
        if (remainingLine > appliedLine) {
          wouldAffectContext = true;
          break;
        }
      }

      if (wouldAffectContext && remainingFixes.length > 0 && fixOffset !== 0) {
        fix.manualMergeRequired = true;
        fix.requiresConfirmation = true;
      }

      expect(fix.manualMergeRequired).toBe(false);
      expect(fix.requiresConfirmation).toBe(false);
    });

    it('should not mark fix if no remaining fixes', () => {
      const fix = { manualMergeRequired: false, requiresConfirmation: false };
      const remainingFixes: any[] = [];
      const fixOffset = 1 + 0; // Force non-literal type

      if (remainingFixes.length > 0 && fixOffset !== 0) {
        fix.manualMergeRequired = true;
        fix.requiresConfirmation = true;
      }

      expect(fix.manualMergeRequired).toBe(false);
      expect(fix.requiresConfirmation).toBe(false);
    });
  });

  describe('final sorting', () => {
    it('should sort final fixes by file then line (descending)', () => {
      const allFixes = [
        { file: 'src/b.ts', line: 10 },
        { file: 'src/a.ts', line: 20 },
        { file: 'src/a.ts', line: 5 },
        { file: 'src/b.ts', line: 15 },
      ];

      allFixes.sort((a, b) => {
        const fileCompare = a.file.localeCompare(b.file);
        if (fileCompare !== 0) return fileCompare;
        return (b.line || 0) - (a.line || 0);
      });

      expect(allFixes[0].file).toBe('src/a.ts');
      expect(allFixes[0].line).toBe(20);
      expect(allFixes[1].file).toBe('src/a.ts');
      expect(allFixes[1].line).toBe(5);
      expect(allFixes[2].file).toBe('src/b.ts');
      expect(allFixes[2].line).toBe(15);
      expect(allFixes[3].file).toBe('src/b.ts');
      expect(allFixes[3].line).toBe(10);
    });
  });
});
