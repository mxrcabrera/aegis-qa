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
    // Check for null bytes
    if (filePath.includes('\0')) {
      return false;
    }

    // Check for path traversal attempts
    if (filePath.includes('..') || filePath.includes('~')) {
      return false;
    }

    // Resolve the absolute path
    const resolvedPath = path.resolve(filePath);
    const resolvedRoot = path.resolve(projectRoot);

    // Check if the resolved path is within the project root
    const relativePath = path.relative(resolvedRoot, resolvedPath);

    // If relative path starts with .., it's outside the project root
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return false;
    }

    // Check for symbolic links (prevent symlink attacks)
    // Note: This is a basic check, actual symlink validation requires fs.lstat
    if (filePath.includes('node_modules') || filePath.includes('.git')) {
      // Allow these directories but only if they're at the root level
      const parts = relativePath.split(path.sep);
      if (parts.length > 2 && parts.includes('node_modules')) {
        return false;
      }
    }

    // Check for extremely long paths (DoS prevention)
    if (resolvedPath.length > 4096) {
      return false;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /%2e%2e/i,  // URL-encoded ..
      /%5c/i,      // URL-encoded backslash
      /%2f/i,      // URL-encoded forward slash
      /\.\.[/\\]/, // Path traversal
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(filePath))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Strictly validates a file path with enhanced security checks
 *
 * @param filePath - File path to validate
 * @param projectRoot - Project root directory
 * @param options - Additional validation options
 * @returns object - Validation result with reason if invalid
 */
export async function validatePathStrict(
  filePath: string,
  projectRoot: string,
  options?: {
    allowedExtensions?: string[];
    blockedPaths?: string[];
    maxSizeBytes?: number;
  }
): Promise<{ valid: boolean; reason?: string }> {
  try {
    // Basic path validation
    if (!validatePath(filePath, projectRoot)) {
      return { valid: false, reason: 'Path traversal or invalid path detected' };
    }

    // Check file extension if allowedExtensions is specified
    if (options?.allowedExtensions) {
      const ext = path.extname(filePath).toLowerCase();
      if (!options.allowedExtensions.includes(ext)) {
        return { valid: false, reason: `File extension ${ext} not allowed` };
      }
    }

    // Check blocked paths
    if (options?.blockedPaths) {
      const resolvedPath = path.resolve(filePath);
      for (const blocked of options.blockedPaths) {
        const resolvedBlocked = path.resolve(path.join(projectRoot, blocked));
        if (resolvedPath.startsWith(resolvedBlocked)) {
          return { valid: false, reason: `Path is in blocked directory: ${blocked}` };
        }
      }
    }

    // Check file size if maxSizeBytes is specified
    if (options?.maxSizeBytes) {
      const fs = await import('fs');
      try {
        const stats = fs.statSync(filePath);
        if (!validateFileSize(stats.size, options.maxSizeBytes / 1024 / 1024)) {
          return { valid: false, reason: 'File size exceeds maximum limit' };
        }
      } catch {
        // File might not exist yet, skip size check
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, reason: 'Validation error occurred' };
  }
}

/**
 * Sanitizes error messages to prevent information leakage
 *
 * @param error - Error object or message
 * @param _options - Sanitization options (reserved for future use)
 * @returns string - Sanitized error message
 */
export function sanitizeError(error: unknown, _options?: {
  verbose?: boolean;
  includeStack?: boolean;
}): string {
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

    // Remove IP addresses
    message = message.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[REDACTED_IP]');

    // Remove port numbers
    message = message.replace(/:\d{1,5}/g, ':[PORT]');

    // Remove usernames from paths
    message = message.replace(/\/home\/[^/]+/g, '/home/[USER]');
    message = message.replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\[USER]');

    return message;
  }

  if (typeof error === 'string') {
    let sanitized = error.replace(/\/[^\s]+/g, '[REDACTED_PATH]')
                        .replace(/\\[^\s]+/g, '[REDACTED_PATH]');

    // Remove IP addresses
    sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[REDACTED_IP]');

    return sanitized;
  }

  return 'An error occurred';
}

/**
 * Creates a generic error message for user-facing errors
 *
 * @param _error - Error object or message (reserved for future use)
 * @param context - Context about where the error occurred
 * @returns string - Generic error message
 */
