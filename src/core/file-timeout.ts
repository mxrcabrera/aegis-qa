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

import * as crypto from 'crypto';

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
 * Default timeout configuration (60 seconds)
 */
const DEFAULT_TIMEOUT_MS = 60000;

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
export async function runWithFileTimeout<T>(
  fn: () => Promise<T>,
  filePath: string,
  config: FileTimeoutConfig = { timeoutMs: DEFAULT_TIMEOUT_MS }
): Promise<FileTimeoutResult<T>> {
  const { timeoutMs } = config;

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`File analysis timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    // Race between the analysis function and the timeout
    const result = await Promise.race([fn(), timeoutPromise]);
    return {
      success: true,
      result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('timeout');

    if (isTimeout) {
      console.warn(`[FileTimeout] File ${filePath} timed out after ${timeoutMs}ms. Skipping.`);
    } else {
      console.warn(`[FileTimeout] File ${filePath} failed: ${errorMessage}. Skipping.`);
    }

    return {
      success: false,
      error: errorMessage,
      isTimeout,
    };
  }
}

/**
 * Generates a deterministic hash for violation IDs based on file path and timeout
 *
 * @param filePath - The file path
 * @param timeoutMs - The timeout duration
 * @returns string - Deterministic hash
 */
function generateDeterministicId(filePath: string, timeoutMs: number): string {
  const hashInput = `${filePath}:${timeoutMs}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
}

/**
 * Creates a timeout violation for the report
 *
 * @param filePath - Path of the file that timed out
 * @param timeoutMs - Timeout that was exceeded
 * @returns Violation object for timeout
 */
export function createTimeoutViolation(filePath: string, timeoutMs: number) {
  return {
    id: `TIMEOUT-${generateDeterministicId(filePath, timeoutMs)}`,
    type: 'timeout' as const,
    severity: 'warning' as const,
    file: {
      path: filePath,
      extension: filePath.split('.').pop() || 'unknown',
      lineCount: 0,
      inCriticalPath: false,
    },
    location: { line: 0 },
    message: `File analysis timed out after ${timeoutMs}ms. File may be too large or complex to analyze.`,
    rule: 'file-timeout',
    autoFixable: false,
    confidence: 1.0,
  };
}
