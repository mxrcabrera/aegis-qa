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
import type { Violation, Severity } from '../types/audit.js';
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
 * Violation category
 */
export type ViolationCategory = 'style' | 'security' | 'accessibility' | 'performance' | 'code-quality' | 'business-logic';
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
    /** Maximum violations per category to show in detailed report (default: 50) */
    maxViolationsPerCategory?: number;
    /** Whether to show all violations without cap (overrides maxViolationsPerCategory) */
    verbose?: boolean;
}
/**
 * Report aggregator class
 *
 * Centralizes all violations from different auditors and provides
 * methods for aggregation, filtering, and escalation.
 */
export declare class ReportAggregator {
    private violations;
    private config;
    private businessRiskFindings;
    private businessDomain;
    private errorBaseline;
    private baselineEstablished;
    /**
     * Creates a new ReportAggregator instance
     *
     * @param config - Configuration for the reporter
     */
    constructor(config?: Partial<ReporterConfig>);
    /**
     * Adds a violation to the aggregator
     *
     * @param auditorName - Name of the auditor (e.g., 'style-auditor', 'security-scanner')
     * @param violation - Violation to add
     */
    addViolation(auditorName: string, violation: Violation): void;
    /**
     * Adds multiple violations from an auditor
     *
     * @param auditorName - Name of the auditor
     * @param violations - Array of violations to add
     */
    addViolations(auditorName: string, violations: Violation[]): void;
    /**
     * Sets business risk findings from Phase 2 for context-aware escalation
     *
     * @param riskFindings - Business risk findings from Phase 2
     */
    setBusinessRiskFindings(riskFindings: unknown[]): void;
    /**
     * Auto-escalates violation severity based on critical path and business context
     *
     * @private
     * @param violation - Violation to potentially escalate
     * @returns Violation - Escalated violation if applicable
     */
    private autoEscalate;
    /**
     * Gets all violations from a specific auditor
     *
     * @param auditorName - Name of the auditor
     * @returns Violation[] - Array of violations
     */
    getViolations(auditorName: string): Violation[];
    /**
     * Gets all violations from all auditors
     *
     * @returns Map<string, Violation[]> - Map of auditor name to violations
     */
    getAllViolations(): Map<string, Violation[]>;
    /**
     * Gets all violations flattened into a single array
     *
     * @returns Violation[] - All violations from all auditors
     */
    getAllViolationsFlattened(): Violation[];
    /**
     * Filters violations by severity
     *
     * @param severity - Severity level to filter by
     * @returns Violation[] - Filtered violations
     */
    filterBySeverity(severity: Severity): Violation[];
    /**
     * Filters violations by category
     *
     * @param category - Category to filter by
     * @returns Violation[] - Filtered violations
     */
    filterByCategory(category: ViolationCategory): Violation[];
    /**
     * Filters violations by critical path
     *
     * @param inCriticalPath - Whether to filter for critical path violations
     * @returns Violation[] - Filtered violations
     */
    filterByCriticalPath(inCriticalPath: boolean): Violation[];
    /**
     * Gets violation count by severity
     *
     * @returns Map<Severity, number> - Count of violations by severity
     */
    getCountBySeverity(): Map<Severity, number>;
    /**
     * Gets violation count by category
     *
     * @returns Map<ViolationCategory, number> - Count of violations by category
     */
    getCountByCategory(): Map<ViolationCategory, number>;
    /**
     * Clears all violations from a specific auditor
     *
     * @param auditorName - Name of the auditor
     */
    clearViolations(auditorName: string): void;
    /**
     * Clears all violations from all auditors
     */
    clearAll(): void;
    /**
     * Establishes error baseline by running tsc --noEmit
     *
     * @returns Promise<void>
     */
    establishBaseline(): Promise<void>;
    /**
     * Separates violations into new and inherited based on baseline
     *
     * @returns { newViolations: Violation[], inheritedViolations: Violation[] }
     */
    separateViolations(): {
        newViolations: Violation[];
        inheritedViolations: Violation[];
    };
    /**
     * Checks if there are any new violations (not in baseline)
     *
     * @returns boolean - True if there are new violations
     */
    hasNewViolations(): boolean;
    /**
     * Gets count of new violations
     *
     * @returns number - Count of new violations
     */
    getNewViolationCount(): number;
    /**
     * Gets count of inherited violations
     *
     * @returns number - Count of inherited violations
     */
    getInheritedViolationCount(): number;
    /**
     * Generates a summary of all violations
     *
     * @returns string - Markdown formatted summary
     */
    generateSummary(): string;
    /**
     * Exports violations as AggregatedReport
     *
     * @returns AggregatedReport - Complete aggregated report
     */
    exportResults(): AggregatedReport;
}
//# sourceMappingURL=reporter.d.ts.map