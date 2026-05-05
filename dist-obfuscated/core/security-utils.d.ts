/**
 * Security Utilities - Common Hardening Functions
 *
 * Purpose: Provide common security hardening functions for all phases
 * including path validation, error sanitization, and resource limits.
 *
 * @module core/security-utils
 * @since 1.0.0
 */
/**
 * Validates a file path to prevent path traversal attacks
 *
 * @param filePath - File path to validate
 * @param projectRoot - Project root directory
 * @returns boolean - True if path is valid and safe
 */
export declare function validatePath(filePath: string, projectRoot: string): boolean;
/**
 * Strictly validates a file path with enhanced security checks
 *
 * @param filePath - File path to validate
 * @param projectRoot - Project root directory
 * @param options - Additional validation options
 * @returns object - Validation result with reason if invalid
 */
export declare function validatePathStrict(filePath: string, projectRoot: string, options?: {
    allowedExtensions?: string[];
    blockedPaths?: string[];
    maxSizeBytes?: number;
}): Promise<{
    valid: boolean;
    reason?: string;
}>;
/**
 * Sanitizes error messages to prevent information leakage
 *
 * @param error - Error object or message
 * @param _options - Sanitization options (reserved for future use)
 * @returns string - Sanitized error message
 */
export declare function sanitizeError(error: unknown, _options?: {
    verbose?: boolean;
    includeStack?: boolean;
}): string;
/**
 * Creates a generic error message for user-facing errors
 *
 * @param _error - Error object or message (reserved for future use)
 * @param context - Context about where the error occurred
 * @returns string - Generic error message
 */
export declare function createGenericError(_error: unknown, context?: string): string;
/**
 * Safe error handler that logs details but returns generic message to user
 *
 * @param error - Error object or message
 * @param context - Context about where the error occurred
 * @returns object - Generic message for user and detailed error for logging
 */
export declare function handleSecureError(error: unknown, context?: string): {
    userMessage: string;
    logMessage: string;
    originalError?: Error;
};
/**
 * Sanitizes output for reports to prevent code injection
 *
 * @param content - Content to sanitize
 * @param options - Sanitization options
 * @returns string - Sanitized content
 */
export declare function sanitizeOutput(content: string, options?: {
    allowHTML?: boolean;
    allowMarkdown?: boolean;
    escapeSpecialChars?: boolean;
}): string;
/**
 * Sanitizes markdown content for safe rendering
 *
 * @param markdown - Markdown content to sanitize
 * @returns string - Sanitized markdown
 */
export declare function sanitizeMarkdown(markdown: string): string;
/**
 * Checks if a file size is within safe limits
 *
 * @param fileSize - File size in bytes
 * @param maxSizeMB - Maximum file size in megabytes (default: 100MB)
 * @returns boolean - True if file size is within limits
 */
export declare function validateFileSize(fileSize: number, maxSizeMB?: number): boolean;
/**
 * Checks if a string contains potential secrets
 *
 * @param str - String to check
 * @returns boolean - True if string might contain secrets
 */
export declare function containsSecret(str: string): boolean;
/**
 * Censors secrets from a string
 *
 * @param str - String to censor
 * @returns string - Censored string
 */
export declare function censorSecrets(str: string): string;
/**
 * Validates a timeout value
 *
 * @param timeoutMs - Timeout in milliseconds
 * @param maxTimeoutMs - Maximum timeout in milliseconds (default: 5 minutes)
 * @returns boolean - True if timeout is valid
 */
export declare function validateTimeout(timeoutMs: number, maxTimeoutMs?: number): boolean;
/**
 * Creates a timeout promise
 *
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects after timeout
 */
export declare function createTimeout(ms: number): Promise<never>;
/**
 * Operation type for granular timeouts
 */
export type OperationType = 'fileRead' | 'fileWrite' | 'fileDelete' | 'fileSearch' | 'networkRequest' | 'phaseExecution' | 'aiProcessing' | 'syntaxValidation' | 'gitOperation' | 'custom';
/**
 * Granular timeout configuration
 */
export interface TimeoutConfig {
    /** Default timeout in milliseconds */
    defaultTimeoutMs: number;
    /** Maximum timeout in milliseconds */
    maxTimeoutMs: number;
    /** Per-operation type timeouts */
    operationTimeouts: Record<OperationType, number>;
}
/**
 * Default timeout configurations for different operation types
 */
export declare const DefaultTimeoutConfig: TimeoutConfig;
/**
 * Timeout manager for granular operation timeouts
 */
