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
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
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
export declare class Phase20IntelligentROIReport {
    private config;
    constructor(config: Phase20Config);
    /**
     * Executes Phase 20: Intelligent ROI Report
     *
     * @returns Promise<Phase20Result> - Intelligent ROI report result
     */
    execute(): Promise<Phase20Result>;
    /**
     * Calculates ROI based on findings
     *
     * @private
     * @returns ROIResult - ROI calculation result
     */
    private calculateROI;
    /**
     * Determines finding complexity
     *
     * @private
     * @param finding - Finding object
     * @returns Finding complexity
     */
    private determineComplexity;
    /**
     * Gets time per finding based on complexity
     *
     * @private
     * @param complexity - Finding complexity
     * @returns number - Time in minutes
     */
    private getTimePerFinding;
    /**
     * Generates executive report
     *
     * @private
     * @param roi - ROI calculation result
     * @returns string - Report path
     */
    private generateReport;
    /**
     * Generates report content
     *
     * @private
     * @param roi - ROI calculation result
     * @returns string - Report content
     */
    private generateReportContent;
    /**
     * Censors secrets from report (Self-Destruct Secure Mode)
     *
     * @private
     * @param content - Report content
     * @returns string - Censored content
     */
    private censorSecrets;
}
export {};
//# sourceMappingURL=phase-20-intelligent-roi-report.d.ts.map