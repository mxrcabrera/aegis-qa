/**
 * Security Utilities - Common Hardening Functions
 *
 * Purpose: Provide common security hardening functions for all phases
 * including path validation, error sanitization, and resource limits.
 *
 * @module core/security-utils
 * @since 1.0.0
 */

import * as path from 'path';

/**
 * Validates a file path to prevent path traversal attacks
 *
 * @param filePath - File path to validate
 * @param projectRoot - Project root directory
 * @returns boolean - True if path is valid and safe
 */
export function validatePath(filePath: string, projectRoot: string): boolean {
  try {
    // Resolve the absolute path
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(projectRoot);

    // Check if the resolved path is within the project root
    const relativePath = path.relative(resolvedRoot, resolvedPath);

    // If relative path starts with .., it's outside the project root
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return false;
    }

    // Check for null bytes
    if (filePath.includes('\0')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitizes error messages to prevent information leakage
 *
 * @param error - Error object or message
 * @returns string - Sanitized error message
 */
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Remove sensitive information from error message
    let message = error.message;
    
    // Remove file paths
    message = message.replace(/\/[^\s]+/g, '[REDACTED_PATH]');
    message = message.replace(/\\[^\s]+/g, '[REDACTED_PATH]');
    
    // Remove potential secrets (API keys, tokens)
    message = message.replace(/api[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi, '[REDACTED_SECRET]');
    message = message.replace(/secret["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi, '[REDACTED_SECRET]');
    message = message.replace(/token["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi, '[REDACTED_SECRET]');
    
    // Remove long alphanumeric strings (potential secrets)
    message = message.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED_STRING]');
    
    return message;
  }

  if (typeof error === 'string') {
    return error.replace(/\/[^\s]+/g, '[REDACTED_PATH]')
                 .replace(/\\[^\s]+/g, '[REDACTED_PATH]');
  }

  return 'An error occurred';
}

/**
 * Checks if a file size is within safe limits
 *
 * @param fileSize - File size in bytes
 * @param maxSizeMB - Maximum file size in megabytes (default: 100MB)
 * @returns boolean - True if file size is within limits
 */
export function validateFileSize(fileSize: number, maxSizeMB: number = 100): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * Checks if a string contains potential secrets
 *
 * @param str - String to check
 * @returns boolean - True if string might contain secrets
 */
export function containsSecret(str: string): boolean {
  // Patterns for common secrets
  const secretPatterns = [
    /api[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
    /secret["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
    /password["']?\s*[:=]\s*["'][a-zA-Z0-9]{8,}["']/gi,
    /token["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
    /bearer\s+[a-zA-Z0-9]{20,}/gi,
    /[a-zA-Z0-9]{32,}/g, // Long alphanumeric strings
  ];

  return secretPatterns.some(pattern => pattern.test(str));
}

/**
 * Censors secrets from a string
 *
 * @param str - String to censor
 * @returns string - Censored string
 */
export function censorSecrets(str: string): string {
  let censored = str;
  
  const secretPatterns = [
    /api[_-]?key["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
    /secret["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
    /password["']?\s*[:=]\s*["'][a-zA-Z0-9]{8,}["']/gi,
    /token["']?\s*[:=]\s*["'][a-zA-Z0-9]{20,}["']/gi,
    /bearer\s+[a-zA-Z0-9]{20,}/gi,
    /[a-zA-Z0-9]{32,}/g,
  ];

  for (const pattern of secretPatterns) {
    censored = censored.replace(pattern, '***CENSORED***');
  }

  return censored;
}

/**
 * Validates a timeout value
 *
 * @param timeoutMs - Timeout in milliseconds
 * @param maxTimeoutMs - Maximum timeout in milliseconds (default: 5 minutes)
 * @returns boolean - True if timeout is valid
 */
export function validateTimeout(timeoutMs: number, maxTimeoutMs: number = 300000): boolean {
  return timeoutMs > 0 && timeoutMs <= maxTimeoutMs;
}

/**
 * Creates a timeout promise
 *
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects after timeout
 */
export function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
}

/**
 * Safe JSON parse with size limit
 *
 * @param json - JSON string to parse
 * @param maxSizeKB - Maximum size in kilobytes (default: 1MB)
 * @returns Parsed object or null if invalid
 */
export function safeJsonParse(json: string, maxSizeKB: number = 1024): any | null {
  // Check size
  if (json.length > maxSizeKB * 1024) {
    return null;
  }

  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Validates a filename to prevent directory traversal
 *
 * @param filename - Filename to validate
 * @returns boolean - True if filename is valid
 */
export function validateFilename(filename: string): boolean {
  // Check for path traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return false;
  }

  // Check for reserved Windows filenames
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL'];
  if (reservedNames.includes(filename.toUpperCase())) {
    return false;
  }

  // Check for reserved Windows filenames with extensions
  const reservedWithExt = ['COM', 'LPT'];
  for (const prefix of reservedWithExt) {
    for (let i = 1; i <= 9; i++) {
      if (filename.toUpperCase().startsWith(`${prefix}${i}`)) {
        return false;
      }
    }
  }

  return true;
}
