/**
 * Report Aggregator - Centralized Violation Management
 *
 * Collects, manages, and escalates violations from all auditors.
 * Provides summary statistics and generates markdown reports.
 *
 * @module report-aggregator
 * @since 1.0.0
 */

import * as path from 'path';
import { SecretSanitizer } from '../core/secret-sanitizer.js';

interface Violation {
  id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: unknown;
  location: { line: number; column: number };
  message: string;
  rule: string;
  autoFixable: boolean;
  confidence: number;
  timestamp?: Date;
}

interface ViolationSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface AuditorReport {
  auditorName: string;
  violations: Violation[];
  summary: ViolationSummary;
}

interface HardwareMetrics {
  currentTemperature: number;
  threshold: number;
  isSafe: boolean;
  vramGB?: number;
  concurrentLimit?: number;
  recommendedModel?: string;
}

interface RemediationResults {
  appliedFixes: unknown[];
  suggestedFixes: unknown[];
  totalFixes: number;
}

class ReportAggregator {
  private reports: Map<string, AuditorReport> = new Map();
  private hardwareMetrics: HardwareMetrics | null = null;
  private readyForAudit: boolean = false;
  private remediationResults: RemediationResults | null = null;
  private sanitizer: SecretSanitizer;

  constructor() {
    this.sanitizer = new SecretSanitizer({
      sanitizeLogs: true,
      sanitizeReports: true,
      allowedPatterns: ['TEST_API_KEY', 'MOCK_SECRET', 'DEMO_KEY'],
      logLevel: 'warn',
      complianceMode: false,
    });
  }

  /**
   * Adds violations from an auditor
   */
  addViolations(auditorName: string, violations: Violation[]): void {
    const existingReport = this.reports.get(auditorName);
    const existingViolations = existingReport?.violations || [];
    
    const allViolations = [...existingViolations, ...violations];
    const summary = this.calculateSummary(allViolations);
    
    this.reports.set(auditorName, {
      auditorName,
      violations: allViolations,
      summary,
    });
  }

  /**
   * Gets all reports
   */
  getAllReports(): AuditorReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * Gets report for a specific auditor
   */
  getReport(auditorName: string): AuditorReport | undefined {
    return this.reports.get(auditorName);
  }

  /**
   * Calculates summary statistics for violations
   */
  private calculateSummary(violations: Violation[]): ViolationSummary {
    return {
      critical: violations.filter(v => v.severity === 'critical').length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length,
      total: violations.length,
    };
  }

  /**
   * Gets overall summary across all auditors
   */
  getOverallSummary(): ViolationSummary {
    const allViolations = this.getAllReports().flatMap(r => r.violations);
    return this.calculateSummary(allViolations);
  }

  /**
   * Clears all reports
   */
  clear(): void {
    this.reports.clear();
  }

  /**
   * Sets hardware metrics from ThermalController
   */
  setHardwareMetrics(metrics: HardwareMetrics): void {
    this.hardwareMetrics = metrics;
  }

  /**
   * Gets hardware metrics
   */
  getHardwareMetrics(): HardwareMetrics | null {
    return this.hardwareMetrics;
  }

  /**
   * Sets ready for audit status (Final State Seal for Phase 10)
   */
  setReadyForAudit(ready: boolean): void {
    this.readyForAudit = ready;
  }

  /**
   * Gets ready for audit status
   */
  getReadyForAudit(): boolean {
    return this.readyForAudit;
  }

  /**
   * Sets remediation results (Phase 11: Atomic Fixes)
   */
  setRemediationResults(results: RemediationResults): void {
    this.remediationResults = results;
  }

  /**
   * Gets remediation results
   */
  getRemediationResults(): RemediationResults | null {
    return this.remediationResults;
  }

