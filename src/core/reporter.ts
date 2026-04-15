/**
 * Report Aggregator - Centralized Violation Management
 *
 * This module provides a centralized system for collecting and managing
 * violations from all auditors (CodeReader, StyleAuditor, SecurityScanner).
 * It ensures that all violations are aggregated in one place for consistent
 * reporting and analysis.
 *
 * @module reporter
 * @since 1.0.0
 */

import type { Violation } from '../types/audit.js';

/**
 * Aggregated report results
 */
export interface AggregatedReport {
  /** Total violations across all auditors */
  totalViolations: number;

  /** All violations */
  violations: Violation[];

  /** Breakdown by severity */
  severityBreakdown: Record<string, number>;

  /** Timestamp of report generation */
  timestamp: Date;
}

/**
 * Severity levels for violations
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Violation category
 */
export type ViolationCategory =
  | 'style'
  | 'security'
  | 'accessibility'
  | 'performance'
  | 'code-quality'
  | 'business-logic';

/**
 * Report aggregator configuration
 */
export interface ReporterConfig {
  /** Whether to automatically escalate severity for critical path violations */
  autoEscalateCriticalPath: boolean;
  /** Severity escalation mapping */
  escalationMap: Map<string, Severity>;
}

/**
 * Report aggregator class
 *
 * Centralizes all violations from different auditors and provides
 * methods for aggregation, filtering, and escalation.
 */
export class ReportAggregator {
  private violations: Map<string, Violation[]> = new Map();
  private config: Required<ReporterConfig>;

  /**
   * Creates a new ReportAggregator instance
   *
   * @param config - Configuration for the reporter
   */
  constructor(config: Partial<ReporterConfig> = {}) {
    this.config = {
      autoEscalateCriticalPath: config.autoEscalateCriticalPath ?? true,
      escalationMap:
        config.escalationMap ??
        new Map([
          ['low', 'medium'],
          ['medium', 'high'],
          ['high', 'critical'],
        ]),
    };
  }

  /**
   * Adds a violation to the aggregator
   *
   * @param auditorName - Name of the auditor (e.g., 'style-auditor', 'security-scanner')
   * @param violation - Violation to add
   */
  addViolation(auditorName: string, violation: Violation): void {
    if (!this.violations.has(auditorName)) {
      this.violations.set(auditorName, []);
    }

    // Auto-escalate severity if file is in critical path
    const escalatedViolation = this.autoEscalate(violation);
    this.violations.get(auditorName)!.push(escalatedViolation);
  }

  /**
   * Adds multiple violations from an auditor
   *
   * @param auditorName - Name of the auditor
   * @param violations - Array of violations to add
   */
  addViolations(auditorName: string, violations: Violation[]): void {
    for (const violation of violations) {
      this.addViolation(auditorName, violation);
    }
  }

  /**
   * Auto-escalates violation severity based on critical path
   *
   * @private
   * @param violation - Violation to potentially escalate
   * @returns Violation - Escalated violation if applicable
   */
  private autoEscalate(violation: Violation): Violation {
    if (!this.config.autoEscalateCriticalPath) {
      return violation;
    }

    if (!violation.file.inCriticalPath) {
      return violation;
    }

    const currentSeverity = violation.severity as string;
    const escalatedSeverity = this.config.escalationMap.get(currentSeverity);

    if (escalatedSeverity && escalatedSeverity !== currentSeverity) {
      return {
        ...violation,
        severity: escalatedSeverity as any,
        message: `${violation.message} (ESCALATED: File in critical path)`,
      };
    }

    return violation;
  }

  /**
   * Gets all violations from a specific auditor
   *
   * @param auditorName - Name of the auditor
   * @returns Violation[] - Array of violations
   */
  getViolations(auditorName: string): Violation[] {
    return this.violations.get(auditorName) || [];
  }

  /**
   * Gets all violations from all auditors
   *
   * @returns Map<string, Violation[]> - Map of auditor name to violations
   */
  getAllViolations(): Map<string, Violation[]> {
    return new Map(this.violations);
  }