export function createGenericError(_error: unknown, context?: string): string {
  // Return a generic message without sensitive details
  if (context) {
    return `An error occurred during ${context}. Please check the logs for more details.`;
  }

  return 'An error occurred during operation. Please check the logs for more details.';
}

/**
 * Safe error handler that logs details but returns generic message to user
 *
 * @param error - Error object or message
 * @param context - Context about where the error occurred
 * @returns object - Generic message for user and detailed error for logging
 */
export function handleSecureError(error: unknown, context?: string): {
  userMessage: string;
  logMessage: string;
  originalError?: Error;
} {
  const userMessage = createGenericError(error, context);
  const logMessage = sanitizeError(error, { verbose: true });

  return {
    userMessage,
    logMessage,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Sanitizes output for reports to prevent code injection
 *
 * @param content - Content to sanitize
 * @param options - Sanitization options
 * @returns string - Sanitized content
 */
export function sanitizeOutput(
  content: string,
  options?: {
    allowHTML?: boolean;
    allowMarkdown?: boolean;
    escapeSpecialChars?: boolean;
  }
): string {
  let sanitized = content;

  // Default to escaping special characters
  const escapeSpecial = options?.escapeSpecialChars !== false;

  if (escapeSpecial) {
    // Escape common injection vectors
    const escapeMap: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;',
      '$': '&#36;',
      '(': '&#40;',
      ')': '&#41;',
    };

    sanitized = sanitized.replace(/[&<>"'`$()]/g, (char) => escapeMap[char] || char);
  }

  // Remove potential script tags and event handlers
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gis, '[SCRIPT_REMOVED]');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '[EVENT_HANDLER_REMOVED]');
  sanitized = sanitized.replace(/javascript:/gi, '[JAVASCRIPT_PROTOCOL_REMOVED]');

  // Remove data URLs that could be used for injection
  sanitized = sanitized.replace(/data:[^;]+;base64,[a-zA-Z0-9+/=]+/gi, '[DATA_URL_REMOVED]');

  // Remove potential shell commands
  const shellPatterns = [
    /\$\(.*\)/g, // Command substitution
    /`[^`]*`/g, // Backtick commands
    /\$\{[^}]*\}/g, // Variable expansion
  ];
  for (const pattern of shellPatterns) {
    sanitized = sanitized.replace(pattern, '[COMMAND_REMOVED]');
  }

  // Remove potential SQL injection patterns
  const sqlPatterns = [
    /['"]\s*(?:OR|AND)\s*['"]?\s*\d+\s*=\s*\d+/gi,
    /['"]\s*(?:OR|AND)\s*['"]?\s*\w+\s*=\s*['"]?\w+/gi,
    /UNION\s+ALL\s+SELECT/gi,
    /--[^;]*/g, // SQL single-line comments
    /\/\*[\s\S]*?\*\//g, // SQL block comments
  ];
  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, '[SQL_PATTERN_REMOVED]');
  }

  return sanitized;
}

/**
 * Sanitizes markdown content for safe rendering
 *
 * @param markdown - Markdown content to sanitize
 * @returns string - Sanitized markdown
 */
export function sanitizeMarkdown(markdown: string): string {
  let sanitized = markdown;

  // Remove HTML tags (except basic formatting)
  sanitized = sanitized.replace(/<(?!\/?(?:b|i|em|strong|code|pre|p|br|h[1-6]|ul|ol|li|blockquote)\b)[^>]+>/gi, '');

  // Remove dangerous protocols in links
  sanitized = sanitized.replace(/\[([^\]]+)\]\((javascript:|data:|vbscript:)/gi, '[$1]([PROTOCOL_BLOCKED]');

  // Remove image sources from untrusted protocols
  sanitized = sanitized.replace(/!\[([^\]]*)\]\((javascript:|data:|vbscript:)/gi, '![$1]([PROTOCOL_BLOCKED]');

  // Remove raw HTML in code blocks (keep the code, remove HTML tags)
  sanitized = sanitized.replace(/```html\s*([\s\S]*?)```/gi, (_match, code) => {
    const strippedCode = code.replace(/<[^>]+>/g, '');
    return `\`\`\`html\n${strippedCode}\n\`\`\``;
  });

  return sanitized;
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
 * Operation type for granular timeouts
 */