export declare class TimeoutManager {
    private config;
    private activeTimeouts;
    constructor(config?: Partial<TimeoutConfig>);
    /**
     * Gets timeout for a specific operation type
     */
    getTimeout(operationType: OperationType): number;
    /**
     * Sets timeout for a specific operation type
     */
    setTimeout(operationType: OperationType, timeoutMs: number): void;
    /**
     * Wraps an operation with a timeout
     */
    withTimeout<T>(operation: Promise<T>, operationType: OperationType, operationId?: string): Promise<T>;
    /**
     * Clears a specific timeout
     */
    clearTimeout(id: string): void;
    /**
     * Clears all active timeouts
     */
    clearTimeouts(): void;
    /**
     * Gets the number of active timeouts
     */
    getActiveTimeoutCount(): number;
    /**
     * Updates the configuration
     */
    updateConfig(config: Partial<TimeoutConfig>): void;
}
/**
 * Creates a timeout manager instance
 */
export declare function createTimeoutManager(config?: Partial<TimeoutConfig>): TimeoutManager;
/**
 * Global timeout manager instance
 */
export declare const globalTimeoutManager: TimeoutManager;
/**
 * File I/O sandbox configuration
 */
interface FileIOSandboxConfig {
    /** Maximum file size in bytes */
    maxFileSizeBytes: number;
    /** Allowed file extensions */
    allowedExtensions: string[];
    /** Blocked file patterns */
    blockedPatterns: string[];
    /** Whether to enable path validation */
    enablePathValidation: boolean;
    /** Project root for path validation */
    projectRoot?: string;
}
/**
 * File I/O sandbox result
 */
interface FileIOSandboxResult {
    /** Whether the operation is allowed */
    allowed: boolean;
    /** Reason if not allowed */
    reason?: string;
    /** Sanitized file path */
    sanitizedPath?: string;
}
/**
 * Default file I/O sandbox configuration
 */
export declare const DefaultFileIOSandboxConfig: FileIOSandboxConfig;
/**
 * File I/O sandbox for safe file operations
 */
export declare class FileIOSandbox {
    private config;
    constructor(config?: Partial<FileIOSandboxConfig>);
    /**
     * Validates a file operation before execution
     */
    validateFileOperation(filePath: string, operation: 'read' | 'write' | 'delete'): Promise<FileIOSandboxResult>;
    /**
     * Safely reads a file with sandboxing
     */
    safeReadFile(filePath: string): Promise<string | null>;
    /**
     * Safely writes a file with sandboxing
     */
    safeWriteFile(filePath: string, content: string): Promise<void>;
    /**
     * Safely deletes a file with sandboxing
     */
    safeDeleteFile(filePath: string): Promise<void>;
    /**
     * Updates the sandbox configuration
     */
    updateConfig(config: Partial<FileIOSandboxConfig>): void;
    /**
     * Gets the current configuration
     */
    getConfig(): FileIOSandboxConfig;
}
/**
 * Creates a file I/O sandbox instance
 */
export declare function createFileIOSandbox(config?: Partial<FileIOSandboxConfig>): FileIOSandbox;
/**
 * Global file I/O sandbox instance
 */
export declare const globalFileIOSandbox: FileIOSandbox;
/**
 * Safe JSON parse with size limit
 *
 * @param json - JSON string to parse
 * @param maxSizeKB - Maximum size in kilobytes (default: 1MB)
 * @returns Parsed object or null if invalid
 */
export declare function safeJsonParse(json: string, maxSizeKB?: number): unknown | null;
/**
 * Validates a filename to prevent directory traversal
 *
 * @param filename - Filename to validate
 * @returns boolean - True if filename is valid
 */
export declare function validateFilename(filename: string): boolean;
/**
 * Permission check result
 */
interface PermissionCheckResult {
    /** Whether the permission check passed */
    allowed: boolean;
    /** Reason if not allowed */
    reason?: string;
    /** Permission type that was checked */
    permission: 'read' | 'write' | 'execute' | 'delete';
}
/**
 * Checks if the current process has read permission for a file
 *
 * @param filePath - File path to check
 * @returns Promise<PermissionCheckResult> - Permission check result
 */
export declare function checkReadPermission(filePath: string): Promise<PermissionCheckResult>;
/**
 * Checks if the current process has write permission for a file
 *
 * @param filePath - File path to check
 * @returns Promise<PermissionCheckResult> - Permission check result
 */
export declare function checkWritePermission(filePath: string): Promise<PermissionCheckResult>;
/**
 * Checks if the current process has execute permission for a file
 *
 * @param filePath - File path to check
 * @returns Promise<PermissionCheckResult> - Permission check result
 */
