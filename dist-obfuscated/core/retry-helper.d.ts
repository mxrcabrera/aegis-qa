/**
 * Retry Helper - Exponential Backoff for Transient Operations
 *
 * Purpose: Provides retry logic with exponential backoff for operations
 * that may fail transiently (git, tsc, ollama, network operations).
 *
 * @module core/retry-helper
 * @since 2.0.0
 */
/**
 * Retry options
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxRetries?: number;
    /** Initial backoff delay in milliseconds (default: 1000) */
    initialBackoffMs?: number;
    /** Maximum backoff delay in milliseconds (default: 10000) */
    maxBackoffMs?: number;
    /** Backoff multiplier (default: 2) */
    backoffMultiplier?: number;
    /** Whether to jitter the backoff (default: true) */
    jitter?: boolean;
    /** Total time limit for all retries in milliseconds (default: 30000 = 30s) */
    totalRetryTimeLimitMs?: number;
    /** Enable circuit breaker pattern (default: true) */
    enableCircuitBreaker?: boolean;
    /** Circuit breaker threshold - consecutive failures before opening (default: 5) */
    circuitBreakerThreshold?: number;
    /** Circuit breaker timeout - time to wait before trying again (default: 60000 = 60s) */
    circuitBreakerTimeoutMs?: number;
}
/**
 * Retry result
 */
export interface RetryResult<T> {
    /** Whether the operation succeeded */
    success: boolean;
    /** Result if successful */
    result?: T;
    /** Error if failed */
    error?: Error;
    /** Number of attempts made */
    attempts: number;
}
/**
 * Retry helper with exponential backoff
 *
 * @class RetryHelper
 */
export declare class RetryHelper {
    private defaultOptions;
    private circuitBreakerState;
    /**
     * Executes an operation with retry logic
     *
     * @param operation - Async operation to execute
     * @param options - Retry options
     * @param operationKey - Unique key for circuit breaker (optional)
     * @returns Promise<RetryResult<T>> - Retry result
     */
    executeWithRetry<T>(operation: () => Promise<T>, options?: RetryOptions, operationKey?: string): Promise<RetryResult<T>>;
    /**
     * Calculates backoff delay with exponential backoff and optional jitter
     *
     * @private
     * @param attempt - Current attempt number (0-indexed)
     * @param options - Retry options
     * @returns number - Backoff delay in milliseconds
     */
    private calculateBackoff;
    /**
     * Sleep helper
     *
     * @private
     * @param ms - Milliseconds to sleep
     * @returns Promise<void>
     */
    private sleep;
    /**
     * Static helper for quick retry execution
     *
     * @static
     * @param operation - Async operation to execute
     * @param options - Retry options
     * @returns Promise<RetryResult<T>> - Retry result
     */
    static retry<T>(operation: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
}
//# sourceMappingURL=retry-helper.d.ts.map