  /**
   * Gets all violations flattened into a single array
   *
   * @returns Violation[] - All violations from all auditors
   */
  getAllViolationsFlattened(): Violation[] {
    const all: Violation[] = [];
    for (const violations of this.violations.values()) {
      all.push(...violations);
    }
    return all;
  }

  /**
   * Filters violations by severity
   *
   * @param severity - Severity level to filter by
   * @returns Violation[] - Filtered violations
   */
  filterBySeverity(severity: Severity): Violation[] {
    return this.getAllViolationsFlattened().filter((v) => v.severity === severity);
  }

  /**
   * Filters violations by category
   *
   * @param category - Category to filter by
   * @returns Violation[] - Filtered violations
   */
  filterByCategory(category: ViolationCategory): Violation[] {
    return this.getAllViolationsFlattened().filter((v) => v.type === category);
  }

  /**
   * Filters violations by critical path
   *
   * @param inCriticalPath - Whether to filter for critical path violations
   * @returns Violation[] - Filtered violations
   */
  filterByCriticalPath(inCriticalPath: boolean): Violation[] {
    return this.getAllViolationsFlattened().filter((v) => v.file.inCriticalPath === inCriticalPath);
  }

  /**
   * Gets violation count by severity
   *
   * @returns Map<Severity, number> - Count of violations by severity
   */
  getCountBySeverity(): Map<Severity, number> {
    const counts = new Map<Severity, number>();
    const all = this.getAllViolationsFlattened();

    for (const violation of all) {
      const severity = violation.severity as Severity;
      counts.set(severity, (counts.get(severity) || 0) + 1);
    }

    return counts;
  }

  /**
   * Gets violation count by category
   *
   * @returns Map<ViolationCategory, number> - Count of violations by category
   */
  getCountByCategory(): Map<ViolationCategory, number> {
    const counts = new Map<ViolationCategory, number>();
    const all = this.getAllViolationsFlattened();

    for (const violation of all) {
      const category = violation.type as ViolationCategory;
      counts.set(category, (counts.get(category) || 0) + 1);
    }

    return counts;
  }

  /**
   * Clears all violations from a specific auditor
   *
   * @param auditorName - Name of the auditor
   */
  clearViolations(auditorName: string): void {
    this.violations.delete(auditorName);
  }

  /**
   * Clears all violations from all auditors
   */
  clearAll(): void {
    this.violations.clear();
  }

  /**
   * Generates a summary of all violations
   *
   * @returns string - Markdown formatted summary
   */
  generateSummary(): string {
    const all = this.getAllViolationsFlattened();
    const severityCounts = this.getCountBySeverity();
    const categoryCounts = this.getCountByCategory();
    const criticalPathCount = all.filter((v) => v.file.inCriticalPath).length;

    let summary = '# Aegis QA Report\n\n';

    summary += `**Total Violations:** ${all.length}\n`;
    summary += `**Critical Path Violations:** ${criticalPathCount}\n\n`;

    summary += '## By Severity\n\n';
    for (const [severity, count] of severityCounts.entries()) {
      summary += `- **${severity.toUpperCase()}:** ${count}\n`;
    }

    summary += '\n## By Category\n\n';
    for (const [category, count] of categoryCounts.entries()) {
      summary += `- **${category}:** ${count}\n`;
    }

    // Applied/Suggested Fixes section
    summary += '\n## 🔧 Applied/Suggested Fixes\n\n';
    summary += '*Atomic fixes applied or suggested from Phase 11*\n\n';
    summary += '- **Status:** Check partial report for detailed fix results\n';
    summary += '- **Patch Files:** Available in .sentinel/diffs/\n';
    summary += '- **Core Path Fixes:** Require explicit confirmation\n\n';

    return summary;
  }

  /**
   * Exports violations as AggregatedReport
   *
   * @returns AggregatedReport - Complete aggregated report
   */
  exportResults(): AggregatedReport {
    const all = this.getAllViolationsFlattened();
    const severityCounts = this.getCountBySeverity();

    return {
      totalViolations: all.length,
      violations: all,
      severityBreakdown: Object.fromEntries(severityCounts),
      timestamp: new Date(),
    };
  }
}
