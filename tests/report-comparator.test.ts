/**
 * Tests for Report Comparator Module
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ReportComparator, type ComparisonResult, type Violation } from '../src/core/report-comparator.js';

describe('Report Comparator', () => {
  const testDir = path.join(process.cwd(), 'test-temp-reports');
  const report1Path = path.join(testDir, 'report1.md');
  const report2Path = path.join(testDir, 'report2.md');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create test report 1 (older)
    const report1Content = `# QA Report

Generated: 2024-01-01T10:00:00

## Critical Findings

- [CRIT-001] **CRITICAL** src/file.ts:10
  - Critical security vulnerability

- [CRIT-002] **CRITICAL** src/other.ts:20
  - Another critical issue

## High Severity

- [HIGH-001] **HIGH** src/file.ts:15
  - High severity issue

## Medium Severity

- [MED-001] **MEDIUM** src/file.ts:25
  - Medium severity issue
`;
    fs.writeFileSync(report1Path, report1Content, 'utf-8');

    // Create test report 2 (newer)
    const report2Content = `# QA Report

Generated: 2024-01-02T10:00:00

## Critical Findings

- [CRIT-001] **CRITICAL** src/file.ts:10
  - Critical security vulnerability

## High Severity

- [HIGH-001] **HIGH** src/file.ts:15
  - High severity issue

- [HIGH-002] **HIGH** src/new-file.ts:30
  - New high severity issue

## Low Severity

- [LOW-001] **LOW** src/file.ts:35
  - Low severity issue
`;
    fs.writeFileSync(report2Path, report2Content, 'utf-8');
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('ReportComparator', () => {
    it('should compare two reports and identify resolved violations', () => {
      const comparator = new ReportComparator();
      const comparison = comparator.compare(report1Path, report2Path);

      expect(comparison.resolvedViolations).toHaveLength(2);
      expect(comparison.resolvedViolations[0].id).toBe('CRIT-002');
      expect(comparison.resolvedViolations[1].id).toBe('MED-001');
    });

    it('should compare two reports and identify new violations', () => {
      const comparator = new ReportComparator();
      const comparison = comparator.compare(report1Path, report2Path);

      expect(comparison.newViolations).toHaveLength(2);
      expect(comparison.newViolations[0].id).toBe('HIGH-002');
      expect(comparison.newViolations[1].id).toBe('LOW-001');
    });

    it('should compare two reports and identify unchanged violations', () => {
      const comparator = new ReportComparator();
      const comparison = comparator.compare(report1Path, report2Path);

      expect(comparison.unchangedViolations).toHaveLength(2);
      expect(comparison.unchangedViolations[0].id).toBe('CRIT-001');
      expect(comparison.unchangedViolations[1].id).toBe('HIGH-001');
    });

    it('should calculate correct summary deltas', () => {
      const comparator = new ReportComparator();
      const comparison = comparator.compare(report1Path, report2Path);

      expect(comparison.summary.totalBefore).toBe(4);
      expect(comparison.summary.totalAfter).toBe(4);
      expect(comparison.summary.delta).toBe(0);
      expect(comparison.summary.criticalDelta).toBe(-1);
      expect(comparison.summary.highDelta).toBe(1);
      expect(comparison.summary.mediumDelta).toBe(-1);
      expect(comparison.summary.lowDelta).toBe(1);
    });

    it('should determine trend correctly when improving', () => {
      const improvingReportPath = path.join(testDir, 'improving.md');
      fs.writeFileSync(
        improvingReportPath,
        `# QA Report

Generated: 2024-01-02T10:00:00

## Critical Findings

- [CRIT-001] **CRITICAL** src/file.ts:10
  - Critical security vulnerability
`,
        'utf-8'
      );

      const comparator = new ReportComparator();
      const comparison = comparator.compare(report1Path, improvingReportPath);
      expect(comparison.trend).toBe('improving');
    });

    it('should determine trend correctly when degrading', () => {
      const degradingReportPath = path.join(testDir, 'degrading.md');
      fs.writeFileSync(
        degradingReportPath,
        `# QA Report

Generated: 2024-01-02T10:00:00

## Critical Findings

- [CRIT-001] **CRITICAL** src/file.ts:10
  - Critical security vulnerability

- [CRIT-002] **CRITICAL** src/other.ts:20
  - Another critical issue

- [CRIT-003] **CRITICAL** src/new.ts:30
  - New critical issue
`,
        'utf-8'
      );

      const comparator = new ReportComparator();
      const comparison = comparator.compare(report1Path, degradingReportPath);
      expect(comparison.trend).toBe('degrading');
    });

    it('should determine trend correctly when stable', () => {
      const comparator = new ReportComparator();
      const comparison = comparator.compare(report1Path, report2Path);
      expect(comparison.trend).toBe('stable');
    });
  });
});
