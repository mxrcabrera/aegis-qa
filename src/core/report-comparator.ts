/**
 * Report Comparator Module
 *
 * Compares two QA reports and shows delta analysis:
 * - Resolved violations
 * - New violations
 * - Trend analysis
 *
 * @module core/report-comparator
 * @since 1.0.0
 */

import * as fs from 'fs';

export interface Violation {
  id: string;
  severity: string;
  filePath: string;
  line?: number;
  description: string;
  type: string;
}

export interface ReportData {
  timestamp: string;
  totalFindings: number;
  criticalFindings: number;
  highSeverityFindings: number;
  mediumSeverityFindings: number;
  lowSeverityFindings: number;
  violations: Violation[];
}

export interface ComparisonResult {
  report1: string;
  report2: string;
  timestamp1: string;
  timestamp2: string;
  resolvedViolations: Violation[];
  newViolations: Violation[];
  unchangedViolations: Violation[];
  trend: 'improving' | 'degrading' | 'stable';
  summary: {
    totalBefore: number;
    totalAfter: number;
    delta: number;
    criticalDelta: number;
    highDelta: number;
    mediumDelta: number;
    lowDelta: number;
  };
}

/**
 * Report Comparator Class
 *
 * Provides functionality to compare two QA reports and generate delta analysis
 */
export class ReportComparator {
  /**
   * Parses a QA report markdown file
   *
   * @param reportPath - Path to the report file
   * @returns ReportData - Parsed report data
   */
  private parseReport(reportPath: string): ReportData {
    const content = fs.readFileSync(reportPath, 'utf-8');
    const lines = content.split('\n');

    const violations: Violation[] = [];
    let currentSection = '';
    let totalFindings = 0;
    let criticalFindings = 0;
    let highSeverityFindings = 0;
    let mediumSeverityFindings = 0;
    let lowSeverityFindings = 0;
    let timestamp = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Extract timestamp
      if (line.includes('Generated:') || line.includes('Timestamp:')) {
        const match = line.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
        if (match) {
          timestamp = match[1];
        }
      }

      // Track sections
      if (line.startsWith('##')) {
        currentSection = line;
      }

      // Parse violation entries
      if (line.startsWith('- [') || line.startsWith('* [')) {
        const idMatch = line.match(/\[([^\]]+)\]/);
        const severityMatch = line.match(/\*\*([A-Z]+)\*\*/);
        const pathMatch = line.match(/([^\s:]+\.ts(?::\d+)?)/);
        const descMatch = line.match(/\s+-\s+(.+)/);

        if (idMatch && severityMatch) {
          const violation: Violation = {
            id: idMatch[1],
            severity: severityMatch[1].toLowerCase(),
            filePath: pathMatch ? pathMatch[1] : 'unknown',
            line: pathMatch ? parseInt(pathMatch[1].split(':')[1] || '0', 10) : undefined,
            description: descMatch ? descMatch[1].trim() : '',
            type: currentSection.replace(/##\s*/, '').toLowerCase(),
          };

          violations.push(violation);

          // Count by severity
          totalFindings++;
          switch (violation.severity) {
            case 'critical':
              criticalFindings++;
              break;
            case 'high':
              highSeverityFindings++;
              break;
            case 'medium':
              mediumSeverityFindings++;
              break;
            case 'low':
              lowSeverityFindings++;
              break;
          }
        }
      }
    }

    return {
      timestamp,
      totalFindings,
      criticalFindings,
      highSeverityFindings,
      mediumSeverityFindings,
      lowSeverityFindings,
      violations,
    };
  }

  /**
   * Compares two reports and generates delta analysis
   *
   * @param report1Path - Path to the first (older) report
   * @param report2Path - Path to the second (newer) report
   * @returns ComparisonResult - Comparison result
   */
  compare(report1Path: string, report2Path: string): ComparisonResult {
    const report1 = this.parseReport(report1Path);
    const report2 = this.parseReport(report2Path);

    // Create maps for efficient comparison
    const violations1Map = new Map<string, Violation>();
    for (const v of report1.violations) {
      const key = `${v.filePath}:${v.line || 0}:${v.type}`;
      violations1Map.set(key, v);
    }

    const violations2Map = new Map<string, Violation>();
    for (const v of report2.violations) {
      const key = `${v.filePath}:${v.line || 0}:${v.type}`;
      violations2Map.set(key, v);
    }

    // Find resolved violations (in report1 but not in report2)
    const resolvedViolations: Violation[] = [];
    for (const [key, violation] of violations1Map) {
      if (!violations2Map.has(key)) {
        resolvedViolations.push(violation);
      }
    }

    // Find new violations (in report2 but not in report1)
    const newViolations: Violation[] = [];
    for (const [key, violation] of violations2Map) {
      if (!violations1Map.has(key)) {
        newViolations.push(violation);
      }
    }

    // Find unchanged violations (in both reports)
    const unchangedViolations: Violation[] = [];
    for (const [key, violation] of violations1Map) {
      if (violations2Map.has(key)) {
        unchangedViolations.push(violation);
      }
    }

    // Determine trend
    let trend: 'improving' | 'degrading' | 'stable';
    const delta = report2.totalFindings - report1.totalFindings;
    if (delta < 0) {
      trend = 'improving';
    } else if (delta > 0) {
      trend = 'degrading';
    } else {
      trend = 'stable';
    }

    return {
      report1: report1Path,
      report2: report2Path,
      timestamp1: report1.timestamp,
      timestamp2: report2.timestamp,
      resolvedViolations,
      newViolations,
      unchangedViolations,
      trend,
      summary: {
        totalBefore: report1.totalFindings,
        totalAfter: report2.totalFindings,
        delta,
        criticalDelta: report2.criticalFindings - report1.criticalFindings,
        highDelta: report2.highSeverityFindings - report1.highSeverityFindings,
        mediumDelta: report2.mediumSeverityFindings - report1.mediumSeverityFindings,
        lowDelta: report2.lowSeverityFindings - report1.lowSeverityFindings,
      },
    };
  }
}
