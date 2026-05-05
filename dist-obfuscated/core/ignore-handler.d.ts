/**
 * IgnoreHandler - Glob Optimization with .aegisignore
 *
 * Purpose: Read and parse .aegisignore file (inheriting from .gitignore) to
 * optimize glob patterns and avoid scanning unnecessary directories like node_modules
 * or .git, which saves time and prevents memory issues.
 *
 * Architecture:
 * - Reads .aegisignore if it exists
 * - Falls back to .gitignore if .aegisignore doesn't exist
 * - Parses ignore patterns (gitignore syntax)
 * - Provides filter function for file paths
 * - Merges default ignore patterns with custom ones
 *
 * @module core/ignore-handler
 * @since 2.0.0
 */
/**
 * Ignore handler configuration
 */
interface IgnoreHandlerConfig {
    /** Project root directory */
    projectRoot: string;
    /** Custom ignore patterns to add */
    additionalPatterns?: string[];
    /** Whether to inherit from .gitignore if .aegisignore doesn't exist */
    inheritFromGitignore?: boolean;
}
/**
 * IgnoreHandler - Glob optimization with ignore patterns
 *
 * This class reads .aegisignore (or .gitignore) and provides a filter
 * function to exclude files and directories from analysis.
 *
 * @class IgnoreHandler
 * @example
 * ```typescript
 * const handler = new IgnoreHandler({ projectRoot: '/path/to/project' });
 * const shouldIgnore = handler.shouldIgnore('/path/to/node_modules/package.json');
 * // true
 * ```
 */
export declare class IgnoreHandler {
    private config;
    private ignorePatterns;
    private projectRoot;
    private static DEFAULT_PATTERNS;
    constructor(config: IgnoreHandlerConfig);
    /**
     * Loads ignore patterns from .aegisignore or .gitignore
     *
     * @private
     */
    private loadIgnorePatterns;
    /**
     * Parses an ignore file (gitignore syntax)
     *
     * @private
     * @param content - File content
     * @returns string[] - Array of ignore patterns
     */
    private parseIgnoreFile;
    /**
     * Checks if a file path should be ignored
     *
     * This method checks the file path against all ignore patterns.
     * Patterns support gitignore syntax including wildcards and directory patterns.
     *
     * @param filePath - File path to check (absolute or relative)
     * @returns boolean - Whether the file should be ignored
     *
     * @example
     * ```typescript
     * shouldIgnore('/path/to/node_modules/package.json') // true
     * shouldIgnore('/path/to/src/index.ts') // false
     * ```
     */
    shouldIgnore(filePath: string): boolean;
    /**
     * Checks if a path matches an ignore pattern
     *
     * @private
     * @param path - File path (normalized, relative to project root)
     * @param pattern - Ignore pattern
     * @returns boolean - Whether the path matches the pattern
     */
    private matchesPattern;
    /**
     * Converts a glob pattern to a regular expression
     *
     * @private
     * @param pattern - Glob pattern
     * @returns RegExp - Regular expression
     */
    private patternToRegex;
    /**
     * Filters an array of file paths
     *
     * @param filePaths - Array of file paths
     * @returns string[] - Filtered array (non-ignored files)
     *
     * @example
     * ```typescript
     * const files = ['/path/to/src/index.ts', '/path/to/node_modules/pkg/index.js'];
     * const filtered = handler.filterFiles(files);
     * // ['/path/to/src/index.ts']
     * ```
     */
    filterFiles(filePaths: string[]): string[];
    /**
     * Gets the current ignore patterns
     *
     * @returns string[] - Array of ignore patterns
     */
    getPatterns(): string[];
    /**
     * Adds a custom ignore pattern
     *
     * @param pattern - Pattern to add
     */
    addPattern(pattern: string): void;
    /**
     * Removes an ignore pattern
     *
     * @param pattern - Pattern to remove
     */
    removePattern(pattern: string): void;
}
export {};
//# sourceMappingURL=ignore-handler.d.ts.map