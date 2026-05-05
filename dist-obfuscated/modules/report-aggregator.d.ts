/**
 * Report Aggregator - Centralized Violation Management
 *
 * Collects, manages, and escalates violations from all auditors.
 * Provides summary statistics and generates markdown reports.
 *
 * @module report-aggregator
 * @since 1.0.0
 */
interface Violation {
    id: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    file: unknown;
    location: {
        line: number;
        column: number;
    };
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
declare class ReportAggregator {
    private reports;
    private hardwareMetrics;
    private readyForAudit;
    private remediationResults;
    private sanitizer;
    constructor();
    /**
     * Adds violations from an auditor
     */
    addViolations(auditorName: string, violations: Violation[]): void;
    /**
     * Gets all reports
     */
    getAllReports(): AuditorReport[];
    /**
     * Gets report for a specific auditor
     */
    getReport(auditorName: string): AuditorReport | undefined;
    /**
     * Calculates summary statistics for violations
     */
    private calculateSummary;
    /**
     * Gets overall summary across all auditors
     */
    getOverallSummary(): ViolationSummary;
    /**
     * Clears all reports
     */
    clear(): void;
    /**
     * Sets hardware metrics from ThermalController
     */
    setHardwareMetrics(metrics: HardwareMetrics): void;
    /**
     * Gets hardware metrics
     */
    getHardwareMetrics(): HardwareMetrics | null;
    /**
     * Sets ready for audit status (Final State Seal for Phase 10)
     */
    setReadyForAudit(ready: boolean): void;
    /**
     * Gets ready for audit status
     */
    getReadyForAudit(): boolean;
    /**
     * Sets remediation results (Phase 11: Atomic Fixes)
     */
    setRemediationResults(results: RemediationResults): void;
    /**
     * Gets remediation results
     */
    getRemediationResults(): RemediationResults | null;
    /**
     * Generates markdown report
     */
    generateMarkdownReport(): string;
    /**
     * Gets emoji for severity
     */
    private getSeverityEmoji;
    /**
     * Generates console summary
     */
    generateConsoleSummary(): string;
}
export default ReportAggregator;
export { ReportAggregator, Violation, ViolationSummary, AuditorReport };
//# sourceMappingURL=report-aggregator.d.ts.map