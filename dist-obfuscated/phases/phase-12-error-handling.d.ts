/**
 * Phase 12: Error Handling, Observability & Resilience [CONSOLIDATED + HARDENED]
 *
 * Purpose: Evaluate error handling patterns, observability infrastructure, and resilience
 * to ensure the system can gracefully handle failures and provide actionable insights.
 *
 * Architecture:
 * - Error Pattern Analysis: Detect empty try-catch blocks, missing error handlers
 * - Stack Trace Verification: Ensure custom exceptions maintain stack traces
 * - Observability Audit: Check for structured logging, metrics, and tracing
 * - Error Boundary Detection: Check for React Error Boundaries
 * - Generic Error Handlers: Identify catch blocks without meaningful error handling
 * - Error Context: Detect error handlers that don't log or provide context
 * - Anti-Swallow Guard: Prohibit empty catch blocks in automatic fixes
 * - Circuit Breaker Detection: Detect external API calls without timeout/retry
 * - Log-Level Sanitization: Ensure logs don't include PII or complete request bodies
 * - Log-Flood Prevention: Detect logging in loops that could saturate I/O
 * - Thermal Verification: Mandatory resource check before scanning
 * - Batch Processing: Use BatchProcessor with adaptive cooldown
 *
 * @module phases/phase-12-error-handling
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * Error handling finding
 */
interface ErrorHandlingFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'empty-catch' | 'console-log-catch' | 'missing-handler' | 'no-stack-trace' | 'sensitive-log' | 'missing-observability' | 'timeout-review' | 'missing-error-boundary' | 'no-error-context' | 'anti-swallow-violation' | 'circuit-breaker-missing' | 'log-level-unsafe' | 'log-flood-risk';
    /** Severity: low, medium, high, critical */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** File path */
    filePath: string;
    /** Line number */
    line?: number;
    /** Description of the issue */
    description: string;
    /** Suggested fix */
    suggestion?: string;
    /** Whether in Core Path */
    isCorePath?: boolean;
    /** Sanitized description (for report output) */
    sanitizedDescription?: string;
}
/**
 * Observability audit result
 */
interface ObservabilityAuditResult {
    /** Has structured logging */
    hasStructuredLogging: boolean;
    /** Has metrics implementation */
    hasMetrics: boolean;
    /** Has distributed tracing */
    hasTracing: boolean;
    /** Logging library detected (winston, pino, bunyan, etc.) */
    loggingLibrary?: string;
    /** Metrics library detected (prometheus, datadog, newrelic, etc.) */
    metricsLibrary?: string;
    /** Tracing library detected (opentelemetry, sentry, jaeger, etc.) */
    tracingLibrary?: string;
}
/**
 * Phase 12 configuration
 */
interface Phase12Config {
    /** Project root directory */
    projectRoot: string;
    /** Thermal controller for hardware protection */
    thermalController: ThermalController;
    /** State persistence for resume capability */
    statePersistence: StatePersistence;
    /** File filter for size/extension filtering */
    fileFilter: FileFilter;
    /** Ignore handler for glob optimization */
    ignoreHandler: IgnoreHandler;
    /** Current execution state */
    currentState: ExecutionState;
}
/**
 * Phase 12 result
 */
export interface Phase12Result {
    /** Overall success */
    success: boolean;
    /** Total files analyzed */
    totalFiles: number;
    /** Error handling findings */
    errorFindings: ErrorHandlingFinding[];
    /** Observability audit result */
    observabilityAudit: ObservabilityAuditResult;
    /** Critical findings count */
    criticalFindings: number;
    /** High severity findings count */
    highSeverityFindings: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 12: Error Handling & Observability
 *
 * This phase evaluates error handling patterns and observability infrastructure.
 *
 * @class Phase12ErrorHandling
 */
export declare class Phase12ErrorHandling {
    private config;
    constructor(config: Phase12Config);
    /**
     * Executes Phase 12: Error Handling, Observability & Resilience [CONSOLIDATED + HARDENED]
     *
     * @returns Promise<Phase12Result> - Error handling assessment result
     */
    execute(): Promise<Phase12Result>;
    /**
     * Gets all source files to analyze
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private getSourceFiles;
    /**
     * Analyzes a single file for error handling issues
     *
     * @private
     * @param filePath - File path
     * @param corePathFiles - Set of Core Path files
     * @returns Promise<ErrorHandlingFinding[]> - Array of findings
     */
    private analyzeFile;
    /**
     * Audits observability infrastructure
     *
     * @private
     * @returns Promise<ObservabilityAuditResult> - Observability audit result
     */
    private auditObservability;
    /**
     * Writes partial report for Phase 12
     *
     * @private
     * @param findings - Error handling findings
     * @param observabilityAudit - Observability audit result
     * @param criticalFindings - Critical findings count
     * @param highSeverityFindings - High severity findings count
     */
    private writePartialReport;
    /**
     * Generates a unique finding ID
     *
     * @private
     * @param filePath - File path
     * @param line - Line number
     * @param type - Finding type
     * @returns string - Unique finding ID
     */
    private generateFindingId;
    /**
     * Masks sensitive data in log statements for safe reporting
     *
     * @private
     * @param logStatement - The log statement containing sensitive data
     * @returns string - Sanitized log statement
     */
    private maskSensitiveData;
    /**
     * Self-Audit: Verifies that this phase did not introduce empty try-catch blocks
     *
     * @private
     * @returns Promise<void>
     */
    private selfAudit;
}
export {};
//# sourceMappingURL=phase-12-error-handling.d.ts.map