export type OperationType =
  | 'fileRead'
  | 'fileWrite'
  | 'fileDelete'
  | 'fileSearch'
  | 'networkRequest'
  | 'phaseExecution'
  | 'aiProcessing'
  | 'syntaxValidation'
  | 'gitOperation'
  | 'custom';

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
export const DefaultTimeoutConfig: TimeoutConfig = {
  defaultTimeoutMs: 30000, // 30 seconds
  maxTimeoutMs: 300000, // 5 minutes
  operationTimeouts: {
    fileRead: 5000, // 5 seconds
    fileWrite: 10000, // 10 seconds
    fileDelete: 3000, // 3 seconds
    fileSearch: 15000, // 15 seconds
    networkRequest: 30000, // 30 seconds
    phaseExecution: 300000, // 5 minutes
    aiProcessing: 120000, // 2 minutes
    syntaxValidation: 5000, // 5 seconds
    gitOperation: 60000, // 1 minute
    custom: 30000, // 30 seconds
  },
};

/**
 * Timeout manager for granular operation timeouts
 */
export class TimeoutManager {
  private config: TimeoutConfig;
  private activeTimeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<TimeoutConfig> = {}) {
    this.config = {
      ...DefaultTimeoutConfig,
      ...config,
      operationTimeouts: {
        ...DefaultTimeoutConfig.operationTimeouts,
        ...config.operationTimeouts,
      },
    };
  }

  /**
   * Gets timeout for a specific operation type
   */
  getTimeout(operationType: OperationType): number {
    return this.config.operationTimeouts[operationType] || this.config.defaultTimeoutMs;
  }

  /**
   * Sets timeout for a specific operation type
   */
  setTimeout(operationType: OperationType, timeoutMs: number): void {
    if (!validateTimeout(timeoutMs, this.config.maxTimeoutMs)) {
      throw new Error(`Invalid timeout: ${timeoutMs}ms exceeds maximum of ${this.config.maxTimeoutMs}ms`);
    }
    this.config.operationTimeouts[operationType] = timeoutMs;
  }

  /**
   * Wraps an operation with a timeout
   */
  async withTimeout<T>(
    operation: Promise<T>,
    operationType: OperationType,
    operationId?: string
  ): Promise<T> {
    const timeoutMs = this.getTimeout(operationType);
    const id = operationId || `${operationType}-${Date.now()}`;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        this.activeTimeouts.delete(id);
        reject(new Error(`Operation ${operationType} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.activeTimeouts.set(id, timeoutId);
    });

    // Race between operation and timeout
    try {
      const result = await Promise.race([operation, timeoutPromise]);
      this.clearTimeout(id);
      return result;
    } catch (error) {
      this.clearTimeout(id);
      throw error;
    }
  }

  /**
   * Clears a specific timeout
   */
  clearTimeout(id: string): void {
    const timeoutId = this.activeTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeTimeouts.delete(id);
    }
  }

  /**
   * Clears all active timeouts
   */
  clearTimeouts(): void {
    for (const timeoutId of this.activeTimeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.activeTimeouts.clear();
  }

  /**
   * Gets the number of active timeouts
   */
  getActiveTimeoutCount(): number {
    return this.activeTimeouts.size;
  }

  /**
   * Updates the configuration
   */
  updateConfig(config: Partial<TimeoutConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      operationTimeouts: {
        ...this.config.operationTimeouts,
        ...config.operationTimeouts,
      },
    };
  }
}

/**
 * Creates a timeout manager instance
 */
export function createTimeoutManager(config?: Partial<TimeoutConfig>): TimeoutManager {
  return new TimeoutManager(config);
}

/**
 * Global timeout manager instance
 */
export const globalTimeoutManager = createTimeoutManager();

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
export const DefaultFileIOSandboxConfig: FileIOSandboxConfig = {
  maxFileSizeBytes: 100 * 1024 * 1024, // 100MB
  allowedExtensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.txt', '.html', '.css'],
  blockedPatterns: ['.git', 'node_modules', '.env', '.secret', 'key'],
  enablePathValidation: true,
};

/**
 * File I/O sandbox for safe file operations
 */
export class FileIOSandbox {
  private config: FileIOSandboxConfig;

  constructor(config: Partial<FileIOSandboxConfig> = {}) {
    this.config = {
      ...DefaultFileIOSandboxConfig,
      ...config,
    };
  }

  /**
   * Validates a file operation before execution
   */
  async validateFileOperation(
    filePath: string,
    operation: 'read' | 'write' | 'delete'
  ): Promise<FileIOSandboxResult> {
    // Check path validation if enabled
    if (this.config.enablePathValidation && this.config.projectRoot) {
      if (!validatePath(filePath, this.config.projectRoot)) {
        return {
          allowed: false,
          reason: 'Path validation failed: path traversal or outside project root',
        };
      }
    }

    // Check blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (filePath.includes(pattern)) {
        return {
          allowed: false,
          reason: `File path contains blocked pattern: ${pattern}`,
        };
      }
    }

    // Check file extension for write operations
    if (operation === 'write' || operation === 'delete') {
      const ext = path.extname(filePath).toLowerCase();
      if (this.config.allowedExtensions.length > 0 && !this.config.allowedExtensions.includes(ext)) {
        return {
          allowed: false,
          reason: `File extension ${ext} not allowed for ${operation} operations`,
        };
      }
    }

    // Check file size for read operations
    if (operation === 'read') {
      try {
        const fs = await import('fs');
        const stats = await fs.promises.stat(filePath);
        if (!validateFileSize(stats.size, this.config.maxFileSizeBytes / 1024 / 1024)) {
          return {
            allowed: false,
            reason: `File size exceeds maximum limit of ${this.config.maxFileSizeBytes} bytes`,
          };
        }
      } catch {
        // File might not exist yet, skip size check
      }
    }

    return {
      allowed: true,
      sanitizedPath: filePath,
    };
  }

  /**
   * Safely reads a file with sandboxing
   */
  async safeReadFile(filePath: string): Promise<string | null> {
    const validation = await this.validateFileOperation(filePath, 'read');
    if (!validation.allowed) {
      throw new Error(`File read denied: ${validation.reason}`);
    }

    try {
      const fs = await import('fs');
      const content = await fs.promises.readFile(filePath, 'utf-8');
      
      // Check file size
      if (content.length > this.config.maxFileSizeBytes) {
        throw new Error('File content exceeds maximum size limit');
      }

      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Safely writes a file with sandboxing
   */
  async safeWriteFile(filePath: string, content: string): Promise<void> {
    const validation = await this.validateFileOperation(filePath, 'write');
    if (!validation.allowed) {
      throw new Error(`File write denied: ${validation.reason}`);
    }

    // Check content size
    if (content.length > this.config.maxFileSizeBytes) {
      throw new Error('Content exceeds maximum file size limit');
    }

    try {
      const fs = await import('fs');
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.promises.mkdir(dir, { recursive: true });
      
      await fs.promises.writeFile(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Safely deletes a file with sandboxing
   */
  async safeDeleteFile(filePath: string): Promise<void> {
    const validation = await this.validateFileOperation(filePath, 'delete');
    if (!validation.allowed) {
      throw new Error(`File delete denied: ${validation.reason}`);
    }

    try {
      const fs = await import('fs');
      await fs.promises.unlink(filePath);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Updates the sandbox configuration
   */
  updateConfig(config: Partial<FileIOSandboxConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Gets the current configuration
   */
  getConfig(): FileIOSandboxConfig {
    return { ...this.config };
  }
}

/**
 * Creates a file I/O sandbox instance
 */
export function createFileIOSandbox(config?: Partial<FileIOSandboxConfig>): FileIOSandbox {
  return new FileIOSandbox(config);
}

/**
 * Global file I/O sandbox instance
 */
export const globalFileIOSandbox = createFileIOSandbox();

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
export async function checkReadPermission(filePath: string): Promise<PermissionCheckResult> {
  try {
    const fs = await import('fs');
    await fs.promises.access(filePath, fs.constants.R_OK);
    return { allowed: true, permission: 'read' };
  } catch {
    return {
      allowed: false,
      reason: 'Read permission denied or file does not exist',
      permission: 'read',
    };
  }
}

/**
 * Checks if the current process has write permission for a file
 *
 * @param filePath - File path to check
 * @returns Promise<PermissionCheckResult> - Permission check result
 */
export async function checkWritePermission(filePath: string): Promise<PermissionCheckResult> {
  try {
    const fs = await import('fs');
    await fs.promises.access(filePath, fs.constants.W_OK);
    return { allowed: true, permission: 'write' };
  } catch {
    return {
      allowed: false,
      reason: 'Write permission denied or file does not exist',
      permission: 'write',
    };
  }
}

/**
 * Checks if the current process has execute permission for a file
 *
 * @param filePath - File path to check
 * @returns Promise<PermissionCheckResult> - Permission check result
 */
export async function checkExecutePermission(filePath: string): Promise<PermissionCheckResult> {
  try {
    const fs = await import('fs');
    await fs.promises.access(filePath, fs.constants.X_OK);
    return { allowed: true, permission: 'execute' };
  } catch {
    return {
      allowed: false,
      reason: 'Execute permission denied or file does not exist',
      permission: 'execute',
    };
  }
}

/**
 * Verifies permissions before a critical operation
 *
 * @param operation - Type of operation to perform
 * @param filePath - File path to check permissions for
 * @returns Promise<void> - Throws error if permissions are insufficient
 * @throws {Error} If permission check fails
 */
export async function verifyPermission(
  operation: 'read' | 'write' | 'execute' | 'delete',
  filePath: string
): Promise<void> {
  let result: PermissionCheckResult;

  switch (operation) {
    case 'read':
      result = await checkReadPermission(filePath);
      break;
    case 'write':
      result = await checkWritePermission(filePath);
      break;
    case 'execute':
      result = await checkExecutePermission(filePath);
      break;
    case 'delete':
      // Delete requires write permission
      result = await checkWritePermission(filePath);
      break;
    default:
      throw new Error(`Unknown operation type: ${operation}`);
  }

  if (!result.allowed) {
    throw new Error(`Permission denied for ${operation} operation on ${filePath}: ${result.reason}`);
  }
}

/**
 * Checks if a file is writable (for new files, checks directory permission)
 *
 * @param filePath - File path to check
 * @returns Promise<PermissionCheckResult> - Permission check result
 */
export async function checkFileWritable(filePath: string): Promise<PermissionCheckResult> {
  try {
    const fs = await import('fs');
    const dirPath = path.dirname(filePath);

    // Check if directory exists and is writable
    await fs.promises.access(dirPath, fs.constants.R_OK | fs.constants.W_OK);

    return { allowed: true, permission: 'write' };
  } catch (error) {
    return {
      allowed: false,
      reason: 'Directory not writable or does not exist',
      permission: 'write',
    };
  }
}

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
class RateLimiter {
  private config: RateLimiterConfig;
  private requests: Map<string, number[]> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    this.startCleanup();
  }

  /**
   * Checks if a request is allowed based on rate limits
   *
   * @param identifier - Unique identifier for the requester (e.g., IP, user ID)
   * @returns boolean - True if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get existing requests for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Remove requests outside the current window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (timestamps.length >= this.config.maxRequests) {
      return false;
    }

    // Add current request
    timestamps.push(now);
    this.requests.set(identifier, timestamps);

    return true;
  }

  /**
   * Gets the number of remaining requests for an identifier
   *
   * @param identifier - Unique identifier for the requester
   * @returns number - Number of remaining requests
   */
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const timestamps = this.requests.get(identifier) || [];
    const recentRequests = timestamps.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.config.maxRequests - recentRequests.length);
  }

  /**
   * Resets the rate limit for a specific identifier
   *
   * @param identifier - Unique identifier for the requester
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Resets all rate limits
   */
  resetAll(): void {
    this.requests.clear();
  }

  /**
   * Starts cleanup interval to remove old entries
   *
   * @private
   */
  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.config.windowMs;

      for (const [identifier, timestamps] of this.requests.entries()) {
        const filtered = timestamps.filter(timestamp => timestamp > windowStart);
        if (filtered.length === 0) {
          this.requests.delete(identifier);
        } else {
          this.requests.set(identifier, filtered);
        }
      }
    }, 60000);
  }

  /**
   * Stops the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
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
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Default rate limiter configurations for different operation types
 */
export const RateLimitDefaults = {
  fileRead: { maxRequests: 1000, windowMs: 60000 }, // 1000 reads per minute
  fileWrite: { maxRequests: 100, windowMs: 60000 }, // 100 writes per minute
  fileDelete: { maxRequests: 10, windowMs: 60000 }, // 10 deletes per minute
  apiCall: { maxRequests: 60, windowMs: 60000 }, // 60 API calls per minute
  phaseExecution: { maxRequests: 5, windowMs: 300000 }, // 5 phases per 5 minutes
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
export async function calculateChecksum(filePath: string): Promise<string> {
  const crypto = await import('crypto');
  const fs = await import('fs');

  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);

  return new Promise((resolve, reject) => {
    stream.on('data', (data: Buffer) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Verifies the integrity of a package-lock.json file
 *
 * @param lockFilePath - Path to package-lock.json
 * @returns Promise<DependencyIntegrityResult[]> - Array of integrity check results
 */
export async function verifyPackageLockIntegrity(lockFilePath: string): Promise<DependencyIntegrityResult[]> {
  const results: DependencyIntegrityResult[] = [];

  try {
    const fs = await import('fs');
    const lockFile = JSON.parse(fs.readFileSync(lockFilePath, 'utf-8'));

    if (!lockFile.lockfileVersion) {
      return [{ valid: false, packageName: 'package-lock.json', reason: 'Invalid lock file format' }];
    }

    // Check each dependency
    const dependencies = lockFile.packages || {};
    for (const [name, info] of Object.entries(dependencies)) {
      if (name === '') continue; // Skip root package

      const depInfo = info as any;
      const result: DependencyIntegrityResult = {
        valid: true,
        packageName: name,
      };

      // Check integrity if available
      if (depInfo.integrity) {
        const [, expectedHash] = depInfo.integrity.split('-');

        try {
          const actualHash = await calculateChecksum(depInfo.resolved || '');
          result.expectedChecksum = expectedHash;
          result.actualChecksum = actualHash;
          result.valid = actualHash === expectedHash;

          if (!result.valid) {
            result.reason = 'Checksum mismatch';
          }
        } catch {
          result.valid = false;
          result.reason = 'Failed to calculate checksum';
        }
      }

      results.push(result);
    }
  } catch (error) {
    return [{ valid: false, packageName: 'package-lock.json', reason: 'Failed to parse lock file' }];
  }

  return results;
}

/**
 * Verifies the integrity of a single dependency
 *
 * @param packageName - Name of the package
 * @param packagePath - Path to the package directory
 * @param expectedChecksum - Expected checksum (optional)
 * @returns Promise<DependencyIntegrityResult> - Integrity check result
 */
export async function verifyDependencyIntegrity(
  packageName: string,
  packagePath: string,
  expectedChecksum?: string
): Promise<DependencyIntegrityResult> {
  const result: DependencyIntegrityResult = {
    valid: true,
    packageName,
  };

  try {
    const fs = await import('fs');
    const packageJsonPath = `${packagePath}/package.json`;

    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
      result.valid = false;
      result.reason = 'package.json not found';
      return result;
    }

    // Calculate checksum if expected
    if (expectedChecksum) {
      const actualChecksum = await calculateChecksum(packageJsonPath);
      result.expectedChecksum = expectedChecksum;
      result.actualChecksum = actualChecksum;
      result.valid = actualChecksum === expectedChecksum;

      if (!result.valid) {
        result.reason = 'Checksum mismatch';
      }
    }
  } catch (error) {
    result.valid = false;
    result.reason = 'Failed to verify dependency';
  }

  return result;
}

/**
 * Checks for known vulnerable dependencies
 *
 * @param packageJsonPath - Path to package.json
 * @returns Promise<DependencyIntegrityResult[]> - Array of vulnerability check results
 */
export async function checkVulnerabilities(packageJsonPath: string): Promise<DependencyIntegrityResult[]> {
  const results: DependencyIntegrityResult[] = [];

  try {
    const fs = await import('fs');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // In a real implementation, this would query a vulnerability database
    // For now, we'll just check for known vulnerable package versions
    const knownVulnerabilities: Record<string, string[]> = {
      'lodash': ['<4.17.21'],
      'axios': ['<0.21.1'],
      'moment': ['<2.29.4'],
    };

    for (const [name, version] of Object.entries(dependencies)) {
      const vulnVersions = knownVulnerabilities[name];
      if (vulnVersions) {
        const versionStr = String(version);
        for (const vulnVersion of vulnVersions) {
          if (versionStr.startsWith(vulnVersion.replace('<', ''))) {
            results.push({
              valid: false,
              packageName: name,
              reason: `Known vulnerability in version ${versionStr}`,
            });
          }
        }
      }
    }
  } catch (error) {
    results.push({
      valid: false,
      packageName: 'package.json',
      reason: 'Failed to parse package.json',
    });
  }

  return results;
}
