/**
 * Phase 7: Testing Strategy
 *
 * Purpose: Evaluate test infrastructure and detect testing blind spots.
 * Focus on Core Path coverage, test quality, and integration vs unit tests.
 *
 * Architecture:
 * - Test Coverage & Presence: Critical Gap Detection for Core Path
 * - Test Quality & Smells: Empty Tests, Logic in Tests, Hardcoded Mocks
 * - Integration vs Unit: Integration tests detection (especially for Fintech)
 *
 * @module phases/phase-7-testing-strategy
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * Testing finding
 */
interface TestingFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'missing-test' | 'empty-test' | 'logic-in-test' | 'hardcoded-mock' | 'missing-integration-test' | 'test-quality' | 'fragile-test' | 'lazy-testing' | 'urgent-testing-debt' | 'flaky-test' | 'environment-leak';
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
    /** Test file path (if applicable) */
    testFilePath?: string;
}
/**
 * Phase 7 configuration
 */
interface Phase7Config {
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
 * Phase 7 result
 */
export interface Phase7Result {
    /** Overall success */
    success: boolean;
    /** Testing findings */
    findings: TestingFinding[];
    /** Total critical findings */
    criticalFindings: number;
    /** Total high severity findings */
    highSeverityFindings: number;
    /** Files analyzed */
    filesAnalyzed: number;
    /** Test files found */
    testFilesFound: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 7: Testing Strategy
 *
 * This phase evaluates test infrastructure and detects testing blind spots.
 * Focuses on Core Path coverage, test quality, and integration vs unit tests.
 *
 * @class Phase7TestingStrategy
 * @example
 * ```typescript
 * const phase7 = new Phase7TestingStrategy({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase7.execute();
 * ```
 */
export declare class Phase7TestingStrategy {
    private config;
    constructor(config: Phase7Config);
    /**
     * Executes Phase 7: Testing Strategy
     *
     * @returns Promise<Phase7Result> - Testing strategy analysis result
     */
    execute(): Promise<Phase7Result>;
    /**
     * Scans for source files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private scanSourceFiles;
    /**
     * Scans for test files
     *
     * @private
     * @returns Promise<string[]> - Array of test file paths
     */
    private scanTestFiles;
    /**
     * Analyzes test coverage and detects critical gaps
     *
     * @private
     * @param sourceFiles - Source file paths
     * @param testFiles - Test file paths
     * @param criticalModules - Critical modules from Phase 2
     * @returns TestingFinding[] - Coverage findings
     */
    private analyzeTestCoverage;
    /**
     * Analyzes test quality and detects smells
     *
     * @private
     * @param testFilePath - Test file path
     * @param criticalModules - Critical modules from Phase 2
     * @returns Promise<TestingFinding[]> - Quality findings
     */
    private analyzeTestQuality;
    /**
     * Analyzes cross-phase coverage gap (High Complexity + no unit test = URGENT)
     *
     * @private
     * @param sourceFiles - Source file paths
     * @param testFiles - Test file paths
     * @param complexityScores - Complexity scores from Phase 1
     * @param criticalModules - Critical modules from Phase 2
     * @returns TestingFinding[] - Cross-phase coverage findings
     */
    private analyzeCrossPhaseCoverageGap;
    /**
     * Analyzes integration vs unit tests
     *
     * @private
     * @param testFiles - Test file paths
     * @param isFintech - Whether domain is Fintech
     * @returns TestingFinding[] - Integration test findings
     */
    private analyzeIntegrationTests;
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
     * Writes partial report for Phase 7
     *
     * @private
     * @param result - Phase 7 result
     * @param domain - Business domain
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-7-testing-strategy.d.ts.map