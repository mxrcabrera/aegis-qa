/**
 * File Whitelist - Controls Which Files Can Be Modified
 *
 * Purpose: Validates file paths against a whitelist of safe patterns
 * to prevent unauthorized modifications to critical files.
 *
 * @module core/file-whitelist
 * @since 2.0.0
 */
/**
 * File whitelist configuration
 */
export interface FileWhitelistConfig {
    /** Allowed file extensions */
    allowedExtensions?: string[];
    /** Allowed file patterns (glob patterns) */
    allowedPatterns?: string[];
    /** Blocked file patterns (takes precedence over allowed) */
    blockedPatterns?: string[];
    /** Whether to allow modifications to any file if whitelist is empty */
    allowAllIfEmpty?: boolean;
    /** Whether to enable logging */
    enableLogging?: boolean;
}
/**
 * File whitelist validation result
 */
export interface FileWhitelistResult {
    /** Whether file is allowed to be modified */
    allowed: boolean;
    /** Reason for denial if not allowed */
    reason?: string;
    /** File path */
    filePath: string;
    /** Matching pattern if any */
    matchedPattern?: string;
}
/**
 * File Whitelist - Controls which files can be modified
 *
 * @class FileWhitelist
 */
export declare class FileWhitelist {
    private config;
    private blockedFiles;
    private allowedFiles;
    constructor(config?: FileWhitelistConfig);
    /**
     * Checks if a file is allowed to be modified
     *
     * @param filePath - Path to file
     * @returns FileWhitelistResult - Validation result
     */
    canModify(filePath: string): FileWhitelistResult;
    /**
     * Gets file extension
     *
     * @private
     * @param filePath - File path
     * @returns string - File extension including dot
     */
    private getExtension;
    /**
     * Checks if a file is blocked by pattern
     *
     * @private
     * @param filePath - File path
     * @returns string | null - Matching blocked pattern or null
     */
    private isBlocked;
    /**
     * Checks if a file is allowed by pattern
     *
     * @private
     * @param filePath - File path
     * @returns string | null - Matching allowed pattern or null
     */
    private isAllowedByPattern;
    /**
     * Checks if a path matches a pattern
     *
     * @private
     * @param path - Normalized path
     * @param pattern - Pattern to match
     * @returns boolean - True if matches
     */
    private matchesPattern;
    /**
     * Logs a blocked file
     *
     * @private
     * @param filePath - File path
     * @param reason - Reason for blocking
     */
    private logBlocked;
    /**
     * Logs an allowed file
     *
     * @private
     * @param filePath - File path
     * @param reason - Reason for allowing
     */
    private logAllowed;
    /**
     * Gets whitelist statistics
     *
     * @returns Object with file counts
     */
    getStats(): {
        allowed: number;
        blocked: number;
        total: number;
    };
    /**
     * Resets whitelist statistics
     */
    resetStats(): void;
    /**
     * Updates the whitelist configuration
     *
     * @param config - New configuration
     */
    updateConfig(config: Partial<FileWhitelistConfig>): void;
}
/**
 * Global file whitelist instance
 */
export declare const globalFileWhitelist: FileWhitelist;
//# sourceMappingURL=file-whitelist.d.ts.map