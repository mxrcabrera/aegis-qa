/**
 * PhaseOrchestrator - QA Phase Orchestration Engine
 *
 * Purpose: Orchestrate the 20 phases of the qa-orchestrator review process,
 * ensuring hardware protection and intelligent phase execution.
 *
 * Architecture: This orchestrator manages the complete review lifecycle from
 * setup through fixes, with thermal checks between each phase and adaptive
 * batch processing based on hardware capabilities.
 *
 * @module orchestration/phase-orchestrator
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { DomainAnalyzer } from '../inference/domain-analyzer.js';
import { ReportAggregator } from '../core/reporter.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import type { DomainMap } from '../types/domain.js';
/**
 * Phase execution result
 */
interface PhaseResult {
    /** Phase number */
    phase: number;
    /** Phase name */
    phaseName: string;
    /** Whether phase completed successfully */
    success: boolean;
    /** Number of findings from this phase */
    findingsCount: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error message if phase failed */
    error?: string;
}
/**
 * Full review result
 */
interface ReviewResult {
    /** Overall success status */
    success: boolean;
    /** Total execution time in milliseconds */
    totalExecutionTimeMs: number;
    /** Results for each phase */
    phaseResults: PhaseResult[];
    /** Total findings across all phases */
    totalFindings: number;
    /** Domain map from analysis */
    domainMap?: DomainMap;
}
/**
 * Fix execution result
 */
interface FixResult {
    /** Overall success status */
    success: boolean;
    /** Total findings attempted to fix */
    totalFindings: number;
    /** Successfully fixed findings */
    fixedCount: number;
    /** Findings requiring human review */
    needsHumanReview: number;
    /** Failed fixes */
    failedCount: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
}
/**
 * PhaseOrchestrator configuration
 */
interface PhaseOrchestratorConfig {
    /** Root directory of the project to analyze */
    projectRoot: string;
    /** Thermal controller for hardware protection */
    thermalController: ThermalController;
    /** Domain analyzer for business context */
    domainAnalyzer: DomainAnalyzer;
    /** Report aggregator for centralized violations */
    reportAggregator: ReportAggregator;
    /** State persistence for resume capability */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** Business profile from Phase 2 */
    businessProfile?: unknown;
    /** Whether to run all phases or specific phases */
    runAllPhases?: boolean;
    /** Specific phases to run (if not running all) */
    phasesToRun?: number[];
    /** Whether to apply cooldowns between phases */
    applyCooldowns?: boolean;
    /** Phase timeout in milliseconds (default: 300000 = 5 minutes) */
    phaseTimeoutMs?: number;
    /** Global execution timeout in milliseconds (default: no limit) */
    maxRuntimeMs?: number;
    /** Whether to force memory flush after heavy phases */
    enableMemoryFlush?: boolean;
    /** Whether to write partial reports after each phase */
    enablePartialReports?: boolean;
    /** Whether to run in dry-run mode (no fixes applied) */
    dryRunMode?: boolean;
    /** Whether to skip confirmation prompts (for CI/CD) */
    yesMode?: boolean;
    /** Whether to enable verbose logging for debugging */
    verboseMode?: boolean;
    /** Whether to run in safe-only mode (report only, no modifications) */
    safeOnly?: boolean;
    /** Whether to show batch diff preview before applying fixes */
    previewDiffs?: boolean;
    /** Whether to enable audit-only mode for compliance */
    auditOnly?: boolean;
    /** Whether to enable per-fix interactive approval */
    interactiveFix?: boolean;
    /** Whether to allow fixes without git repository (dangerous) */
    allowNoGit?: boolean;
    /** Whether to enable sandbox mode for isolated execution */
    sandboxMode?: boolean;
}
/**
 * PhaseOrchestrator - QA Phase Orchestration
 *
 * This class orchestrates the 20 phases of the qa-orchestrator review process,
 * ensuring hardware protection and intelligent phase execution.
 *
 * @class PhaseOrchestrator
 * @example
 * ```typescript
 * const orchestrator = new PhaseOrchestrator({
 *   projectRoot: '/path/to/project',
 *   thermalController: new ThermalController(),
 *   domainAnalyzer: new DomainAnalyzer({...}, secretManager),
 *   reportAggregator: new ReportAggregator(),
 * });
 *
 * const result = await orchestrator.runFullReview();
 * console.log(`Total findings: ${result.totalFindings}`);
 * ```
 */