export declare function checkExecutePermission(filePath: string): Promise<PermissionCheckResult>;
/**
 * Verifies permissions before a critical operation
 *
 * @param operation - Type of operation to perform
 * @param filePath - File path to check permissions for
 * @returns Promise<void> - Throws error if permissions are insufficient
 * @throws {Error} If permission check fails
 */
export declare function verifyPermission(operation: 'read' | 'write' | 'execute' | 'delete', filePath: string): Promise<void>;
/**
 * Checks if a file is writable (for new files, checks directory permission)
 *
 * @param filePath - File path to check
 * @returns Promise<PermissionCheckResult> - Permission check result
 */
export declare function checkFileWritable(filePath: string): Promise<PermissionCheckResult>;
/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
    /** Maximum requests allowed in the time window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Whether to reset the counter after each window */
    resetAfterWindow?: boolean;
}
/**
 * Rate limiter for preventing resource abuse
 */
declare class RateLimiter {
    private config;
    private requests;
    private cleanupInterval?;
    constructor(config: RateLimiterConfig);
    /**
     * Checks if a request is allowed based on rate limits
     *
     * @param identifier - Unique identifier for the requester (e.g., IP, user ID)
     * @returns boolean - True if request is allowed
     */
    isAllowed(identifier: string): boolean;
    /**
     * Gets the number of remaining requests for an identifier
     *
     * @param identifier - Unique identifier for the requester
     * @returns number - Number of remaining requests
     */
    getRemainingRequests(identifier: string): number;
    /**
     * Resets the rate limit for a specific identifier
     *
     * @param identifier - Unique identifier for the requester
     */
    reset(identifier: string): void;
    /**
     * Resets all rate limits
     */
    resetAll(): void;
    /**
     * Starts cleanup interval to remove old entries
     *
     * @private
     */
    private startCleanup;
    /**
     * Stops the cleanup interval
     */
    destroy(): void;
}
/**
 * Creates a rate limiter instance
 *
 * @param config - Rate limiter configuration
 * @returns RateLimiter - Rate limiter instance
 *
 * @example
 * ```typescript
 * const limiter = createRateLimiter({ maxRequests: 100, windowMs: 60000 });
 * if (limiter.isAllowed('user-123')) {
 *   // Process request
 * } else {
 *   // Rate limit exceeded
 * }
 * ```
 */
export declare function createRateLimiter(config: RateLimiterConfig): RateLimiter;
/**
 * Default rate limiter configurations for different operation types
 */
export declare const RateLimitDefaults: {
    fileRead: {
        maxRequests: number;
        windowMs: number;
    };
    fileWrite: {
        maxRequests: number;
        windowMs: number;
    };
    fileDelete: {
        maxRequests: number;
        windowMs: number;
    };
    apiCall: {
        maxRequests: number;
        windowMs: number;
    };
    phaseExecution: {
        maxRequests: number;
        windowMs: number;
    };
};
/**
 * Dependency integrity check result
 */
interface DependencyIntegrityResult {
    /** Whether the dependency is valid */
    valid: boolean;
    /** Package name */
    packageName: string;
    /** Expected checksum (if available) */
    expectedChecksum?: string;
    /** Actual checksum */
    actualChecksum?: string;
    /** Reason if invalid */
    reason?: string;
}
/**
 * Calculates SHA-256 checksum of a file
 *
 * @param filePath - File path to checksum
 * @returns Promise<string> - Hex string of the checksum
 */
export declare function calculateChecksum(filePath: string): Promise<string>;
/**
 * Verifies the integrity of a package-lock.json file
 *
 * @param lockFilePath - Path to package-lock.json
 * @returns Promise<DependencyIntegrityResult[]> - Array of integrity check results
 */
export declare function verifyPackageLockIntegrity(lockFilePath: string): Promise<DependencyIntegrityResult[]>;
/**
 * Verifies the integrity of a single dependency
 *
 * @param packageName - Name of the package
 * @param packagePath - Path to the package directory
 * @param expectedChecksum - Expected checksum (optional)
 * @returns Promise<DependencyIntegrityResult> - Integrity check result
 */
export declare function verifyDependencyIntegrity(packageName: string, packagePath: string, expectedChecksum?: string): Promise<DependencyIntegrityResult>;
/**
 * Checks for known vulnerable dependencies
 *
 * @param packageJsonPath - Path to package.json
 * @returns Promise<DependencyIntegrityResult[]> - Array of vulnerability check results
 */
export declare function checkVulnerabilities(packageJsonPath: string): Promise<DependencyIntegrityResult[]>;
export {};
//# sourceMappingURL=security-utils.d.ts.map