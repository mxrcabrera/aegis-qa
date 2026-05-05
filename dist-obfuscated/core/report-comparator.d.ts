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
export declare class ReportComparator {
    /**
     * Parses a QA report markdown file
     *
     * @param reportPath - Path to the report file
     * @returns ReportData - Parsed report data
     */
    private parseReport;
    /**
     * Compares two reports and generates delta analysis
     *
     * @param report1Path - Path to the first (older) report
     * @param report2Path - Path to the second (newer) report
     * @returns ComparisonResult - Comparison result
     */
    compare(report1Path: string, report2Path: string): ComparisonResult;
}
//# sourceMappingURL=report-comparator.d.ts.map