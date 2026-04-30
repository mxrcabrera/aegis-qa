/**
 * Phase 20: Intelligent ROI Report - Executive Report with Time Savings
 *
 * Purpose: Generate executive report with time savings weighted by complexity
 * (Core: 30m, Style: 5m). Includes Self-Destruct Secure Mode to censor
 * secrets in qa-report.md.
 *
 * Architecture:
 * - ROI Calculation: Calculate time savings weighted by complexity
 * - Report Generation: Generate comprehensive executive report
 * - Secret Censoring: Self-Destruct Secure Mode for secret protection
 * - Executive Summary: High-level summary for stakeholders
 *
 * @module phases/phase-20-intelligent-roi-report
 * @since 1.0.0
 */

import * as path from 'path';
import * as fs from 'fs';
import { getFileSystem } from '../core/write-guard.js';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError } from '../core/security-utils.js';
import { type MultiFixExecutionResult } from './phase-17-multi-fix-execution.js';

/**
 * Phase 20 configuration
 */
interface Phase20Config {
  /** Project root directory */
  projectRoot: string;
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Current execution state */
  currentState: ExecutionState;
  /** All findings from phases 0-15 */
  allFindings: Finding[];
  /** Fix results from Phase 17 */
  fixResults?: FixResult[];
  /** Multi-fix execution result from Phase 17 */
  multiFixResult?: MultiFixExecutionResult;
  /** Post-fix validation result from Phase 18 */
  postFixValidationResult?: {
    globalIntegrityStatus: 'passed' | 'GLOBAL_INTEGRITY_COMPROMISED';
    preFixTypeErrorCount: number;
    postFixTypeErrorCount: number;
    newTypeErrors: number;
    regressions: unknown[];
    fixValidationResults?: unknown[];
  };
  /** Circuit breaker monitoring data */
  circuitBreakerData?: {
    monitoringCount: number;
    blockCount: number;
  };
  /** WriteGuard blocking data */
  writeGuardData?: {
    blockCount: number;
  };
}

/**
 * Finding for ROI calculation
 */
interface Finding {
  /** Finding type or category */
  type?: string;
  /** File path */
  filePath?: string;
  /** Severity */
  severity?: string;
  /** Whether finding is in core path */
  inCorePath?: boolean;
}

/**
 * Fix result from Phase 17
 */
interface FixResult {
  /** Whether fix was successful */
  success: boolean;
}

/**
 * ROI calculation result
 */
interface ROIResult {
  /** Total time saved in minutes */
  totalTimeSavedMinutes: number;
  /** Total time saved in hours */
  totalTimeSavedHours: number;
  /** Severity breakdown */
  severityBreakdown: Record<string, number>;
  /** Risk reduction percentage */
  riskReductionPercentage: number;
  /** Initial risk score */
  initialRiskScore: number;
  /** Post-remediation risk score */
  postRemediationRiskScore: number;
  /** Audit consolidation */
  auditConsolidation: {
    circuitBreakerMonitoringCount: number;
    circuitBreakerBlockCount: number;
    writeGuardBlockCount: number;
  };
}

/**
 * Phase 20 result
 */
export interface Phase20Result {
  /** Overall success */
  success: boolean;
  /** Report path */
  reportPath: string;
  /** Total findings */
  totalFindings: number;
  /** Total time saved in minutes */
  totalTimeSavedMinutes: number;
  /** Total time saved in hours */
  totalTimeSavedHours: number;
  /** Fixes applied */
  fixesApplied: number;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Phase 20: Intelligent ROI Report - Executive Report with Time Savings
 *
 * This phase generates executive report with time savings weighted by complexity
 * (Core: 30m, Style: 5m). Includes Self-Destruct Secure Mode to censor
 * secrets in qa-report.md.
 *
 * @class Phase20IntelligentROIReport
 * @example
 * ```typescript
 * const intelligentROIReport = new Phase20IntelligentROIReport(config);
 * const result = await intelligentROIReport.execute();
 * console.log(`Time saved: ${result.totalTimeSavedHours} hours`);
 * console.log(`Report: ${result.reportPath}`);
 * ```
 */
export class Phase20IntelligentROIReport {
  private config: Phase20Config;

