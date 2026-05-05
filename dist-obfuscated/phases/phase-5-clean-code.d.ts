/**
 * Phase 5: Clean Code & Refactoring
 *
 * Purpose: Evaluate readability, maintainability, and adherence to SOLID/DRY principles.
 * Detect real technical debt, not just style issues.
 *
 * Architecture:
 * - SOLID & Design Patterns: God Objects, Open/Closed violations
 * - Code Smells: Deep Nesting, Magic Numbers, Long Parameter List
 * - Refactoring Suggestions: Low Quality Score + Critical Module
 *
 * @module phases/phase-5-clean-code
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { ThermalController } from '../core/thermal-controller.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * Clean code finding
 */
interface CleanCodeFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'god-object' | 'open-closed-violation' | 'deep-nesting' | 'magic-number' | 'long-parameter-list' | 'refactoring-suggestion';
    /** Severity: low, medium, high */
    severity: 'low' | 'medium' | 'high';
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
 * Phase 5 configuration
 */
interface Phase5Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** Thermal controller for batch intelligence */
    thermalController?: ThermalController;
    /** File filter for filtering files */
    fileFilter?: FileFilter;
    /** Ignore handler for filtering */
    ignoreHandler?: IgnoreHandler;
}
/**
 * Phase 5 result
 */
export interface Phase5Result {
    /** Overall success */
    success: boolean;
    /** Clean code findings */
    findings: CleanCodeFinding[];
    /** Total high severity findings */
    highSeverityFindings: number;
    /** Total medium severity findings */
    mediumSeverityFindings: number;
    /** Files analyzed */
    filesAnalyzed: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 5: Clean Code & Refactoring
 *
 * This phase evaluates readability, maintainability, and adherence to SOLID/DRY principles.
 * Detects real technical debt, not just style issues.
 *
 * @class Phase5CleanCode
 * @example
 * ```typescript
 * const phase5 = new Phase5CleanCode({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase5.execute();
 * ```
 */
export declare class Phase5CleanCode {
    private config;
    constructor(config: Phase5Config);
    /**
     * Executes Phase 5: Clean Code
     *
     * @returns Promise<Phase5Result> - Clean code analysis result
     */
    execute(): Promise<Phase5Result>;
    /**
     * Scans for source files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private scanFiles;
    /**
     * Analyzes a single file for clean code issues
     *
     * @private
     * @param filePath - File path
     * @param criticalModules - Critical modules from Phase 2
     * @param qualityScores - Quality scores from Phase 1
     * @returns Promise<CleanCodeFinding[]> - Clean code findings
     */
    private analyzeFile;
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
     * Analyzes SOLID principles and design patterns
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @returns CleanCodeFinding[] - SOLID findings
     */
    private analyzeSOLID;
    /**
     * Analyzes code smells
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @returns CleanCodeFinding[] - Code smell findings
     */
    private analyzeCodeSmells;
    /**
     * Writes partial report for Phase 5
     *
     * @private
     * @param result - Phase 5 result
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-5-clean-code.d.ts.map