  /**
   * Generates markdown report
   */
  generateMarkdownReport(): string {
    let report = '# SOVEREIGNQA - SECURITY AUDIT REPORT\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;

    const overallSummary = this.getOverallSummary();
    report += '## Overall Summary\n\n';
    report += '| Severity | Count |\n';
    report += '|----------|-------|\n';
    report += `| 🔴 Critical | ${overallSummary.critical} |\n`;
    report += `| 🟠 High | ${overallSummary.high} |\n`;
    report += `| 🟡 Medium | ${overallSummary.medium} |\n`;
    report += `| 🔵 Low | ${overallSummary.low} |\n`;
    report += `| **Total** | **${overallSummary.total}** |\n\n`;

    // Add READY_FOR_AUDIT status (Final State Seal)
    report += '## Deployment Readiness\n\n';
    report += `| Status | Value |\n`;
    report += `|--------|-------|\n`;
    report += `| READY_FOR_AUDIT | ${this.readyForAudit ? '✅ TRUE' : '🚨 FALSE'} |\n`;
    if (!this.readyForAudit) {
      report += '\n**⚠️ DEPLOYMENT BLOCKED:** Critical hardening issues detected. Resolve all CRITICAL violations before deployment.\n';
      report += 'Criterio Senior: No se trata de querer o no querer, se trata de integridad atómica.\n';
    }
    report += '\n';

    const reports = this.getAllReports();
    if (reports.length > 0) {
      report += '## Auditor Reports\n\n';
      for (const auditorReport of reports) {
        report += `### ${auditorReport.auditorName}\n\n`;
        report += `**Total Violations:** ${auditorReport.summary.total}\n\n`;
        
        if (auditorReport.violations.length > 0) {
          report += '| Severity | File | Line | Rule | Message |\n';
          report += '|----------|------|------|------|----------|\n';
          
          for (const violation of auditorReport.violations) {
            const severityEmoji = this.getSeverityEmoji(violation.severity);
            const filePath = (violation.file as { path: string }).path;
            report += `| ${severityEmoji} ${violation.severity} | ${filePath} | ${violation.location.line} | ${violation.rule} | ${violation.message.substring(0, 100)}... |\n`;
          }
          report += '\n';
        } else {
          report += '✅ No violations found\n\n';
        }
      }
    }

    // Add Hardware Safety Metrics section
    if (this.hardwareMetrics) {
      report += '## Hardware Safety Metrics\n\n';
      report += '| Metric | Value |\n';
      report += '|--------|-------|\n';
      report += `| Current Temperature | ${this.hardwareMetrics.currentTemperature}°C |\n`;
      report += `| Threshold | ${this.hardwareMetrics.threshold}°C |\n`;
      report += `| Status | ${this.hardwareMetrics.isSafe ? '✅ Safe' : '⚠️ Unsafe'} |\n`;
      
      if (this.hardwareMetrics.vramGB !== undefined) {
        report += `| VRAM Available | ${this.hardwareMetrics.vramGB}GB |\n`;
      }
      if (this.hardwareMetrics.concurrentLimit !== undefined) {
        report += `| Concurrent Limit | ${this.hardwareMetrics.concurrentLimit} processes |\n`;
      }
      if (this.hardwareMetrics.recommendedModel) {
        report += `| Recommended Model | ${this.hardwareMetrics.recommendedModel} |\n`;
      }
      report += '\n';
    }

    // Add Applied/Suggested Fixes section (Phase 11)
    if (this.remediationResults) {
      report += '## Applied/Suggested Fixes\n\n';
      report += `**Total Fixes:** ${this.remediationResults.totalFixes}\n`;
      report += `**Applied Automatically:** ${this.remediationResults.appliedFixes.length}\n`;
      report += `**Suggested (Manual Review):** ${this.remediationResults.suggestedFixes.length}\n\n`;

      if (this.remediationResults.appliedFixes.length > 0) {
        report += '### Applied Fixes ✅\n\n';
        report += '| ID | Type | File | Description |\n';
        report += '|----|------|------|-------------|\n';
        
        for (const fixResult of this.remediationResults.appliedFixes) {
          const fix = (fixResult as { fix: { id: string; type: string; file: string; description: string } }).fix;
          report += `| ${fix.id} | ${fix.type} | ${path.basename(fix.file)} | ${fix.description} |\n`;
        }
        report += '\n';
      }

      if (this.remediationResults.suggestedFixes.length > 0) {
        report += '### Suggested Fixes ⚠️\n\n';
        report += '| ID | Type | File | Description | Reason |\n';
        report += '|----|------|------|-------------|--------|\n';
        
        for (const fixResult of this.remediationResults.suggestedFixes) {
          const fix = (fixResult as { fix: { id: string; type: string; file: string; description: string } }).fix;
          report += `| ${fix.id} | ${fix.type} | ${path.basename(fix.file)} | ${fix.description} | ${(fixResult as { error?: string }).error || 'Manual review required'} |\n`;
        }
        report += '\n';
        report += '**Note:** Patches for suggested fixes are available in `.sentinel/diffs/` directory.\n\n';
      }
    }

    // Add Predicted Fragility Areas section (Phase 13)
    const predictiveReport = this.getReport('predictive-bug-detection');
    if (predictiveReport && predictiveReport.violations.length > 0) {
      report += '## Predicted Fragility Areas 🔮\n\n';
      report += `**Total Predicted Issues:** ${predictiveReport.summary.total}\n`;
      report += `**Critical:** ${predictiveReport.summary.critical}\n`;
      report += `**High:** ${predictiveReport.summary.high}\n`;
      report += `**Medium:** ${predictiveReport.summary.medium}\n`;
      report += `**Low:** ${predictiveReport.summary.low}\n\n`;
      
      report += '| Severity | File | Line | Type | Intuition |\n';
      report += '|----------|------|------|------|----------|\n';
      
      for (const violation of predictiveReport.violations) {
        const severityEmoji = this.getSeverityEmoji(violation.severity);
        const fileName = (violation.file as { path?: string }).path || 'unknown';
        const message = violation.message;
        report += `| ${severityEmoji} ${violation.severity} | ${path.basename(fileName)} | ${violation.location.line} | ${violation.rule} | ${message.substring(0, 80)}... |\n`;
      }
      report += '\n';
      report += '**Note:** These are predictive issues based on code patterns. They are not syntax errors but potential bug magnets.\n\n';
    }

    // Add Financial Leaks & Efficiency section (Phase 14)
    const costReport = this.getReport('cloud-cost-detection');
    if (costReport && costReport.violations.length > 0) {
      report += '## Financial Leaks & Efficiency 💰\n\n';
      report += `**Total Cost Issues:** ${costReport.summary.total}\n`;
      report += `**Critical:** ${costReport.summary.critical}\n`;
      report += `**High:** ${costReport.summary.high}\n`;
      report += `**Medium:** ${costReport.summary.medium}\n`;
      report += `**Low:** ${costReport.summary.low}\n\n`;
      
      report += '| Severity | File | Line | Type | Cost Impact | Estimated Savings |\n';
      report += '|----------|------|------|------|------------|-------------------|\n';
      
      for (const violation of costReport.violations) {
        const severityEmoji = this.getSeverityEmoji(violation.severity);
        const fileName = (violation.file as { path?: string }).path || 'unknown';
        const message = violation.message;
        // Extract cost impact and savings from message if available
        report += `| ${severityEmoji} ${violation.severity} | ${path.basename(fileName)} | ${violation.location.line} | ${violation.rule} | ${message.substring(0, 60)}... |\n`;
      }
      report += '\n';
      report += '**Note:** In the cloud, time is literally money. These issues directly impact your monthly bill.\n\n';
    }

    // Sanitize the report to remove sensitive data (GDPR/CCPA/SOC2 compliance)
    const sanitizedReport = this.sanitizer.sanitizeReport(report);

    return sanitizedReport;
  }

  /**
   * Gets emoji for severity
   */
  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  }

  /**
   * Generates console summary
   */
  generateConsoleSummary(): string {
    const overallSummary = this.getOverallSummary();
    
    let summary = '\n=== AUDIT SUMMARY ===\n';
    summary += `🔴 Critical: ${overallSummary.critical}\n`;
    summary += `🟠 High: ${overallSummary.high}\n`;
    summary += `🟡 Medium: ${overallSummary.medium}\n`;
    summary += `🔵 Low: ${overallSummary.low}\n`;
    summary += `Total: ${overallSummary.total}\n`;
    
    return summary;
  }
}

export default ReportAggregator;
export { ReportAggregator };
export type { Violation, ViolationSummary, AuditorReport };
