/**
 * Phase 9: Internationalization & Accessibility (i18n & a11y)
 *
 * Purpose: Detect access barriers and localization problems before they affect real users.
 * Focus on i18n (localization) and a11y (accessibility) issues.
 *
 * Architecture:
 * - i18n: Hardcoded Strings, hardcoded date/currency/number formats
 * - a11y: Missing alt tags, aria-labels, incorrect semantic roles
 * - Critical Module Scaling: Form handling in Core Path = higher severity
 *
 * @module phases/phase-9-i18n-a11y
 * @since 2.0.0
 */
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * i18n & a11y finding
 */
interface I18nA11yFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'hardcoded-string' | 'hardcoded-format' | 'missing-alt' | 'missing-aria' | 'incorrect-role' | 'i18n-a11y-issue';
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
 * Phase 9 configuration
 */
interface Phase9Config {
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
 * Phase 9 result
 */
export interface Phase9Result {
    /** Overall success */
    success: boolean;
    /** i18n & a11y findings */
    findings: I18nA11yFinding[];
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
 * Phase 9: Internationalization & Accessibility (i18n & a11y)
 *
 * This phase detects access barriers and localization problems before they affect real users.
 * Focuses on i18n (localization) and a11y (accessibility) issues.
 *
 * @class Phase9I18nA11y
 * @example
 * ```typescript
 * const phase9 = new Phase9I18nA11y({
 *   projectRoot: '/path/to/project',
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   currentState: executionState,
 * });
 * const result = await phase9.execute();
 * ```
 */
export declare class Phase9I18nA11y {
    private config;
    constructor(config: Phase9Config);
    /**
     * Executes Phase 9: Internationalization & Accessibility
     *
     * @returns Promise<Phase9Result> - i18n & a11y analysis result
     */
    execute(): Promise<Phase9Result>;
    /**
     * Scans for UI files
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private scanUIFiles;
    /**
     * Analyzes a single file for i18n & a11y issues
     *
     * @private
     * @param filePath - File path
     * @param criticalModules - Critical modules from Phase 2
     * @param isFintech - Whether domain is Fintech
     * @returns Promise<I18nA11yFinding[]> - i18n & a11y findings
     */
    private analyzeFile;
    /**
     * Analyzes i18n issues (Hardcoded Strings, hardcoded formats)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param isFintech - Whether domain is Fintech
     * @returns I18nA11yFinding[] - i18n findings
     */
    private analyzeI18n;
    /**
     * Analyzes a11y issues (missing alt tags, aria-labels, incorrect semantic roles)
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param fileHash - File hash
     * @param isCriticalModule - Whether file is in Critical Module
     * @param isFintech - Whether domain is Fintech
     * @returns I18nA11yFinding[] - a11y findings
     */
    private analyzeA11y;
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
     * Writes partial report for Phase 9
     *
     * @private
     * @param result - Phase 9 result
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-9-i18n-a11y.d.ts.map