  constructor(config: Phase20Config) {
    // Validate projectRoot path to prevent path traversal
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  /**
   * Executes Phase 20: Intelligent ROI Report
   *
   * @returns Promise<Phase20Result> - Intelligent ROI report result
   */
  async execute(): Promise<Phase20Result> {
    const startTime = Date.now();
    console.log('INFO Phase 20: Intelligent ROI Report - Executive Report with Time Savings\n');

    try {
      // Thermal check before starting
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      // Calculate ROI
      console.log('INFO Calculating ROI...');
      const roi = this.calculateROI();
      console.log(`INFO Total time saved: ${roi.totalTimeSavedMinutes} minutes (${roi.totalTimeSavedHours} hours)\n`);

      // Generate report
      console.log('INFO Generating executive report...');
      const reportPath = this.generateReport(roi);
      console.log(`INFO Report generated: ${reportPath}\n`);

      const executionTimeMs = Date.now() - startTime;

      const result: Phase20Result = {
        success: true,
        reportPath,
        totalFindings: this.config.allFindings.length,
        totalTimeSavedMinutes: roi.totalTimeSavedMinutes,
        totalTimeSavedHours: roi.totalTimeSavedHours,
        fixesApplied: this.config.fixResults?.filter((r) => r.success).length || 0,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase 20 Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO Total findings: ${result.totalFindings}`);
      console.log(`INFO Time saved: ${result.totalTimeSavedHours} hours`);
      console.log(`INFO Fixes applied: ${result.fixesApplied}`);
      console.log(`INFO Report: ${result.reportPath}`);

      return result;
    } catch (error: unknown) {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: Phase20Result = {
        success: false,
        reportPath: '',
        totalFindings: 0,
        totalTimeSavedMinutes: 0,
        totalTimeSavedHours: 0,
        fixesApplied: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase 20:', sanitizedError);
      return result;
    }
  }

  /**
   * Calculates ROI based on findings
   *
   * @private
   * @returns ROIResult - ROI calculation result
   */
  private calculateROI(): ROIResult {
    const severityBreakdown: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    let totalTimeSavedMinutes = 0;

    // Calculate time saved based on severity
    for (const finding of this.config.allFindings) {
      const severity = finding.severity || 'low';
      const timePerFinding = this.getTimePerSeverity(severity);

      severityBreakdown[severity]++;
      totalTimeSavedMinutes += timePerFinding;
    }

    // Calculate risk reduction
    const initialRiskScore = this.calculateInitialRiskScore();
    const postRemediationRiskScore = this.calculatePostRemediationRiskScore();
    const riskReductionPercentage = initialRiskScore > 0
      ? ((initialRiskScore - postRemediationRiskScore) / initialRiskScore) * 100
      : 0;

    // Audit consolidation
    const auditConsolidation = {
      circuitBreakerMonitoringCount: this.config.circuitBreakerData?.monitoringCount || 0,
      circuitBreakerBlockCount: this.config.circuitBreakerData?.blockCount || 0,
      writeGuardBlockCount: this.config.writeGuardData?.blockCount || 0,
    };

    return {
      totalTimeSavedMinutes,
      totalTimeSavedHours: totalTimeSavedMinutes / 60,
      severityBreakdown,
      riskReductionPercentage,
      initialRiskScore,
      postRemediationRiskScore,
      auditConsolidation,
    };
  }

  /**
   * Calculates initial risk score based on findings
   *
   * @private
   * @returns number - Initial risk score
   */
  private calculateInitialRiskScore(): number {
    let score = 0;
    for (const finding of this.config.allFindings) {
      const severity = finding.severity || 'low';
      score += this.getSeverityWeight(severity);
    }
    return score;
  }

  /**
   * Calculates post-remediation risk score
   *
   * @private
   * @returns number - Post-remediation risk score
   */
  private calculatePostRemediationRiskScore(): number {
    let score = 0;

    // If Phase 18 validation results are available, use them
    if (this.config.postFixValidationResult?.fixValidationResults) {
      const fixValidationResults = this.config.postFixValidationResult.fixValidationResults as Array<{
        status: string;
      }>;

      // Count verified fixes as resolved
      const verifiedCount = fixValidationResults.filter(r => r.status === 'verified').length;
      const regressiveCount = fixValidationResults.filter(r => r.status === 'regressive').length;

      // Start with initial score
      score = this.calculateInitialRiskScore();

      // Subtract verified fixes (they're resolved)
      score -= verifiedCount * 10; // Assume each verified fix reduces risk by 10 points

      // Add regressive fixes (they introduced new issues)
      score += regressiveCount * 15; // Each regressive fix adds 15 points of risk
    } else {
      // Fallback: use initial score minus fixes applied
      score = this.calculateInitialRiskScore();
      const fixesApplied = this.config.multiFixResult?.fixesApplied || 0;
      score -= fixesApplied * 10;
    }

    return Math.max(0, score);
  }

  /**
   * Gets severity weight for risk calculation
   *
   * @private
   * @param severity - Severity level
   * @returns number - Weight value
   */
  private getSeverityWeight(severity: string): number {
    switch (severity) {
      case 'critical':
        return 50;
      case 'high':
        return 30;
      case 'medium':
        return 15;
      case 'low':
        return 5;
      default:
        return 5;
    }
  }

  /**
   * Gets time per finding based on severity
   *
   * @private
   * @param severity - Severity level
   * @returns number - Time in minutes
   */
  private getTimePerSeverity(severity: string): number {
    switch (severity) {
      case 'critical':
        return 240; // 4 hours (240 minutes)
      case 'high':
        return 120; // 2 hours (120 minutes)
      case 'medium':
        return 60; // 1 hour (60 minutes)
      case 'low':
        return 30; // 30 minutes
      default:
        return 30;
    }
  }

  /**
   * Generates executive report (multi-format: JSON and Markdown)
   *
   * @private
   * @param roi - ROI calculation result
   * @returns string - Report path
   */
  private generateReport(roi: ROIResult): string {
    const reportPath = path.join(this.config.projectRoot, 'qa-report.md');
    const jsonReportPath = path.join(this.config.projectRoot, 'qa-report.json');

    // Generate JSON report (for machines)
    const jsonReport = this.generateJSONReport(roi);
    const censoredJsonReport = this.censorSecrets(jsonReport);

    // Generate Markdown report (for humans)
    const markdownReport = this.generateReportContent(roi);
    const censoredMarkdownReport = this.censorSecrets(markdownReport);

    // Check if file system is in read-only mode (no-write mode)
    const fileSystem = getFileSystem();
    if (!fileSystem.isWriteAllowed()) {
      // Output to stdout instead of writing to file
      console.log('\n' + '='.repeat(60));
      console.log('QA REPORT (Read-Only Mode)');
      console.log('='.repeat(60));
      console.log('\n--- JSON Report ---\n');
      console.log(censoredJsonReport);
      console.log('\n--- Markdown Report ---\n');
      console.log(censoredMarkdownReport);
      console.log('='.repeat(60) + '\n');
      return '<stdout>';
    }

    // Write JSON report
    fileSystem.writeFileSync(jsonReportPath, censoredJsonReport, 'utf-8');
    console.log(`INFO JSON report generated: ${jsonReportPath}`);

    // Write Markdown report
    fileSystem.writeFileSync(reportPath, censoredMarkdownReport, 'utf-8');
    console.log(`INFO Markdown report generated: ${reportPath}`);

    // Save timestamped copies to .sentinel/reports/ for longitudinal analysis
    const sentinelDir = path.join(this.config.projectRoot, '.sentinel', 'reports');
    if (!fs.existsSync(sentinelDir)) {
      fs.mkdirSync(sentinelDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampedJsonPath = path.join(sentinelDir, `qa-report-${timestamp}.json`);
    const timestampedMdPath = path.join(sentinelDir, `qa-report-${timestamp}.md`);
    fs.copyFileSync(jsonReportPath, timestampedJsonPath);
    fs.copyFileSync(reportPath, timestampedMdPath);
    console.log(`INFO Timestamped reports saved to: ${sentinelDir}`);

    return reportPath;
  }

  /**
   * Generates JSON report (for machines)
   *
   * @private
   * @param roi - ROI calculation result
   * @returns string - JSON report content
   */
  private generateJSONReport(roi: ROIResult): string {
    const timestamp = new Date().toISOString();
    const totalFindings = this.config.allFindings.length;
    const criticalFindings = this.config.allFindings.filter((f) => f.severity === 'critical').length;
    const highSeverityFindings = this.config.allFindings.filter((f) => f.severity === 'high').length;
    const fixesApplied = this.config.multiFixResult?.fixesApplied || 0;
    const fixesFailed = this.config.multiFixResult?.fixesFailed || 0;
    const fixesSkipped = this.config.multiFixResult?.fixesSkipped || 0;

    const report = {
      metadata: {
        generated: timestamp,
        project: path.basename(this.config.projectRoot),
        version: '1.0.0',
      },
      summary: {
        totalFindings,
        criticalFindings,
        highSeverityFindings,
        fixesApplied,
        fixesFailed,
        fixesSkipped,
        totalTimeSavedMinutes: roi.totalTimeSavedMinutes,
        totalTimeSavedHours: roi.totalTimeSavedHours,
        riskReductionPercentage: roi.riskReductionPercentage,
      },
      severityBreakdown: roi.severityBreakdown,
      riskAnalysis: {
        initialRiskScore: roi.initialRiskScore,
        postRemediationRiskScore: roi.postRemediationRiskScore,
        riskReductionPercentage: roi.riskReductionPercentage,
      },
      auditConsolidation: roi.auditConsolidation,
      phase18Validation: {
        globalIntegrityStatus: this.config.postFixValidationResult?.globalIntegrityStatus || 'N/A',
        preFixTypeErrorCount: this.config.postFixValidationResult?.preFixTypeErrorCount || 0,
        postFixTypeErrorCount: this.config.postFixValidationResult?.postFixTypeErrorCount || 0,
        newTypeErrors: this.config.postFixValidationResult?.newTypeErrors || 0,
        regressionsDetected: this.config.postFixValidationResult?.regressions?.length || 0,
      },
      findingsBySeverity: {
        critical: criticalFindings,
        high: highSeverityFindings,
        medium: this.config.allFindings.filter((f) => f.severity === 'medium').length,
        low: this.config.allFindings.filter((f) => f.severity === 'low').length,
      },
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generates report content
   *
   * @private
   * @param roi - ROI calculation result
   * @returns string - Report content
   */
  private generateReportContent(roi: ROIResult): string {
    const timestamp = new Date().toISOString();
    const totalFindings = this.config.allFindings.length;
    const criticalFindings = this.config.allFindings.filter((f) => f.severity === 'critical').length;
    const highSeverityFindings = this.config.allFindings.filter((f) => f.severity === 'high').length;
    const fixesApplied = this.config.multiFixResult?.fixesApplied || 0;
    const fixesFailed = this.config.multiFixResult?.fixesFailed || 0;
    const fixesSkipped = this.config.multiFixResult?.fixesSkipped || 0;

    return `# Aegis QA - Executive ROI Report

**Generated:** ${timestamp}
**Project:** ${path.basename(this.config.projectRoot)}

## Executive Summary

This report provides a comprehensive analysis of code quality findings and the estimated time savings achieved through automated QA.

## Key Metrics

- **Total Findings:** ${totalFindings}
- **Critical Findings:** ${criticalFindings}
- **High Severity Findings:** ${highSeverityFindings}
- **Fixes Applied:** ${fixesApplied}
- **Fixes Failed:** ${fixesFailed}
- **Fixes Skipped:** ${fixesSkipped}
- **Total Time Saved:** ${roi.totalTimeSavedHours.toFixed(2)} hours (${roi.totalTimeSavedMinutes} minutes)
- **Risk Reduction:** ${roi.riskReductionPercentage.toFixed(1)}%

## Severity Breakdown

| Severity | Count | Time per Finding | Total Time Saved |
|----------|-------|-----------------|------------------|
| Critical | ${roi.severityBreakdown.critical} | 4h (240 min) | ${(roi.severityBreakdown.critical * 240).toFixed(0)} min |
| High | ${roi.severityBreakdown.high} | 2h (120 min) | ${(roi.severityBreakdown.high * 120).toFixed(0)} min |
| Medium | ${roi.severityBreakdown.medium} | 1h (60 min) | ${(roi.severityBreakdown.medium * 60).toFixed(0)} min |
| Low | ${roi.severityBreakdown.low} | 30 min | ${(roi.severityBreakdown.low * 30).toFixed(0)} min |

## Risk Analysis

- **Initial Risk Score:** ${roi.initialRiskScore}
- **Post-Remediation Risk Score:** ${roi.postRemediationRiskScore}
- **Risk Reduction:** ${roi.riskReductionPercentage.toFixed(1)}%

## Audit Consolidation

### System Protections

| Protection | Monitoring Count | Block Count |
|------------|------------------|-------------|
| Circuit Breaker | ${roi.auditConsolidation.circuitBreakerMonitoringCount} | ${roi.auditConsolidation.circuitBreakerBlockCount} |
| WriteGuard | N/A | ${roi.auditConsolidation.writeGuardBlockCount} |

### Phase 18 Validation Results

- **Global Integrity Status:** ${this.config.postFixValidationResult?.globalIntegrityStatus || 'N/A'}
- **Pre-fix Type Errors:** ${this.config.postFixValidationResult?.preFixTypeErrorCount || 0}
- **Post-fix Type Errors:** ${this.config.postFixValidationResult?.postFixTypeErrorCount || 0}
- **New Type Errors:** ${this.config.postFixValidationResult?.newTypeErrors || 0}
- **Regressions Detected:** ${this.config.postFixValidationResult?.regressions?.length || 0}

## Findings by Severity

| Severity | Count |
|----------|-------|
| Critical | ${criticalFindings} |
| High | ${highSeverityFindings} |
| Medium | ${this.config.allFindings.filter((f) => f.severity === 'medium').length} |
| Low | ${this.config.allFindings.filter((f) => f.severity === 'low').length} |

## Recommendations

1. **Priority Actions:** Address critical and high-severity findings immediately
2. **Security Review:** Conduct thorough security review for all security-related findings
3. **Code Quality:** Establish regular code review practices to prevent accumulation of style issues
4. **Automation:** Consider integrating Aegis QA into CI/CD pipeline for continuous monitoring
5. **Risk Management:** Monitor risk reduction trends and adjust remediation strategies accordingly

## Next Steps

- Review critical findings with development team
- Plan fixes for high-impact issues
- Schedule follow-up audit after fixes are applied
- Monitor for regression in subsequent audits

---
*Report generated by Aegis QA - Intelligent Quality Orchestrator*
`;
  }

  /**
   * Censors secrets from report (Self-Destruct Secure Mode)
   *
   * @private
   * @param content - Report content
   * @returns string - Censored content
   */
  private censorSecrets(content: string): string {
    // Patterns for common secrets
    const secretPatterns = [
      /api[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
      /secret["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
      /password["']?\s*[:=]\s*["'][a-zA-Z0-9]{8,}["']/gi,
      /token["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
      /bearer\s+[a-zA-Z0-9]{20,}/gi,
      /[a-zA-Z0-9]{32,}/g, // Long alphanumeric strings (potential secrets)
    ];

    let censoredContent = content;

    for (const pattern of secretPatterns) {
      censoredContent = censoredContent.replace(pattern, '***CENSORED***');
    }

    return censoredContent;
  }
}













