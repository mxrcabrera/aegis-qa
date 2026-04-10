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

/**
 * Finding complexity
 */
enum FindingComplexity {
  CORE = 'core', // 30 minutes per finding
  BUSINESS = 'business', // 20 minutes per finding
  SECURITY = 'security', // 15 minutes per finding
  STYLE = 'style', // 5 minutes per finding
  LOW = 'low', // 2 minutes per finding
}

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
  /** Complexity breakdown */
  complexityBreakdown: Record<string, number>;
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
    const complexityBreakdown: Record<string, number> = {
      core: 0,
      business: 0,
      security: 0,
      style: 0,
      low: 0,
    };

    let totalTimeSavedMinutes = 0;

    for (const finding of this.config.allFindings) {
      const complexity = this.determineComplexity(finding);
      const timePerFinding = this.getTimePerFinding(complexity);
      
      complexityBreakdown[complexity]++;
      totalTimeSavedMinutes += timePerFinding;
    }

    return {
      totalTimeSavedMinutes,
      totalTimeSavedHours: totalTimeSavedMinutes / 60,
      complexityBreakdown,
    };
  }

  /**
   * Determines finding complexity
   *
   * @private
   * @param finding - Finding object
   * @returns Finding complexity
   */
  private determineComplexity(finding: Finding): FindingComplexity {
    // Determine complexity based on finding type and severity
    const type = finding.type || '';
    const severity = finding.severity || '';

    // Core issues (business logic, database)
    if (type.includes('business') || type.includes('database') || type.includes('api')) {
      return FindingComplexity.CORE;
    }

    // Security issues
    if (type.includes('security') || severity === 'critical') {
      return FindingComplexity.SECURITY;
    }

    // Business logic
    if (type.includes('logic') || type.includes('domain')) {
      return FindingComplexity.BUSINESS;
    }

    // Style issues
    if (type.includes('style') || type.includes('formatting') || severity === 'low') {
      return FindingComplexity.STYLE;
    }

    // Default to low
    return FindingComplexity.LOW;
  }

  /**
   * Gets time per finding based on complexity
   *
   * @private
   * @param complexity - Finding complexity
   * @returns number - Time in minutes
   */
  private getTimePerFinding(complexity: FindingComplexity): number {
    switch (complexity) {
      case FindingComplexity.CORE:
        return 30; // 30 minutes
      case FindingComplexity.BUSINESS:
        return 20; // 20 minutes
      case FindingComplexity.SECURITY:
        return 15; // 15 minutes
      case FindingComplexity.STYLE:
        return 5; // 5 minutes
      case FindingComplexity.LOW:
        return 2; // 2 minutes
      default:
        return 5;
    }
  }

  /**
   * Generates executive report
   *
   * @private
   * @param roi - ROI calculation result
   * @returns string - Report path
   */
  private generateReport(roi: ROIResult): string {
    const reportPath = path.join(this.config.projectRoot, 'qa-report.md');

    // Generate report content
    let report = this.generateReportContent(roi);

    // Apply Self-Destruct Secure Mode (censor secrets)
    report = this.censorSecrets(report);

    // Check if file system is in read-only mode (no-write mode)
    const fileSystem = getFileSystem();
    if (!fileSystem.isWriteAllowed()) {
      // Output to stdout instead of writing to file
      console.log('\n' + '='.repeat(60));
      console.log('QA REPORT (Read-Only Mode)');
      console.log('='.repeat(60));
      console.log(report);
      console.log('='.repeat(60) + '\n');
      return '<stdout>';
    }

    // Write report
    fileSystem.writeFileSync(reportPath, report, 'utf-8');

    // Save timestamped copy to .sentinel/reports/ for longitudinal analysis
    const sentinelDir = path.join(this.config.projectRoot, '.sentinel', 'reports');
    if (!fs.existsSync(sentinelDir)) {
      fs.mkdirSync(sentinelDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const timestampedPath = path.join(sentinelDir, `qa-report-${timestamp}.md`);
    fs.copyFileSync(reportPath, timestampedPath);
    console.log(`INFO Timestamped report saved to: ${timestampedPath}`);

    return reportPath;
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
    const fixesApplied = this.config.fixResults?.filter((r) => r.success).length || 0;

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
- **Total Time Saved:** ${roi.totalTimeSavedHours.toFixed(2)} hours (${roi.totalTimeSavedMinutes} minutes)

## Complexity Breakdown

| Complexity | Count | Time per Finding | Total Time Saved |
|------------|-------|-----------------|------------------|
| Core (Business Logic, Database) | ${roi.complexityBreakdown.core} | 30 min | ${(roi.complexityBreakdown.core * 30).toFixed(0)} min |
| Business (Domain, Logic) | ${roi.complexityBreakdown.business} | 20 min | ${(roi.complexityBreakdown.business * 20).toFixed(0)} min |
| Security | ${roi.complexityBreakdown.security} | 15 min | ${(roi.complexityBreakdown.security * 15).toFixed(0)} min |
| Style (Formatting, Low Severity) | ${roi.complexityBreakdown.style} | 5 min | ${(roi.complexityBreakdown.style * 5).toFixed(0)} min |
| Low | ${roi.complexityBreakdown.low} | 2 min | ${(roi.complexityBreakdown.low * 2).toFixed(0)} min |

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













