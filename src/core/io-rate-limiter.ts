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
export class IORateLimiter {
  private config: Required<IORateLimiterConfig>;
  private operationTimestamps: number[] = [];
  private activeOperations: number = 0;
  private operationQueue: Array<() => void> = [];

  constructor(config: IORateLimiterConfig = {}) {
    this.config = {
      maxOpsPerSecond: config.maxOpsPerSecond || 100,
      maxConcurrentOps: config.maxConcurrentOps || 10,
      enabled: config.enabled ?? true,
    };
  }

  /**
   * Acquires permission to perform an I/O operation
   *
   * @returns RateLimiterResult - Result of rate limit check
   */
  acquire(): RateLimiterResult {
    if (!this.config.enabled) {
      return { allowed: true };
    }

    const now = Date.now();

    // Clean up old timestamps (older than 1 second)
    this.operationTimestamps = this.operationTimestamps.filter(
      timestamp => now - timestamp < 1000
    );

    // Check operation rate
    if (this.operationTimestamps.length >= this.config.maxOpsPerSecond) {
      const oldestTimestamp = this.operationTimestamps[0];
      const waitTime = 1000 - (now - oldestTimestamp);
      return {
        allowed: false,
        waitTime,
        reason: `Rate limit exceeded: ${this.operationTimestamps.length} ops/sec (max: ${this.config.maxOpsPerSecond})`,
      };
    }

    // Check concurrent operations
    if (this.activeOperations >= this.config.maxConcurrentOps) {
      return {
        allowed: false,
        reason: `Concurrent operation limit exceeded: ${this.activeOperations} active (max: ${this.config.maxConcurrentOps})`,
      };
    }

    // Allow operation
    this.operationTimestamps.push(now);
    this.activeOperations++;
    return { allowed: true };
  }

  /**
   * Releases a completed I/O operation
   */
  release(): void {
    if (this.activeOperations > 0) {
      this.activeOperations--;
    }
  }

  /**
   * Executes an I/O operation with rate limiting
   *
   * @param operation - I/O operation to execute
   * @returns Promise<T> - Result of the operation
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.acquire();

    if (!result.allowed) {
      if (result.waitTime) {
        console.warn(`[IORateLimiter] Rate limited, waiting ${result.waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, result.waitTime));
        return this.execute(operation); // Retry after waiting
      } else {
        throw new Error(`[IORateLimiter] ${result.reason}`);
      }
    }

    try {
      return await operation();
    } finally {
      this.release();
    }
  }

  /**
   * Gets current rate limiter statistics
   *
   * @returns Object with current statistics
   */
  getStats(): {
    opsPerSecond: number;
    activeOperations: number;
    queueLength: number;
  } {
    const now = Date.now();
    const opsInLastSecond = this.operationTimestamps.filter(
      timestamp => now - timestamp < 1000
    ).length;

    return {
      opsPerSecond: opsInLastSecond,
      activeOperations: this.activeOperations,
      queueLength: this.operationQueue.length,
    };
  }

  /**
   * Resets the rate limiter state
   */
  reset(): void {
    this.operationTimestamps = [];
    this.activeOperations = 0;
    this.operationQueue = [];
  }

  /**
   * Updates the rate limiter configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: Partial<IORateLimiterConfig>): void {
    if (config.maxOpsPerSecond !== undefined) {
      this.config.maxOpsPerSecond = config.maxOpsPerSecond;
    }
    if (config.maxConcurrentOps !== undefined) {
      this.config.maxConcurrentOps = config.maxConcurrentOps;
    }
    if (config.enabled !== undefined) {
      this.config.enabled = config.enabled;
    }
  }
}

/**
 * Global I/O rate limiter instance
 */
export const globalIORateLimiter = new IORateLimiter();
