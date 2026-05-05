/**
 * Phase 8: Performance & Scalability
 *
 * Purpose: Detect bottlenecks, memory leaks, and patterns that impede scaling.
 * Focus on resource leaks, computational waste, and scalability patterns.
 *
 * Architecture:
 * - Resource Leaks: useEffect cleanup, eventListeners, subscriptions, DB connections
 * - Computational Waste: Heavy Computations, Re-render Hell
 * - Scalability Patterns: Blocking Sync, Caching
 *
 * @module phases/phase-8-performance
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * Performance finding
 */
interface PerformanceFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'resource-leak' | 'heavy-computation' | 're-render-hell' | 'blocking-sync' | 'missing-cache' | 'performance-issue';
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
}
/**
 * Phase 8 configuration
 */
interface Phase8Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** File filter for filtering files */
    fileFilter?: FileFilter;
    /** Ignore handler for filtering */
    ignoreHandler?: IgnoreHandler;
}
/**
 * Phase 8 result
 */
export interface Phase8Result {
    /** Overall success */
    success: boolean;
    /** Performance findings */
    findings: PerformanceFinding[];
    /** Total critical findings */
    criticalFindings: number;
    /** Total high severity findings */
    highSeverityFindings: number;
    /** Files analyzed */
    filesAnalyzed: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 8: Performance & Scalability
 *
 * This phase detects bottlenecks, memory leaks, and patterns that impede scaling.
 * Focuses on resource leaks, computational waste, and scalability patterns.
 *
 * @class Phase8Performance
 * @example
 * ```typescript
 * const phase8 = new Phase8Performance({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase8.execute();
 * ```
 */
export declare class Phase8Performance {
    private config;
    constructor(config: Phase8Config);
    /**
     * Executes Phase 8: Performance & Scalability
     *
     * @returns Promise<Phase8Result> - Performance analysis result
     */
    execute(): Promise<Phase8Result>;
    /**
     * Scans for source files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private scanFiles;
    /**
     * Analyzes a single file for performance issues
     *
     * @private
     * @param filePath - File path
     * @param databaseFindings - Database findings from Phase 4
     * @param criticalModules - Critical modules from Phase 2
     * @param complexityScores - Complexity scores from Phase 1
     * @param isFintech - Whether domain is Fintech
     * @returns Promise<PerformanceFinding[]> - Performance findings
     */
    private analyzeFile;
    /**
     * Analyzes resource leaks (useEffect cleanup, eventListeners, subscriptions, DB connections)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param criticalModules - Critical modules from Phase 2
     * @param isFintech - Whether domain is Fintech
     * @returns PerformanceFinding[] - Resource leak findings
     */
    private analyzeResourceLeaks;
    /**
     * Analyzes computational waste (Heavy Computations, Re-render Hell)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param criticalModules - Critical modules from Phase 2
     * @param complexityScores - Complexity scores from Phase 1
     * @returns PerformanceFinding[] - Computational waste findings
     */
    private analyzeComputationalWaste;
    /**
     * Analyzes scalability patterns (Blocking Sync, Caching)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param databaseFindings - Database findings from Phase 4
     * @param criticalModules - Critical modules from Phase 2
     * @param isFintech - Whether domain is Fintech
     * @returns PerformanceFinding[] - Scalability pattern findings
     */
    private analyzeScalabilityPatterns;
    /**
     * Computes SHA-1 hash of file content
     *
     * @private
     * @param content - File content
     * @returns string - SHA-1 hash
     */
    private computeHash;
    /**
     * Generates unique ID for a finding
     *
     * @private
     * @param fileHash - SHA-1 hash of file content
     * @param line - Line number
     * @param type - Finding type
     * @returns string - Unique ID
     */
    private generateFindingId;
    /**
     * Writes partial report for Phase 8
     *
     * @private
     * @param result - Phase 8 result
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-8-performance.d.ts.map