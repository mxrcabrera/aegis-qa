/**
 * Style Auditor - Style Violation Detection for Aegis QA
 *
 * This module scans component files to detect style violations including:
 * - Tailwind class duplicates and unnecessary arbitrary values
 * - Basic accessibility issues (missing alt attributes on images)
 * - Hardcoded styles that should use Tailwind classes
 *
 * Integrates with:
 * - ReportAggregator for centralized violation management
 * - ThermalController for hardware protection
 * - DomainMap for business context awareness
 *
 * @module style-auditor
 * @since 1.0.0
 */
import { ReportAggregator } from '../core/reporter.js';
import type { ThermalController } from '../core/thermal-controller.js';
import type { DomainMap } from '../types/domain.js';
/**
 * Style auditor configuration
 */
export interface StyleAuditorConfig {
    /** Root directory of the project to audit */
    projectRoot: string;
    /** Directory patterns to scan (default: components) */
    scanPatterns?: string[];
    /** File extensions to scan */
    fileExtensions?: string[];
    /** Domain map for business context */
    domainMap?: DomainMap;
    /** Thermal controller for hardware protection */
    thermalController?: ThermalController;
    /** Report aggregator for centralized violations */
    reporter?: ReportAggregator;
    /** Maximum files to process per batch */
    maxFilesPerBatch?: number;
    /** Cooldown between batches (ms) */
    batchCooldownMs?: number;
    /** Whether to enable auto-fix suggestions */
    enableAutoFix?: boolean;
}
/**
 * StyleAuditor class
 *
 * Detects style violations in component files with hardware protection
 * and business context awareness.
 */
export declare class StyleAuditor {
    private config;
    private fileMetadataCache;
    /**
     * Creates a new StyleAuditor instance
     *
     * @param config - Configuration for style auditing
     */
    constructor(config: StyleAuditorConfig);
    /**
     * Runs style audit on the project
     *
     * This method scans component files for style violations, checks thermal
     * status before processing, and uses the ReportAggregator to centralize
     * violations. It also provides business context for violations.
     *
     * @returns Promise<number> - Number of violations found
     */
    audit(): Promise<number>;
    /**
     * Finds all files to scan
     *
     * @private
     * @returns Promise<string[]> - Array of file paths
     */
    private findFiles;
    /**
     * Creates batches of files for processing
     *
     * @private
     * @param files - Files to batch
     * @returns string[][] - Array of file batches
     */
    private createBatches;
    /**
     * Processes a batch of files
     *
     * @private
     * @param files - Files to process
     * @returns Promise<Violation[]> - Violations found
     */
    private processBatch;
    /**
     * Analyzes a single file for style violations
     *
     * @private
     * @param fullPath - Full path to the file
     * @param relativePath - Relative path to the file
     * @returns Promise<Violation[]> - Violations found in the file
     */
    private analyzeFile;
    /**
     * Checks if a line contains dynamic Tailwind class generation
     *
     * This method detects template literals and other patterns where Tailwind
     * classes are generated dynamically, which should be ignored to avoid
     * false positives.
     *
     * @private
     * @param line - Line of code to check
     * @returns boolean - True if line contains dynamic Tailwind generation
     */
    private isDynamicTailwind;
    /**
     * Checks Tailwind classes for violations
     *
     * @private
     * @param line - Line of code
     * @param lineNumber - Line number
     * @param metadata - File metadata
     * @returns Violation[] - Tailwind class violations
     */
    private checkTailwindClasses;
    /**
     * Analyzes Tailwind classes for duplicates, arbitrary values, and conflicts
     *
     * @private
     * @param classes - Array of Tailwind classes
     * @returns TailwindClassAnalysis - Analysis result
     */
    private analyzeTailwindClasses;
    /**
     * Checks for accessibility issues
     *
     * @private
     * @param line - Line of code
     * @param lineNumber - Line number
     * @param metadata - File metadata
     * @returns Violation[] - Accessibility violations
     */
    private checkAccessibility;
    /**
     * Checks for Next.js optimization issues
     *
     * @private
     * @param line - Line of code
     * @param lineNumber - Line number
     * @param metadata - File metadata
     * @returns Violation[] - Next.js optimization violations
     */
    private checkNextJsOptimizations;
    /**
     * Checks for hardcoded styles
     *
     * @private
     * @param line - Line of code
     * @param lineNumber - Line number
     * @param metadata - File metadata
     * @returns Violation[] - Hardcoded style violations
     */
    private checkHardcodedStyles;
    /**
     * Creates a violation object
     *
     * @private
     * @param type - Violation type
     * @param severity - Severity level
     * @param lineNumber - Line number
     * @param metadata - File metadata
     * @param message - Violation message
     * @param suggestion - Suggested fix
     * @param rule - Rule identifier
     * @param autoFixable - Whether auto-fix is available
     * @returns Violation - Violation object
     */
    private createViolation;
    /**
     * Adds business context to a violation message
     *
     * @private
     * @param message - Original message
     * @param metadata - File metadata
     * @returns string - Message with business context
     */
    private addBusinessContext;
    /**
     * Gets file metadata
     *
     * @private
     * @param fullPath - Full file path
     * @param relativePath - Relative file path
     * @returns FileMetadata - File metadata
     */
    private getFileMetadata;
    /**
     * Checks if a file is in a critical path
     *
     * @private
     * @param relativePath - Relative file path
     * @returns boolean - Whether file is in critical path
     */
    private isInCriticalPath;
    /**
     * Gets the critical path name for a file
     *
     * @private
     * @param relativePath - Relative file path
     * @returns string | undefined - Critical path name
     */
    private getCriticalPathName;
    /**
     * Clears the file metadata cache
     */
    clearCache(): void;
}
//# sourceMappingURL=style-auditor.d.ts.map