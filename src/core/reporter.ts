/**
 * Report Aggregator - Centralized Violation Management
 *
 * This module provides a centralized system for collecting and managing
 * violations from all auditors (CodeReader, StyleAuditor, SecurityScanner).
 * It ensures that all violations are aggregated in one place for consistent
 * reporting and analysis.
 *
 * Error Delta Reporting:
 * - Integrates with ErrorBaseline to separate new vs inherited issues
 * - Smart exit code: success if only inherited errors, failure if new errors
 *
 * @module reporter
 * @since 1.0.0
 */

import type { Violation } from '../types/audit.js';
import { ErrorBaseline, type TSCError } from './error-baseline.js';
import { SecretSanitizer } from './secret-sanitizer.js';

/**
 * Aggregated report results
 */
export interface AggregatedReport {
  /** Total violations across all auditors */
  totalViolations: number;

  /** All violations */
  violations: Violation[];

  /** New violations (not in baseline) */
  newViolations: Violation[];

  /** Inherited violations (in baseline) */
  inheritedViolations: Violation[];

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
  /** Project root directory for ErrorBaseline */
  projectRoot?: string;
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
  private businessRiskFindings: any[] = [];
  private businessDomain: string = 'General';
  private errorBaseline: ErrorBaseline | null = null;
  private baselineEstablished: boolean = false;
  private secretSanitizer: SecretSanitizer;

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
      projectRoot: config.projectRoot ?? '.',
    };
    this.secretSanitizer = new SecretSanitizer();
  }

  /**
   * Sanitizes report content to remove secrets
   *
   * @private
   * @param content - Content to sanitize
   * @returns string - Sanitized content
   */
  private sanitizeReport(content: string): string {
    return this.secretSanitizer.sanitizeReport(content);
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
   * Sets business risk findings from Phase 2 for context-aware escalation
   *
   * @param riskFindings - Business risk findings from Phase 2
   */
  setBusinessRiskFindings(riskFindings: any[]): void {
    this.businessRiskFindings = riskFindings;
    // Extract business domain from risk findings if available
    if (riskFindings.length > 0 && riskFindings[0].domain) {
      this.businessDomain = riskFindings[0].domain;
    }
  }

  /**
   * Auto-escalates violation severity based on critical path and business context
   *
   * @private
   * @param violation - Violation to potentially escalate
   * @returns Violation - Escalated violation if applicable
   */
  private autoEscalate(violation: Violation): Violation {
    if (!this.config.autoEscalateCriticalPath) {
      return violation;
    }

    let escalateReason = '';
    const currentSeverity = violation.severity as string;
    let escalatedSeverity = this.config.escalationMap.get(currentSeverity);

    // 1. Critical path escalation
    if (violation.file.inCriticalPath) {
      escalateReason = 'File in critical path';
    }

    // 2. Business context escalation (e.g., Fintech: Medium → Critical)
    if (this.businessDomain === 'Fintech' && currentSeverity === 'medium') {
      escalatedSeverity = 'critical';
      escalateReason = escalateReason ? `${escalateReason} + Fintech domain` : 'Fintech domain';
    } else if (this.businessDomain === 'Health' && currentSeverity === 'medium') {
      escalatedSeverity = 'critical';
      escalateReason = escalateReason ? `${escalateReason} + Healthtech domain` : 'Healthtech domain';
    } else if ((this.businessDomain === 'Fintech' || this.businessDomain === 'Health') && currentSeverity === 'high') {
      escalatedSeverity = 'critical';
      escalateReason = escalateReason ? `${escalateReason} + Critical domain` : 'Critical domain';
    }

    if (escalatedSeverity && escalatedSeverity !== currentSeverity) {
      return {
        ...violation,
        severity: escalatedSeverity as any,
        message: `${violation.message} (ESCALATED: ${escalateReason})`,
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
   * Establishes error baseline by running tsc --noEmit
   *
   * @returns Promise<void>
   */
  async establishBaseline(): Promise<void> {
    if (!this.errorBaseline) {
      console.warn('[ReportAggregator] No ErrorBaseline instance, skipping baseline establishment');
      return;
    }

    await this.errorBaseline.establishBaseline();
    this.baselineEstablished = true;
  }

  /**
   * Separates violations into new and inherited based on baseline
   *
   * @returns { newViolations: Violation[], inheritedViolations: Violation[] }
   */
  separateViolations(): { newViolations: Violation[]; inheritedViolations: Violation[] } {
    const allViolations = this.getAllViolationsFlattened();

    if (!this.baselineEstablished || !this.errorBaseline) {
      // If no baseline, all violations are considered new
      return {
        newViolations: allViolations,
        inheritedViolations: [],
      };
    }

    const baseline = this.errorBaseline.getBaseline();
    if (!baseline || baseline.totalErrors === 0) {
      // If no errors in baseline, all violations are new
      return {
        newViolations: allViolations,
        inheritedViolations: [],
      };
    }

    // Convert violations to TSCError format for comparison
    const currentTSCErrors: TSCError[] = allViolations.map(v => ({
      file: v.file.path,
      line: v.location.line,
      column: v.location.column || 0,
      code: v.type || 'UNKNOWN',
      message: v.message,
    }));

    const newTSCErrors = this.errorBaseline.compareWithBaseline(currentTSCErrors);
    const newErrorSet = new Set(
      newTSCErrors.map(e => `${e.file}:${e.line}:${e.column}:${e.code}`)
    );

    const newViolations: Violation[] = [];
    const inheritedViolations: Violation[] = [];

    for (const violation of allViolations) {
      const errorKey = `${violation.file.path}:${violation.location.line}:${violation.location.column || 0}:${violation.type || 'UNKNOWN'}`;
      if (newErrorSet.has(errorKey)) {
        newViolations.push(violation);
      } else {
        inheritedViolations.push(violation);
      }
    }

    return { newViolations, inheritedViolations };
  }

  /**
   * Checks if there are any new violations (not in baseline)
   *
   * @returns boolean - True if there are new violations
   */
  hasNewViolations(): boolean {
    const { newViolations } = this.separateViolations();
    return newViolations.length > 0;
  }

  /**
   * Gets count of new violations
   *
   * @returns number - Count of new violations
   */
  getNewViolationCount(): number {
    const { newViolations } = this.separateViolations();
    return newViolations.length;
  }

  /**
   * Gets count of inherited violations
   *
   * @returns number - Count of inherited violations
   */
  getInheritedViolationCount(): number {
    const { inheritedViolations } = this.separateViolations();
    return inheritedViolations.length;
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
    const { newViolations, inheritedViolations } = this.separateViolations();

    let summary = '# Aegis QA Report\n\n';

    // URGENT BUSINESS RISK - Show first if there are business risk findings
    if (this.businessRiskFindings.length > 0) {
      summary += '## 🚨 URGENT BUSINESS RISK\n\n';
      summary += `**Business Domain:** ${this.businessDomain}\n\n`;
      
      const criticalRisks = this.businessRiskFindings.filter((r) => r.riskLevel === 'critical');
      const highRisks = this.businessRiskFindings.filter((r) => r.riskLevel === 'high');
      
      if (criticalRisks.length > 0) {
        summary += `**Critical Risk Modules:** ${criticalRisks.length}\n`;
        for (const risk of criticalRisks.slice(0, 5)) {
          summary += `- ${risk.filePath} (Quality Score: ${risk.qualityScore}/100)\n`;
        }
        if (criticalRisks.length > 5) {
          summary += `- ... and ${criticalRisks.length - 5} more\n`;
        }
        summary += '\n';
      }
      
      if (highRisks.length > 0) {
        summary += `**High Risk Modules:** ${highRisks.length}\n`;
        for (const risk of highRisks.slice(0, 5)) {
          summary += `- ${risk.filePath} (Quality Score: ${risk.qualityScore}/100)\n`;
        }
        if (highRisks.length > 5) {
          summary += `- ... and ${highRisks.length - 5} more\n`;
        }
        summary += '\n';
      }
      
      summary += '---\n\n';
    }

    // New Issues vs Inherited Issues section
    summary += '## 📊 Error Delta (Baseline Comparison)\n\n';
    summary += `**New Issues:** ${newViolations.length}\n`;
    summary += `**Inherited Issues:** ${inheritedViolations.length}\n`;
    summary += `**Total Violations:** ${all.length}\n\n`;

    if (newViolations.length > 0) {
      summary += '### New Issues (Not in Baseline)\n\n';
      summary += 'These issues were introduced after the baseline was established:\n\n';
      for (const violation of newViolations.slice(0, 10)) {
        summary += `- **${violation.file.path}:${violation.location.line}** [${violation.severity}]: ${violation.message}\n`;
      }
      if (newViolations.length > 10) {
        summary += `- ... and ${newViolations.length - 10} more\n`;
      }
      summary += '\n';
    }

    if (inheritedViolations.length > 0) {
      summary += '### Inherited Issues (Known)\n\n';
      summary += 'These issues existed in the baseline and are not attributed to recent changes:\n\n';
      summary += `<details>\n<summary>Click to expand inherited issues (${inheritedViolations.length})</summary>\n\n`;
      for (const violation of inheritedViolations.slice(0, 20)) {
        summary += `- **${violation.file.path}:${violation.location.line}** [${violation.severity}]: ${violation.message}\n`;
      }
      if (inheritedViolations.length > 20) {
        summary += `- ... and ${inheritedViolations.length - 20} more\n`;
      }
      summary += '\n</details>\n\n';
    }

    summary += '---\n\n';

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
    const { newViolations, inheritedViolations } = this.separateViolations();

    return {
      totalViolations: all.length,
      violations: all,
      newViolations,
      inheritedViolations,
      severityBreakdown: Object.fromEntries(severityCounts),
      timestamp: new Date(),
    };
  }
}
