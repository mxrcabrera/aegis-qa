/**
 * FileTimeout - Per-file timeout wrapper for analysis functions
 *
 * Purpose: Prevent hangs on large or problematic files by enforcing
 * a timeout on individual file analysis operations. If a file takes
 * longer than the configured timeout, it is aborted and a timeout
 * violation is added to the report.
 *
 * @module core/file-timeout
 * @since 2.0.0
 */
/**
 * Result of a file analysis with timeout
 */
export interface FileTimeoutResult<T> {
    /** Whether the analysis completed successfully */
    success: boolean;
    /** The result of the analysis (if successful) */
    result?: T;
    /** Error if timeout or other failure occurred */
    error?: string;
    /** Whether the failure was due to timeout */
    isTimeout?: boolean;
}
/**
 * Configuration for file timeout
 */
export interface FileTimeoutConfig {
    /** Timeout in milliseconds for individual file analysis */
    timeoutMs: number;
}
/**
 * Runs a file analysis function with a timeout
 *
 * If the function does not complete within the timeout, it is aborted
 * and a timeout result is returned. The process is not killed, only the
 * individual file analysis is skipped.
 *
 * @template T - Return type of the analysis function
 * @param fn - The analysis function to execute
 * @param filePath - Path of the file being analyzed (for logging)
 * @param config - Timeout configuration
 * @returns Promise<FileTimeoutResult<T>> - Result of the analysis
 *
 * @example
 * ```typescript
 * const result = await runWithFileTimeout(
 *   async () => analyzeFile(filePath),
 *   filePath,
 *   { timeoutMs: 60000 }
 * );
 *
 * if (result.isTimeout) {
 *   console.warn(`File ${filePath} timed out`);
 * }
 * ```
 */
export declare function runWithFileTimeout<T>(fn: () => Promise<T>, filePath: string, config?: FileTimeoutConfig): Promise<FileTimeoutResult<T>>;
/**
 * Creates a timeout violation for the report
 *
 * @param filePath - Path of the file that timed out
 * @param timeoutMs - Timeout that was exceeded
 * @returns Violation object for timeout
 */
export declare function createTimeoutViolation(filePath: string, timeoutMs: number): {
    id: string;
    type: "timeout";
    severity: "warning";
    file: {
        path: string;
        extension: string;
        lineCount: number;
        inCriticalPath: boolean;
    };
    location: {
        line: number;
    };
    message: string;
    rule: string;
    autoFixable: boolean;
    confidence: number;
};
//# sourceMappingURL=file-timeout.d.ts.map