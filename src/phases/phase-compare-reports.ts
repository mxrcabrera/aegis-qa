// eslint-disable @typescript-eslint/no-explicit-any
/**
 * Phase Compare Reports
 *
 * Purpose: Compare current audit report with previous reports to track progress,
 * identify regressions, and show improvement trends over time.
 *
 * Architecture:
 * - Report Comparison: Diff current report against previous reports
 * - Trend Analysis: Track improvements and regressions across runs
 * - Progress Metrics: Calculate percentage of issues resolved
 * - Regression Detection: Identify new issues that appeared
 *
 * @module phases/phase-compare-reports
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { validatePath, sanitizeError } from '../core/security-utils.js';

interface ReportComparisonFinding {
  id: string;
  type: 'improvement' | 'regression' | 'new-issue' | 'resolved-issue' | 'unchanged';
  severity: 'low' | 'medium' | 'high';
  filePath?: string;
  issueType: string;
  description: string;
  previousCount?: number;
  currentCount?: number;
  change?: number;
}

interface ReportComparisonMetrics {
  totalIssuesPrevious: number;
  totalIssuesCurrent: number;
  resolvedIssues: number;
  newIssues: number;
  improvedCategories: number;
  regressedCategories: number;
  progressPercentage: number;
}

interface CompareReportsConfig {
  projectRoot: string;
  thermalController: ThermalController;
  statePersistence: StatePersistence;
  currentState: ExecutionState;
  previousReportPath?: string;
  currentReportPath?: string;
}

export interface CompareReportsResult {
  success: boolean;
  findings: ReportComparisonFinding[];
  metrics: ReportComparisonMetrics;
  highSeverityFindings: number;
  mediumSeverityFindings: number;
  executionTimeMs: number;
  error?: string;
}

export class PhaseCompareReports {
  private config: CompareReportsConfig;

  constructor(config: CompareReportsConfig) {
    if (!validatePath(config.projectRoot, config.projectRoot)) {
      throw new Error('Invalid project root path');
    }
    this.config = config;
  }

  async execute(): Promise<CompareReportsResult> {
    const startTime = Date.now();
    console.log('INFO Phase: Compare Reports\n');

    try {
      console.log('INFO Verifying system resources...');
      const resourceCheck = await this.config.thermalController.checkSystemResources();
      console.log(`INFO CPU Usage: ${resourceCheck.cpuUsage}%`);
      console.log(`INFO RAM Usage: ${resourceCheck.ramUsage}%`);
      console.log(`INFO RAM Available: ${resourceCheck.ramAvailable} GB\n`);

      if (!resourceCheck.isSafe) {
        throw new Error('System resources not safe for operation');
      }

      console.log('INFO Comparing reports...\n');
      
      const findings: ReportComparisonFinding[] = [];

      // 1. Find previous reports
      console.log('INFO Finding previous reports...');
      const previousReports = this.findPreviousReports();
      
      if (previousReports.length === 0) {
        console.log('INFO No previous reports found - this is the first run');
        return this.createBaselineResult(startTime);
      }

      const latestPreviousReport = previousReports[0];
      console.log(`INFO Comparing against previous report: ${latestPreviousReport}\n`);

      // 2. Load and parse reports
      console.log('INFO Loading and parsing reports...');
      const previousData = this.loadReport(latestPreviousReport);
      const currentData = this.loadCurrentReport();

      if (!previousData || !currentData) {
        throw new Error('Failed to load report data');
      }

      // 3. Compare issue counts by category
      console.log('INFO Comparing issue counts by category...');
      findings.push(...this.compareIssueCategories(previousData, currentData));

      // 4. Detect regressions
      console.log('INFO Detecting regressions...');
      findings.push(...this.detectRegressions(previousData, currentData));

      // 5. Detect improvements
      console.log('INFO Detecting improvements...');
      findings.push(...this.detectImprovements(previousData, currentData));

      console.log(`INFO Total findings: ${findings.length}\n`);

      const metrics = this.calculateMetrics(previousData, currentData, findings);
      console.log(`INFO Previous total issues: ${metrics.totalIssuesPrevious}`);
      console.log(`INFO Current total issues: ${metrics.totalIssuesCurrent}`);
      console.log(`INFO Resolved issues: ${metrics.resolvedIssues}`);
      console.log(`INFO New issues: ${metrics.newIssues}`);
      console.log(`INFO Progress: ${metrics.progressPercentage.toFixed(1)}%\n`);

      const highSeverityFindings = findings.filter((f) => f.severity === 'high').length;
      const mediumSeverityFindings = findings.filter((f) => f.severity === 'medium').length;

      const executionTimeMs = Date.now() - startTime;

      const result: CompareReportsResult = {
        success: true,
        findings,
        metrics,
        highSeverityFindings,
        mediumSeverityFindings,
        executionTimeMs,
      };

      console.log(`SUCCESS Phase Compare Reports Complete in ${executionTimeMs / 1000}s`);
      console.log(`INFO High severity findings: ${highSeverityFindings}`);
      console.log(`INFO Medium severity findings: ${mediumSeverityFindings}`);

      return result;
    } catch {
      const executionTimeMs = Date.now() - startTime;
      const sanitizedError = sanitizeError(error);

      const result: CompareReportsResult = {
        success: false,
        findings: [],
        metrics: {
          totalIssuesPrevious: 0,
          totalIssuesCurrent: 0,
          resolvedIssues: 0,
          newIssues: 0,
          improvedCategories: 0,
          regressedCategories: 0,
          progressPercentage: 0,
        },
        highSeverityFindings: 0,
        mediumSeverityFindings: 0,
        executionTimeMs,
        error: sanitizedError,
      };

      console.error('FAILED Phase Compare Reports:', sanitizedError);
      return result;
    }
  }

  private findPreviousReports(): string[] {
    const reportDir = path.join(this.config.projectRoot, '.aegis', 'reports');
    const reports: string[] = [];

    if (!fs.existsSync(reportDir)) {
      return reports;
    }

    try {
      const files = fs.readdirSync(reportDir);
      const reportFiles = files
        .filter((f) => f.startsWith('qa-report-') && f.endsWith('.md'))
        .map((f) => path.join(reportDir, f))
        .sort()
        .reverse(); // Most recent first

      // Exclude the current report if it exists
      return reportFiles.slice(1);
    } catch {
      console.warn(`Failed to read report directory:`, sanitizeError(error));
      return reports;
    }
  }

  private loadReport(reportPath: string): unknown {
    try {
      if (!fs.existsSync(reportPath)) {
        return null;
      }

      const content = fs.readFileSync(reportPath, 'utf-8');
      return this.parseReportContent(content);
    } catch {
      console.warn(`Failed to load report ${reportPath}:`, sanitizeError(error));
      return null;
    }
  }

  private loadCurrentReport(): unknown {
    const currentReportPath = this.config.currentReportPath || 
      path.join(this.config.projectRoot, '.aegis', 'reports', 'qa-report-latest.md');
    
    return this.loadReport(currentReportPath);
  }

  private parseReportContent(content: string): unknown {
    const reportData: unknown = {
      categories: {},
      totalFindings: 0,
    };

    const lines = content.split('\n');
    let currentCategory = '';

    lines.forEach((line) => {
      // Detect category headers
      const categoryMatch = line.match(/^##\s+(.+)/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        (reportData as any).categories[currentCategory] = {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
        return;
      }

      // Detect severity counts
      const severityMatch = line.match(/-\s+(Critical|High|Medium|Low):\s*(\d+)/);
      if (severityMatch && currentCategory) {
        const severity = severityMatch[1].toLowerCase();
        const count = parseInt(severityMatch[2], 10);
        
        if ((reportData as any).categories[currentCategory]) {
          (reportData as any).categories[currentCategory][severity] = count;
          (reportData as any).categories[currentCategory].total += count;
          (reportData as any).totalFindings += count;
        }
      }

      // Detect total findings
      const totalMatch = line.match(/Total Findings:\s*(\d+)/);
      if (totalMatch) {
        (reportData as any).totalFindings = parseInt(totalMatch[1], 10);
      }
    });

    return reportData;
  }

  private compareIssueCategories(previousData: unknown, currentData: any): ReportComparisonFinding[] {
    const findings: ReportComparisonFinding[] = [];
    
    const allCategories = new Set([
      ...Object.keys((previousData as any).categories || {}),
      ...Object.keys((currentData as any).categories || {}),
    ]);

    allCategories.forEach((category) => {
      const previous = (previousData as any).categories?.[category] || { total: 0 };
      const current = (currentData as any).categories?.[category] || { total: 0 };
      
      const change = current.total - previous.total;

      if (change < 0) {
        findings.push({
          id: `improvement-${Date.now()}-${Math.random()}`,
          type: 'improvement',
          severity: 'low',
          issueType: category,
          description: `${category}: ${Math.abs(change)} issues resolved`,
          previousCount: previous.total,
          currentCount: current.total,
          change,
        });
      } else if (change > 0) {
        findings.push({
          id: `regression-${Date.now()}-${Math.random()}`,
          type: 'regression',
          severity: 'high',
          issueType: category,
          description: `${category}: ${change} new issues appeared`,
          previousCount: previous.total,
          currentCount: current.total,
          change,
        });
      }
    });

    return findings;
  }

  private detectRegressions(previousData: unknown, currentData: any): ReportComparisonFinding[] {
    const findings: ReportComparisonFinding[] = [];

    const allCategories = new Set([
      ...Object.keys((previousData as any).categories || {}),
      ...Object.keys((currentData as any).categories || {}),
    ]);

    allCategories.forEach((category) => {
      const previous = (previousData as any).categories?.[category] || {};
      const current = (currentData as any).categories?.[category] || {};

      // Check for severity regressions
      ['critical', 'high', 'medium', 'low'].forEach((severity) => {
        const previousCount = previous[severity] || 0;
        const currentCount = current[severity] || 0;
        const change = currentCount - previousCount;

        if (change > 0 && (severity === 'critical' || severity === 'high')) {
          findings.push({
            id: `regression-${Date.now()}-${Math.random()}`,
            type: 'regression',
            severity: severity === 'critical' ? 'high' : 'medium',
            issueType: `${category} (${severity})`,
            description: `${severity} severity issues increased by ${change} in ${category}`,
            previousCount: previousCount,
            currentCount: currentCount,
            change,
          });
        }
      });
    });

    return findings;
  }

  private detectImprovements(previousData: unknown, currentData: any): ReportComparisonFinding[] {
    const findings: ReportComparisonFinding[] = [];

    const allCategories = new Set([
      ...Object.keys((previousData as any).categories || {}),
      ...Object.keys((currentData as any).categories || {}),
    ]);

    allCategories.forEach((category) => {
      const previous = (previousData as any).categories?.[category] || {};
      const current = (currentData as any).categories?.[category] || {};

      // Check for severity improvements
      ['critical', 'high', 'medium', 'low'].forEach((severity) => {
        const previousCount = previous[severity] || 0;
        const currentCount = current[severity] || 0;
        const change = currentCount - previousCount;

        if (change < 0) {
          findings.push({
            id: `improvement-${Date.now()}-${Math.random()}`,
            type: 'improvement',
            severity: 'low',
            issueType: `${category} (${severity})`,
            description: `${severity} severity issues decreased by ${Math.abs(change)} in ${category}`,
            previousCount: previousCount,
            currentCount: currentCount,
            change,
          });
        }
      });
    });

    return findings;
  }

  private calculateMetrics(previousData: unknown, currentData: unknown, findings: ReportComparisonFinding[]): ReportComparisonMetrics {
    const totalPrevious = (previousData as any).totalFindings || 0;
    const totalCurrent = (currentData as any).totalFindings || 0;
    const resolved = totalPrevious - totalCurrent;
    const newIssues = Math.max(0, totalCurrent - totalPrevious);
    
    const improvedCategories = findings.filter((f) => f.type === 'improvement').length;
    const regressedCategories = findings.filter((f) => f.type === 'regression').length;
    
    const progressPercentage = totalPrevious > 0 
      ? ((totalPrevious - totalCurrent) / totalPrevious) * 100 
      : 0;

    return {
      totalIssuesPrevious: totalPrevious,
      totalIssuesCurrent: totalCurrent,
      resolvedIssues: Math.max(0, resolved),
      newIssues,
      improvedCategories,
      regressedCategories,
      progressPercentage,
    };
  }

  private createBaselineResult(startTime: number): CompareReportsResult {
    const executionTimeMs = Date.now() - startTime;

    return {
      success: true,
      findings: [],
      metrics: {
        totalIssuesPrevious: 0,
        totalIssuesCurrent: 0,
        resolvedIssues: 0,
        newIssues: 0,
        improvedCategories: 0,
        regressedCategories: 0,
        progressPercentage: 0,
      },
      highSeverityFindings: 0,
      mediumSeverityFindings: 0,
      executionTimeMs,
    };
  }
}
















