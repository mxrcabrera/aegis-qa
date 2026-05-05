/**
 * I/O Rate Limiter - Prevents Excessive I/O Operations
 *
 * Purpose: Limits the rate of I/O operations to prevent system overload
 * and ensure stable performance during file operations.
 *
 * @module core/io-rate-limiter
 * @since 2.0.0
 */
/**
 * Rate limiter configuration
 */
export interface IORateLimiterConfig {
    /** Maximum operations per second (default: 100) */
    maxOpsPerSecond?: number;
    /** Maximum concurrent operations (default: 10) */
    maxConcurrentOps?: number;
    /** Whether to enable rate limiting (default: true) */
    enabled?: boolean;
}
/**
 * Rate limiter result
 */
export interface RateLimiterResult {
    /** Whether operation was allowed */
    allowed: boolean;
    /** Time to wait before next operation (ms) */
    waitTime?: number;
    /** Reason for denial */
    reason?: string;
}
/**
 * I/O Rate Limiter
 *
 * @class IORateLimiter
 */
export declare class IORateLimiter {
    private config;
    private operationTimestamps;
    private activeOperations;
    private operationQueue;
    constructor(config?: IORateLimiterConfig);
    /**
     * Acquires permission to perform an I/O operation
     *
     * @returns RateLimiterResult - Result of rate limit check
     */
    acquire(): RateLimiterResult;
    /**
     * Releases a completed I/O operation
     */
    release(): void;
    /**
     * Executes an I/O operation with rate limiting
     *
     * @param operation - I/O operation to execute
     * @returns Promise<T> - Result of the operation
     */
    execute<T>(operation: () => Promise<T>): Promise<T>;
    /**
     * Gets current rate limiter statistics
     *
     * @returns Object with current statistics
     */
    getStats(): {
        opsPerSecond: number;
        activeOperations: number;
        queueLength: number;
    };
    /**
     * Resets the rate limiter state
     */
    reset(): void;
    /**
     * Updates the rate limiter configuration
     *
     * @param config - New configuration
     */
    updateConfig(config: Partial<IORateLimiterConfig>): void;
}
/**
 * Global I/O rate limiter instance
 */
export declare const globalIORateLimiter: IORateLimiter;
//# sourceMappingURL=io-rate-limiter.d.ts.map