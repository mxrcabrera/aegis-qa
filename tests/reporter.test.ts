/**
 * Reporter Tests
 *
 * Tests for the ReportAggregator module, specifically testing the
 * rate limiting functionality for violation output.
 *
 * @module reporter.test
 * @since 2.0.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReportAggregator } from '../src/core/reporter.js';
import type { Violation } from '../src/types/audit.js';

describe('ReportAggregator - Rate Limiting', () => {
  let aggregator: ReportAggregator;
  const mockProjectRoot = '/test/project';

  beforeEach(() => {
    aggregator = new ReportAggregator({ projectRoot: mockProjectRoot });
  });

  const createMockViolation = (category: string, message: string, file: string = 'test.ts'): Violation => ({
    id: `violation-${Math.random()}`,
    type: category as any,
    severity: 'medium' as any,
    message,
    file: {
      path: file,
      extension: '.ts',
      lineCount: 100,
      inCriticalPath: false,
    },
    location: {
      line: 1,
      column: 0,
    },
    rule: category,
    autoFixable: false,
    confidence: 1.0,
  });

  describe('generateSummary with default cap', () => {
    it('should cap violations at 50 per category by default', () => {
      // Add 60 violations in the 'style' category
      for (let i = 0; i < 60; i++) {
        aggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }

      const summary = aggregator.generateSummary();

      // Should show total count
      expect(summary).toContain('**Total:** 60');
      
      // Should show cap message
      expect(summary).toContain('... and 10 more style violations');
      expect(summary).toContain('Run with --verbose for full list');
    });

    it('should not cap when violations are under the limit', () => {
      // Add 30 violations in the 'style' category
      for (let i = 0; i < 30; i++) {
        aggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }

      const summary = aggregator.generateSummary();

      // Should show total count
      expect(summary).toContain('**Total:** 30');
      
      // Should NOT show cap message in the category section
      expect(summary).not.toContain('... and 20 more style violations');
      expect(summary).not.toContain('Run with --verbose for full list');
    });

    it('should cap violations independently per category', () => {
      // Add 60 violations in 'style' category
      for (let i = 0; i < 60; i++) {
        aggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }

      // Add 40 violations in 'security' category
      for (let i = 0; i < 40; i++) {
        aggregator.addViolation('security-scanner', createMockViolation('security', `Security violation ${i}`));
      }

      const summary = aggregator.generateSummary();

      // Should show cap message for style (60 > 50)
      expect(summary).toContain('... and 10 more style violations');
      
      // Should NOT show cap message for security (40 < 50)
      expect(summary).not.toContain('more security violations');
    });
  });

  describe('generateSummary with custom cap', () => {
    it('should respect custom maxViolationsPerCategory', () => {
      const customAggregator = new ReportAggregator({
        projectRoot: mockProjectRoot,
        maxViolationsPerCategory: 10,
      });

      // Add 20 violations in the 'style' category
      for (let i = 0; i < 20; i++) {
        customAggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }

      const summary = customAggregator.generateSummary();

      // Should show total count
      expect(summary).toContain('**Total:** 20');
      
      // Should show cap message with custom limit
      expect(summary).toContain('... and 10 more style violations');
    });
  });

  describe('generateSummary with verbose mode', () => {
    it('should show all violations when verbose is true', () => {
      const verboseAggregator = new ReportAggregator({
        projectRoot: mockProjectRoot,
        verbose: true,
      });

      // Add 60 violations in the 'style' category
      for (let i = 0; i < 60; i++) {
        verboseAggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }

      const summary = verboseAggregator.generateSummary();

      // Should show total count
      expect(summary).toContain('**Total:** 60');
      
      // Should NOT show cap message in verbose mode (specific pattern)
      expect(summary).not.toContain('... and 10 more style violations. Run with --verbose for full list');
    });

    it('should override custom cap when verbose is true', () => {
      const verboseAggregator = new ReportAggregator({
        projectRoot: mockProjectRoot,
        maxViolationsPerCategory: 5,
        verbose: true,
      });

      // Add 20 violations in the 'style' category
      for (let i = 0; i < 20; i++) {
        verboseAggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }

      const summary = verboseAggregator.generateSummary();

      // Should show total count
      expect(summary).toContain('**Total:** 20');
      
      // Should NOT show cap message in verbose mode (specific pattern)
      expect(summary).not.toContain('... and 15 more style violations. Run with --verbose for full list');
    });
  });

  describe('generateSummary always shows total counts', () => {
    it('should always show total violation count regardless of cap', () => {
      const cappedAggregator = new ReportAggregator({
        projectRoot: mockProjectRoot,
        maxViolationsPerCategory: 10,
      });

      // Add 100 violations in the 'style' category
      for (let i = 0; i < 100; i++) {
        cappedAggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }

      const summary = cappedAggregator.generateSummary();

      // Should show total count in summary section
      expect(summary).toContain('**Total Violations:** 100');
      
      // Should show total count in category section
      expect(summary).toContain('**Total:** 100');
    });

    it('should always show category counts regardless of cap', () => {
      const cappedAggregator = new ReportAggregator({
        projectRoot: mockProjectRoot,
        maxViolationsPerCategory: 10,
      });

      // Add violations in multiple categories
      for (let i = 0; i < 100; i++) {
        cappedAggregator.addViolation('style-auditor', createMockViolation('style', `Style violation ${i}`));
      }
      for (let i = 0; i < 50; i++) {
        cappedAggregator.addViolation('security-scanner', createMockViolation('security', `Security violation ${i}`));
      }

      const summary = cappedAggregator.generateSummary();

      // Should show category counts
      expect(summary).toContain('**style:** 100');
      expect(summary).toContain('**security:** 50');
    });
  });
});
