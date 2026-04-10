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
export class FileWhitelist {
  private config: Required<FileWhitelistConfig>;
  private blockedFiles: number = 0;
  private allowedFiles: number = 0;

  constructor(config: FileWhitelistConfig = {}) {
    this.config = {
      allowedExtensions: config.allowedExtensions ?? ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'],
      allowedPatterns: config.allowedPatterns ?? [],
      blockedPatterns: config.blockedPatterns ?? [
        '.git',
        'node_modules',
        'dist',
        'build',
        '.env',
        '.env.*',
        '.aegisrc.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
      ],
      allowAllIfEmpty: config.allowAllIfEmpty ?? false,
      enableLogging: config.enableLogging ?? true,
    };
  }

  /**
   * Checks if a file is allowed to be modified
   *
   * @param filePath - Path to file
   * @returns FileWhitelistResult - Validation result
   */
  canModify(filePath: string): FileWhitelistResult {
    // Check if file is blocked
    const blockedPattern = this.isBlocked(filePath);
    if (blockedPattern) {
      const reason = `File matches blocked pattern: ${blockedPattern}`;
      this.logBlocked(filePath, reason);
      this.blockedFiles++;
      return { allowed: false, reason, filePath, matchedPattern: blockedPattern };
    }

    // Check if file is allowed by extension
    const extension = this.getExtension(filePath);
    if (this.config.allowedExtensions.includes(extension)) {
      this.logAllowed(filePath, `Extension ${extension} is allowed`);
      this.allowedFiles++;
      return { allowed: true, filePath, matchedPattern: extension };
    }

    // Check if file is allowed by pattern
    const allowedPattern = this.isAllowedByPattern(filePath);
    if (allowedPattern) {
      this.logAllowed(filePath, `Matches allowed pattern: ${allowedPattern}`);
      this.allowedFiles++;
      return { allowed: true, filePath, matchedPattern: allowedPattern };
    }

    // If whitelist is empty and allowAllIfEmpty is true, allow everything
    if (this.config.allowedExtensions.length === 0 && 
        this.config.allowedPatterns.length === 0 && 
        this.config.allowAllIfEmpty) {
      this.logAllowed(filePath, 'Whitelist is empty and allowAllIfEmpty is true');
      this.allowedFiles++;
      return { allowed: true, filePath };
    }

    // File not in whitelist
    const reason = `File extension ${extension} is not in allowed list and no pattern matched`;
    this.logBlocked(filePath, reason);
    this.blockedFiles++;
    return { allowed: false, reason, filePath };
  }

  /**
   * Gets file extension
   *
   * @private
   * @param filePath - File path
   * @returns string - File extension including dot
   */
  private getExtension(filePath: string): string {
    const ext = filePath.match(/\.[^.]+$/);
    return ext ? ext[0].toLowerCase() : '';
  }

  /**
   * Checks if a file is blocked by pattern
   *
   * @private
   * @param filePath - File path
   * @returns string | null - Matching blocked pattern or null
   */
  private isBlocked(filePath: string): string | null {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    for (const pattern of this.config.blockedPatterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Checks if a file is allowed by pattern
   *
   * @private
   * @param filePath - File path
   * @returns string | null - Matching allowed pattern or null
   */
  private isAllowedByPattern(filePath: string): string | null {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    for (const pattern of this.config.allowedPatterns) {
      if (this.matchesPattern(normalizedPath, pattern)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Checks if a path matches a pattern
   *
   * @private
   * @param path - Normalized path
   * @param pattern - Pattern to match
   * @returns boolean - True if matches
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Simple glob-like matching
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(regexPattern, 'i');
    return regex.test(path);
  }

  /**
   * Logs a blocked file
   *
   * @private
   * @param filePath - File path
   * @param reason - Reason for blocking
   */
  private logBlocked(filePath: string, reason: string): void {
    if (this.config.enableLogging) {
      console.warn(`[FileWhitelist] BLOCKED ${filePath}: ${reason}`);
    }
  }

  /**
   * Logs an allowed file
   *
   * @private
   * @param filePath - File path
   * @param reason - Reason for allowing
   */
  private logAllowed(filePath: string, reason: string): void {
    if (this.config.enableLogging) {
      console.log(`[FileWhitelist] ALLOWED ${filePath}: ${reason}`);
    }
  }

  /**
   * Gets whitelist statistics
   *
   * @returns Object with file counts
   */
  getStats(): {
    allowed: number;
    blocked: number;
    total: number;
  } {
    return {
      allowed: this.allowedFiles,
      blocked: this.blockedFiles,
      total: this.allowedFiles + this.blockedFiles,
    };
  }

  /**
   * Resets whitelist statistics
   */
  resetStats(): void {
    this.blockedFiles = 0;
    this.allowedFiles = 0;
  }

  /**
   * Updates the whitelist configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: Partial<FileWhitelistConfig>): void {
    if (config.allowedExtensions !== undefined) {
      this.config.allowedExtensions = config.allowedExtensions;
    }
    if (config.allowedPatterns !== undefined) {
      this.config.allowedPatterns = config.allowedPatterns;
    }
    if (config.blockedPatterns !== undefined) {
      this.config.blockedPatterns = config.blockedPatterns;
    }
    if (config.allowAllIfEmpty !== undefined) {
      this.config.allowAllIfEmpty = config.allowAllIfEmpty;
    }
    if (config.enableLogging !== undefined) {
      this.config.enableLogging = config.enableLogging;
    }
  }
}

/**
 * Global file whitelist instance
 */
export const globalFileWhitelist = new FileWhitelist();
