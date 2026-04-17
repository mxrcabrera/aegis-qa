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
export class RetryHelper {
  private defaultOptions: Required<RetryOptions> = {
    maxRetries: 3,
    initialBackoffMs: 1000,
    maxBackoffMs: 10000,
    backoffMultiplier: 2,
    jitter: true,
    totalRetryTimeLimitMs: 30000, // 30 seconds
    enableCircuitBreaker: true,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeoutMs: 60000, // 60 seconds
  };

  private circuitBreakerState: Map<string, { isOpen: boolean; openedAt: number; failureCount: number }> = new Map();

  /**
   * Executes an operation with retry logic
   *
   * @param operation - Async operation to execute
   * @param options - Retry options
   * @param operationKey - Unique key for circuit breaker (optional)
   * @returns Promise<RetryResult<T>> - Retry result
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {},
    operationKey?: string
  ): Promise<RetryResult<T>> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error | undefined;
    let attempts = 0;
    const startTime = Date.now();

    // Check circuit breaker if enabled
    if (opts.enableCircuitBreaker && operationKey) {
      const cbState = this.circuitBreakerState.get(operationKey);
      if (cbState && cbState.isOpen) {
        const timeSinceOpen = Date.now() - cbState.openedAt;
        if (timeSinceOpen < opts.circuitBreakerTimeoutMs) {
          console.warn(`[Security] Circuit breaker is OPEN for ${operationKey}. Skipping retry.`);
          return {
            success: false,
            error: new Error(`[Security] Circuit breaker is OPEN for ${operationKey}`),
            attempts: 0,
          };
        } else {
          // Reset circuit breaker after timeout
          console.log(`[Security] Circuit breaker timeout expired for ${operationKey}. Resetting.`);
          this.circuitBreakerState.set(operationKey, { isOpen: false, openedAt: 0, failureCount: 0 });
        }
      }
    }

    for (let i = 0; i <= opts.maxRetries; i++) {
      attempts++;

      // Check total retry time limit
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime > opts.totalRetryTimeLimitMs) {
        console.warn(`[Security] Total retry time limit (${opts.totalRetryTimeLimitMs}ms) exceeded. Stopping retries.`);
        return {
          success: false,
          error: new Error(`[Security] Total retry time limit exceeded after ${elapsedTime}ms`),
          attempts,
        };
      }

      try {
        const result = await operation();

        // Reset circuit breaker on success
        if (opts.enableCircuitBreaker && operationKey) {
          this.circuitBreakerState.set(operationKey, { isOpen: false, openedAt: 0, failureCount: 0 });
        }

        return {
          success: true,
          result,
          attempts,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Update circuit breaker state
        if (opts.enableCircuitBreaker && operationKey) {
          const cbState = this.circuitBreakerState.get(operationKey) || { isOpen: false, openedAt: 0, failureCount: 0 };
          cbState.failureCount++;

          if (cbState.failureCount >= opts.circuitBreakerThreshold) {
            cbState.isOpen = true;
            cbState.openedAt = Date.now();
            console.warn(`[Security] Circuit breaker OPENED for ${operationKey} after ${cbState.failureCount} consecutive failures.`);
          }

          this.circuitBreakerState.set(operationKey, cbState);
        }

        // Don't retry on the last attempt
        if (i === opts.maxRetries) {
          break;
        }

        // Calculate backoff delay
        const backoffDelay = this.calculateBackoff(i, opts);

        console.warn(
          `[RetryHelper] Attempt ${i + 1}/${opts.maxRetries + 1} failed: ${lastError.message}`
        );
        console.warn(`[RetryHelper] Retrying in ${backoffDelay}ms...`);

        // Wait before retrying
        await this.sleep(backoffDelay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
    };
  }

  /**
   * Calculates backoff delay with exponential backoff and optional jitter
   *
   * @private
   * @param attempt - Current attempt number (0-indexed)
   * @param options - Retry options
   * @returns number - Backoff delay in milliseconds
   */
  private calculateBackoff(attempt: number, options: Required<RetryOptions>): number {
    const exponentialDelay = options.initialBackoffMs * Math.pow(options.backoffMultiplier, attempt);
    const cappedDelay = Math.min(exponentialDelay, options.maxBackoffMs);

    if (options.jitter) {
      // Add random jitter (±25%)
      const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
      return Math.max(0, Math.floor(cappedDelay + jitter));
    }

    return cappedDelay;
  }

  /**
   * Sleep helper
   *
   * @private
   * @param ms - Milliseconds to sleep
   * @returns Promise<void>
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Static helper for quick retry execution
   *
   * @static
   * @param operation - Async operation to execute
   * @param options - Retry options
   * @returns Promise<RetryResult<T>> - Retry result
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const helper = new RetryHelper();
    return helper.executeWithRetry(operation, options);
  }
}
