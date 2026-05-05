/**
 * Phase 13: i18n & l10n - Internationalization & Localization
 *
 * Purpose: Detect hardcoded strings that should be in translation files,
 * verify i18n library usage, and audit sensitive format handling (dates, currencies, numbers).
 *
 * Architecture:
 * - Hardcoded String Detection: Find user-facing strings not in translation files
 * - i18n Library Detection: Check for next-i18next, react-intl, etc.
 * - Format Audit: Verify Intl.DateTimeFormat, currency/number handling
 * - Thermal Verification: Mandatory resource check before scanning
 * - Batch Processing: Use BatchProcessor for thermal-safe processing
 *
 * @module phases/phase-13-i18n-l10n
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { FileFilter } from '../core/file-filter.js';
import { IgnoreHandler } from '../core/ignore-handler.js';
/**
 * i18n/l10n finding
 */
interface I18nFinding {
    /** Unique ID based on file hash + line */
    id: string;
    /** Finding type */
    type: 'hardcoded-string' | 'missing-i18n-lib' | 'format-issue' | 'locale-hardcode';
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
    /** The hardcoded string found (sanitized) */
    stringValue?: string;
}
/**
 * i18n library detection result
 */
interface I18nLibraryResult {
    /** Has i18n library installed */
    hasI18nLibrary: boolean;
    /** Library name detected */
    libraryName?: string;
    /** Has translation files */
    hasTranslationFiles: boolean;
    /** Translation file paths */
    translationFiles: string[];
}
/**
 * Phase 13 configuration
 */
interface Phase13Config {
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
 * Phase 13 result
 */
export interface Phase13Result {
    /** Overall success */
    success: boolean;
    /** Total files analyzed */
    totalFiles: number;
    /** i18n/l10n findings */
    i18nFindings: I18nFinding[];
    /** i18n library detection result */
    i18nLibrary: I18nLibraryResult;
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
 * Phase 13: i18n & l10n - Internationalization & Localization
 *
 * This phase detects hardcoded strings, verifies i18n library usage, and audits format handling.
 *
 * @class Phase13I18nL10n
 */
export declare class Phase13I18nL10n {
    private config;
    constructor(config: Phase13Config);
    /**
     * Executes Phase 13: i18n & l10n
     *
     * @returns Promise<Phase13Result> - i18n/l10n assessment result
     */
    execute(): Promise<Phase13Result>;
    /**
     * Gets all source files to analyze
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private getSourceFiles;
    /**
     * Detects i18n library usage
     *
     * @private
     * @returns Promise<I18nLibraryResult> - i18n library detection result
     */
    private detectI18nLibrary;
    /**
     * Analyzes a single file for i18n/l10n issues
     *
     * @private
     * @param filePath - File path
     * @param corePathFiles - Set of Core Path files
     * @param i18nLibrary - i18n library detection result
     * @param businessDomain - Business domain from Phase 2
     * @returns Promise<I18nFinding[]> - Array of findings
     */
    private analyzeFile;
    /**
     * Determines if a file is a UI file (component, page, view)
     *
     * @private
     * @param filePath - File path
     * @returns boolean - Whether file is a UI file
     */
    private isUIFile;
    /**
     * Detects hardcoded user-facing strings
     *
     * @private
     * @param content - File content
     * @param _filePath - File path (unused, kept for interface consistency)
     * @returns Array<{value: string, line: number}> - Hardcoded strings found
     */
    private detectHardcodedStrings;
    /**
     * Determines if a string is translatable (user-facing) vs technical (config/ID)
     *
     * LOGIC FOR DIFFERENTIATION:
     *
     * NON-TRANSLATABLE (skip):
     * - IDs: userId, orderId, productId (pattern: /^[a-z]+[A-Z]?[a-z]*Id$/)
     * - Object keys: key:, value:, type: (pattern: /^[a-z_]+:$/)
     * - URLs: http://, https://
     * - Routes: /api, /users, /products
     * - Constants: MAX_SIZE, API_KEY, DEFAULT_VALUE (pattern: /^[A-Z_]+$/)
     * - Technical terms: null, undefined, true, false, return, function, const, let, var
     * - Regular expressions: /pattern/
     * - CSS classes: className="..."
     * - Function names: onClick, onChange, onSubmit
     * - HTML attributes: href, src, alt, id, name
     * - Short strings: < 3 characters
     * - Single words without spaces (likely IDs or keys)
     * - Numbers and special characters only
     *
     * TRANSLATABLE (include):
     * - Strings with spaces (user-facing text)
     * - Sentences (multiple words)
     * - UI labels (Login, Sign Up, Submit, Cancel)
     * - Error messages (Please enter your email, Invalid password)
     * - Button text (Click here, Continue, Back)
     * - Form labels (Email address, Password, First name)
     * - Status messages (Loading..., Success, Error)
     * - Longer than 3 characters with letters and spaces
     *
     * @private
     * @param str - String to check
     * @returns boolean - Whether string is translatable
     */
    private isTranslatableString;
    /**
     * Detects hardcoded locale strings
     *
     * @private
     * @param content - File content
     * @returns Array<{locale: string, line: number}> - Locale hardcodes found
     */
    private detectLocaleHardcoding;
    /**
     * Detects format issues (date, currency, number)
     *
     * @private
     * @param content - File content
     * @returns Array<{issue: string, line: number}> - Format issues found
     */
    private detectFormatIssues;
    /**
     * Sanitizes a string for safe reporting
     *
     * @private
     * @param str - String to sanitize
     * @returns string - Sanitized string
     */
    private sanitizeString;
    /**
     * Writes partial report for Phase 13
     *
     * @private
     * @param findings - i18n/l10n findings
     * @param i18nLibrary - i18n library detection result
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
     * Self-Audit: Verifies that this phase does not report Aegis internal log strings as translatable
     *
     * @private
     * @returns Promise<void>
     */
    private selfAudit;
}
export {};
//# sourceMappingURL=phase-13a-i18n-l10n.d.ts.map