export declare class PhaseOrchestrator {
    private config;
    private gitCheckpointManager;
    private errorBaseline;
    private thermalLock;
    private memoryMonitor;
    private sandboxManager;
    private gcAvailable;
    private memoryThreshold;
    private dryRunMode;
    private yesMode;
    private activeTimeouts;
    private globalExecutionStartTime;
    private globalRuntimeLimitMs;
    constructor(config: PhaseOrchestratorConfig);
    /**
     * Enforces dry-run mode to prevent bypass
     *
     * @private
     * @throws {Error} If dry-run is being bypassed
     */
    private enforceDryRun;
    /**
     * Checks if global execution timeout has been exceeded
     *
     * @private
     * @returns boolean - Whether timeout has been exceeded
     */
    private hasGlobalTimeoutExceeded;
    /**
     * Handles global timeout abort with partial report
     *
     * @private
     * @param phaseResults - Results from completed phases
     * @param totalPhases - Total number of phases expected
     * @returns ReviewResult - Partial review result
     */
    private handleGlobalTimeoutAbort;
    /**
     * Generates a partial report when execution is aborted
     *
     * @private
     * @param phaseResults - Results from completed phases
     * @param elapsed - Elapsed time in milliseconds
     * @param totalFindings - Total findings count
     */
    private generatePartialReport;
    /**
     * Formats elapsed time in human-readable format
     *
     * @private
     * @param ms - Time in milliseconds
     * @returns string - Formatted time string
     */
    private formatElapsedTime;
    /**
     * Validates that dry-run is respected before any file operation
     *
     * @private
     * @param operation - Description of the operation
     * @throws {Error} If attempting to modify files in dry-run mode
     */
    private validateDryRunForOperation;
    /**
     * Triggers garbage collection if available and checks memory usage
     *
     * @private
     * @param phaseName - Name of the phase that just completed
     * @returns Promise<void>
     */
    private triggerGarbageCollection;
    /**
     * Checks thermal status and acquires lock if critical
     *
     * @private
     * @returns Promise<void>
     */
    private checkThermalLock;
    /**
     * Runs the full review (phases 0-15)
     *
     * @returns Promise<ReviewResult> - Complete review results
     */
    runFullReview(): Promise<ReviewResult>;
    /**
     * Runs a function with timeout protection and automatic cleanup
     *
     * @param fn - Function to run
     * @param timeoutMs - Timeout in milliseconds
     * @param context - Context description for error messages
     * @returns Promise<T> - Function result
     * @throws {Error} If timeout is exceeded
     */
    private runWithTimeout;
    /**
     * Performs cleanup when a phase times out
     *
     * @private
     * @param context - Context description for logging
     */
    private performTimeoutCleanup;
    /**
     * Clears all tracked timeouts
     *
     * @private
     * @returns number - Number of timeouts cleared
     */
    private clearAllTimeouts;
    /**
     * Kills orphaned processes (placeholder - would need process tracking)
     *
     * @private
     * @returns number - Number of processes killed
     */
    private killOrphanedProcesses;
    /**
     * Cleans up temporary files in .aegis-cache
     *
     * @private
     * @returns number - Number of files cleaned
     */
    private cleanupTemporaryFiles;
    /**
     * Detects zombie processes
     *
     * @private
     */
    private detectZombieProcesses;
    /**
     * Determines if a phase is "heavy" (requires memory flush)
     *
     * @private
     * @param phaseNumber - Phase number
     * @returns boolean - Whether phase is heavy
     */
    private isHeavyPhase;
    /**
     * Forces memory flush to prevent RAM growth
     *
     * @private
     */
    private flushMemory;
    /**
     * Writes partial report after each phase
     *
     * @private
     * @param phaseNumber - Phase number
     * @param phaseName - Phase name
     * @param findingsCount - Number of findings
     * @param executionTimeMs - Execution time
     * @param error - Error message if phase failed
     */
    private writePartialReport;
    /**
     * Runs atomic fixes (phases 16-18)
     *
     * @returns Promise<FixResult> - Fix execution result
     */
    runFixes(): Promise<FixResult>;
    /**
     * Runs incremental review (phase 19 - git diff only)
     *
     * @returns Promise<ReviewResult> - Incremental review results
     */
    runIncrementalReview(): Promise<ReviewResult>;
    /**
     * Compares reports (phase 20)
     *
     * @returns Promise<void> - Comparison results
     */
    compareReports(): Promise<void>;
    /**
     * Creates sandbox environment before running phases
     *
     * @public
     * @returns Promise<void>
     */
    createSandbox(): Promise<void>;
    /**
     * Gets the effective project root (sandbox directory if active, otherwise original)
     *
     * @public
     * @returns string - Effective project root
     */
    getEffectiveProjectRoot(): string;
    /**
     * Generates patch file after fixes are applied
     *
     * @public
     * @returns Promise<string | null> - Path to patch file or null if sandbox not active
     */
    generatePatch(): Promise<string | null>;
    /**
     * Cleans up sandbox environment
     *
     * @public
     * @returns Promise<void>
     */
    cleanupSandbox(): Promise<void>;
}
export {};
//# sourceMappingURL=phase-orchestrator.d.ts.map