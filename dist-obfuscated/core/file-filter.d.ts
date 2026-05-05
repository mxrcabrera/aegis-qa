/**
 * FileFilter - Large file and extension guard with .aegisignore support
 *
 * Purpose: Filters files based on size, extension, and .aegisignore patterns
 * to prevent memory explosion and avoid analyzing binary files or large generated files.
 *
 * Architecture:
 * - Filters by file size (default: 500KB max)
 * - Filters by extension to skip binary files
 * - Loads .aegisignore from project root (same format as .gitignore)
 * - Supports .aegisrc.json exclude key for additional patterns
 * - Configurable max file size (default: 500KB)
 * - Prevents memory explosion on large files
 * - Flexible path detection (src/, lib/, app/, or root)
 *
 * @module core/file-filter
 * @since 2.0.0
 */
/**
 * File filter configuration
 */
interface FileFilterConfig {
    /** Maximum file size in bytes (default: 500KB) */
    maxFileSizeBytes?: number;
    /** Allowed file extensions (if specified, only these are analyzed) */
    allowedExtensions?: string[];
    /** Blocked file extensions (always skipped) */
    blockedExtensions?: string[];
    /** Blocked file patterns (glob patterns) */
    blockedPatterns?: string[];
    /** Project root directory (for loading .aegisignore) */
    projectRoot?: string;
    /** Additional exclusion patterns from .aegisrc.json */
    additionalExcludes?: string[];
    /** Whether to load .aegisignore file (default: true) */
    loadAegisignore?: boolean;
}
/**
 * File filter result
 */
interface FileFilterResult {
    /** Whether file should be analyzed */
    shouldAnalyze: boolean;
    /** Reason for skipping (if not analyzing) */
    reason?: string;
    /** File size in bytes */
    fileSize: number;
}
/**
 * FileFilter - Large file and extension guard
 *
 * This class filters files based on size and extension to prevent memory
 * explosion and avoid analyzing binary files or large generated files.
 *
 * @class FileFilter
 * @example
 * ```typescript
 * const filter = new FileFilter({ maxFileSizeBytes: 512000 });
 * const result = filter.shouldAnalyzeFile('/path/to/file.ts');
 * if (!result.shouldAnalyze) {
 *   console.log(`Skipping: ${result.reason}`);
 * }
 * ```
 */
export declare class FileFilter {
    private config;
    private maxFileSizeBytes;
    private blockedExtensions;
    private blockedPatterns;
    private static DEFAULT_BLOCKED_EXTENSIONS;
    private static DEFAULT_BLOCKED_PATTERNS;
    private static DEFAULT_AEGISIGNORE_PATTERNS;
    private aegisignorePatterns;
    private projectRoot;
    constructor(config?: FileFilterConfig);
    /**
     * Loads .aegisignore patterns from file or uses defaults
     *
     * @private
     * @param loadFromFile - Whether to load from file (default: true)
     */
    private loadAegisignorePatterns;
    /**
     * Parses gitignore-style content into patterns
     *
     * @private
     * @param content - Gitignore file content
     * @returns Array of patterns
     */
    private parseGitignore;
    /**
     * Converts gitignore pattern to regex
     *
     * @private
     * @param pattern - Gitignore pattern
     * @returns RegExp or null if pattern is invalid
     */
    private gitignorePatternToRegex;
    /**
     * Logs exclusion information at startup
     *
     * @private
     */
    private logExclusionInfo;
    /**
     * Checks if a file should be analyzed
     *
     * This method checks file size, extension, and patterns to determine
     * whether a file should be analyzed or skipped.
     *
     * @param filePath - Path to the file
     * @returns FileFilterResult - Filter result
     *
     * @example
     * ```typescript
     * const result = filter.shouldAnalyzeFile('/path/to/package-lock.json');
     * // { shouldAnalyze: false, reason: 'File too large (2.5MB > 500KB)', fileSize: 2621440 }
     * ```
     */
    shouldAnalyzeFile(filePath: string): FileFilterResult;
    /**
     * Checks if a file should be included (alias for shouldAnalyzeFile)
     *
     * This method provides a simpler API for file inclusion checks.
     *
     * @param filePath - Path to the file
     * @returns boolean - Whether the file should be included
     *
     * @example
     * ```typescript
     * const shouldInclude = filter.shouldInclude('/path/to/file.ts');
     * // true or false
     * ```
     */
    shouldInclude(filePath: string): boolean;
    /**
     * Filters an array of file paths
     *
     * @param filePaths - Array of file paths
     * @returns Array of file paths that should be analyzed
     *
     * @example
     * ```typescript
     * const files = ['/path/to/file.ts', '/path/to/image.png'];
     * const filtered = filter.filterFiles(files);
     * // ['/path/to/file.ts']
     * ```
     */
    filterFiles(filePaths: string[]): string[];
    /**
     * Gets the current max file size
     *
     * @returns Max file size in bytes
     */
    getMaxFileSize(): number;
    /**
     * Sets the max file size
     *
     * @param sizeBytes - New max file size in bytes
     */
    setMaxFileSize(sizeBytes: number): void;
    /**
     * Adds a blocked extension
     *
     * @param extension - Extension to block (e.g., '.log')
     */
    addBlockedExtension(extension: string): void;
    /**
     * Adds a blocked pattern
     *
     * @param pattern - Pattern to block (as RegExp string)
     */
    addBlockedPattern(pattern: string): void;
    /**
     * Detects the source directory for a project
     *
     * This function checks for common source directory patterns:
     * - src/ (most common)
     * - lib/ (common in older projects)
     * - app/ (common in some frameworks)
     * - root directory (fallback)
     *
     * @param projectRoot - Project root directory
     * @returns string - Detected source directory path (relative to projectRoot)
     *
     * @example
     * ```typescript
     * const sourceDir = FileFilter.detectSourceDirectory('/path/to/project');
     * // Returns 'src' if src/ exists, 'lib' if lib/ exists, etc.
     * ```
     */
    static detectSourceDirectory(projectRoot: string): string;
    /**
     * Gets source file patterns based on detected source directory
     *
     * @param projectRoot - Project root directory
     * @returns string[] - Array of glob patterns for source files
     */
    static getSourceFilePatterns(projectRoot: string): string[];
}
export {};
//# sourceMappingURL=file-filter.d.ts.map