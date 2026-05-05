/**
 * Phase 1: Code Quality - Technical Health Assessment
 *
 * Purpose: Evaluate the technical health of the code by detecting code smells,
 * complexity issues, and naming inconsistencies. This is about finding code that will
 * be difficult to maintain, not just syntax errors.
 *
 * Architecture:
 * - Cyclomatic Complexity: Detect functions too long or too nested
 * - Linter-like Rules: Find inconsistencies, unused variables, unnecessary any
 * - Naming Consistency: Check camelCase, PascalCase patterns
 * - Scoring System: Each file gets a quality score (0-100)
 * - Integration with BatchProcessor for thermal-safe processing
 *
 * @module phases/phase-1-code-quality
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * Code quality finding
 */
interface CodeQualityFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'complexity' | 'naming' | 'unused' | 'any' | 'inconsistency';
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
 * File quality score
 */
interface FileQualityScore {
    /** File path */
    filePath: string;
    /** Quality score (0-100) */
    score: number;
    /** Findings for this file */
    findings: CodeQualityFinding[];
    /** Whether file is critical (low score) */
    isCritical: boolean;
}
/**
 * Phase 1 configuration
 */
interface Phase1Config {
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
    /** Maximum complexity threshold */
    maxComplexity?: number;
    /** Maximum function length (lines) */
    maxFunctionLength?: number;
    /** Maximum nesting depth */
    maxNestingDepth?: number;
    /** Timeout for individual file analysis in milliseconds */
    fileTimeoutMs?: number;
}
/**
 * Phase 1 result
 */
export interface Phase1Result {
    /** Overall success */
    success: boolean;
    /** Total files analyzed */
    totalFiles: number;
    /** Files with quality scores */
    fileScores: FileQualityScore[];
    /** Total findings */
    totalFindings: number;
    /** Critical files (low score) */
    criticalFiles: string[];
    /** Average quality score */
    averageScore: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 1: Code Quality - Technical Health Assessment
 *
 * This phase evaluates the technical health of the code by detecting code smells,
 * complexity issues, and naming inconsistencies.
 *
 * @class Phase1CodeQuality
 * @example
 * ```typescript
 * const phase1 = new Phase1CodeQuality({
 *   projectRoot: '/path/to/project',
 *   thermalController: new ThermalController(),
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   fileFilter: new FileFilter(),
 *   ignoreHandler: new IgnoreHandler({ projectRoot: '/path/to/project' }),
 *   currentState: executionState,
 * });
 * const result = await phase1.execute();
 * ```
 */
export declare class Phase1CodeQuality {
    private config;
    constructor(config: Phase1Config);
    /**
     * Executes Phase 1: Code Quality
     *
     * @returns Promise<Phase1Result> - Code quality assessment result
     */
    execute(): Promise<Phase1Result>;
    /**
     * Gets all TypeScript/JavaScript source files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private getSourceFiles;
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
     * Analyzes a single file for code quality issues
     *
     * @private
     * @param filePath - File path
     * @returns Promise<FileQualityScore> - File quality score
     */
    private analyzeFile;
    /**
     * Internal file analysis without timeout wrapper
     *
     * @private
     * @param filePath - File path
     * @returns Promise<FileQualityScore> - File quality score
     */
    private analyzeFileInternal;
    /**
     * Analyzes cyclomatic complexity
     *
     * @private
     * @param content - File content
     * @param filePath - File path
     * @param fileHash - SHA-1 hash of file content
     * @returns CodeQualityFinding[] - Complexity findings
     */
    private analyzeComplexity;
    /**
     * Calculates maximum nesting depth in code
     *
     * @private
     * @param code - Code to analyze
     * @returns number - Maximum nesting depth
     */
    private calculateNestingDepth;
    /**
     * Analyzes linter-like rules
     *
     * @private
     * @param content - File content
     * @param filePath - File path
     * @param fileHash - SHA-1 hash of file content
     * @returns CodeQualityFinding[] - Linter findings
     */
    private analyzeLinterRules;
    /**
     * Analyzes naming consistency
     *
     * @private
     * @param content - File content
     * @param filePath - File path
     * @param fileHash - SHA-1 hash of file content
     * @returns CodeQualityFinding[] - Naming findings
     */
    private analyzeNamingConsistency;
    /**
     * Calculates quality score from findings
     *
     * @private
     * @param findings - Code quality findings
     * @returns number - Quality score (0-100)
     */
    private calculateQualityScore;
    /**
     * Writes partial report with unique IDs for findings
     *
     * @private
     * @param fileScores - File quality scores
     * @param allFindings - All findings
     * @param averageScore - Average quality score
     * @param criticalFiles - Critical files
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-1-code-quality.d.ts.map