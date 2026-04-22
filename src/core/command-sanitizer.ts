/**
 * CommandSanitizer - Secure command execution for preventing injection attacks
 *
 * This module provides utilities for safely executing shell commands
 * by sanitizing inputs and properly quoting arguments according to OS conventions.
 *
 * @module core/command-sanitizer
 * @since 1.1.0
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Sanitization configuration
 */
interface SanitizerConfig {
  /** Maximum allowed command length */
  maxCommandLength: number;
  /** Whether to allow shell metacharacters in arguments */
  allowShellMetacharacters: boolean;
  /** Whitelist of allowed characters in arguments */
  allowedCharacters: string;
  /** Blacklist of dangerous patterns */
  blacklistedPatterns: RegExp[];
}

/**
 * Sanitized command result
 */
interface SanitizedCommand {
  /** The sanitized command string */
  command: string;
  /** Array of safely quoted arguments */
  args: string[];
  /** Whether any sanitization was performed */
  wasSanitized: boolean;
}

/**
 * CommandSanitizer - Secure command execution utility
 *
 * This class provides methods to sanitize and safely execute shell commands,
 * preventing command injection attacks by validating inputs and properly
 * quoting arguments according to OS conventions.
 *
 * @class CommandSanitizer
 * @example
 * ```typescript
 * const sanitizer = new CommandSanitizer();
 * const result = await sanitizer.execSafe('git', ['status', '--porcelain'], { cwd: '/path' });
 * ```
 */
export class CommandSanitizer {
  private config: SanitizerConfig;
  private isWindows: boolean;

  constructor(config?: Partial<SanitizerConfig>) {
    this.isWindows = process.platform === 'win32';
    this.config = {
      maxCommandLength: 8192,
      allowShellMetacharacters: false,
      // Allow alphanumeric, common path characters, and safe punctuation
      allowedCharacters: 'a-zA-Z0-9._/\\:@=~-',
      // Blacklist dangerous patterns that could lead to injection
      blacklistedPatterns: [
        /;\s*rm\s+-rf/i,           // Remove all files
        /;\s*dd\s+if=/i,           // Disk destruction
        /;\s*chmod\s+777/i,         // Permission escalation
        /;\s*curl\s+.*\|sh/i,       // Download and execute
        /;\s*wget\s+.*\|sh/i,       // Download and execute
        /&&\s*rm\s+/i,              // Remove with AND
        /\|\s*rm\s+/i,              // Remove with pipe
        /\$\(.*\)/i,                // Command substitution
        /`[^`]*`/i,                 // Backtick command substitution
        />\s*\//i,                  // Redirect to root
        /<\s*\/dev\/null/i,         // Input from null (potentially malicious)
      ],
      ...config,
    };
  }

  /**
   * Validates an argument for dangerous patterns
   *
   * @param arg - Argument to validate
   * @returns boolean - True if argument is safe
   */
  private validateArgument(arg: string): boolean {
    // Check for blacklisted patterns
    for (const pattern of this.config.blacklistedPatterns) {
      if (pattern.test(arg)) {
        throw new Error(`Argument contains blacklisted pattern: ${arg}`);
      }
    }

    // If shell metacharacters are not allowed, check for them
    if (!this.config.allowShellMetacharacters) {
      const shellMetachars = /[;&|`$()<>]/;
      if (shellMetachars.test(arg)) {
        throw new Error(`Argument contains shell metacharacters: ${arg}`);
      }
    }

    // Check for allowed characters (basic validation)
    // Allow alphanumeric, common path chars, and safe punctuation
    const safeCharPattern = new RegExp(`^[${this.config.allowedCharacters}]+$`);
    if (!safeCharPattern.test(arg) && arg.includes(' ')) {
      // If it has spaces and doesn't match safe pattern, it needs quoting
      // This is not an error, just a note that quoting is required
    }

    return true;
  }

  /**
   * Quotes an argument safely according to OS conventions
   *
   * @param arg - Argument to quote
   * @returns string - Safely quoted argument
   */
  quoteArgument(arg: string): string {
    // Validate argument first
    this.validateArgument(arg);

    // Check if quoting is needed
    const needsQuoting = 
      arg.includes(' ') || 
      arg.includes('\t') || 
      arg.includes('"') || 
      arg.includes("'") ||
      arg.includes('\\') ||
      arg.startsWith('-') ||
      arg.includes(';') ||
      arg.includes('&') ||
      arg.includes('|') ||
      arg.includes('<') ||
      arg.includes('>') ||
      arg.includes('$') ||
      arg.includes('`');

    if (!needsQuoting) {
      return arg;
    }

    if (this.isWindows) {
      // Windows: Use double quotes and escape existing double quotes
      return `"${arg.replace(/"/g, '""')}"`;
    } else {
      // Unix: Use single quotes and escape single quotes with '\'' sequence
      return `'${arg.replace(/'/g, "'\\''")}'`;
    }
  }

  /**
   * Sanitizes a command and its arguments
   *
   * @param command - Base command (e.g., 'git')
   * @param args - Array of arguments
   * @returns SanitizedCommand - Sanitized command information
   */
  sanitizeCommand(command: string, args: string[] = []): SanitizedCommand {
    // Validate base command
    this.validateArgument(command);

    // Quote all arguments
    const quotedArgs = args.map(arg => this.quoteArgument(arg));

    // Build command string
    const commandString = [command, ...quotedArgs].join(' ');

    // Check command length
    if (commandString.length > this.config.maxCommandLength) {
      throw new Error(`Command length exceeds maximum of ${this.config.maxCommandLength}`);
    }

    return {
      command: commandString,
      args: quotedArgs,
      wasSanitized: quotedArgs.some((arg, i) => arg !== args[i]),
    };
  }

  /**
   * Safely executes a command using exec with sanitized arguments
   *
   * @param command - Base command (e.g., 'git')
   * @param args - Array of arguments
   * @param options - Exec options
   * @returns Promise<{ stdout: string; stderr: string; }>
   */
  async execSafe(
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv }
  ): Promise<{ stdout: string; stderr: string }> {
    const sanitized = this.sanitizeCommand(command, args);

    try {
      // Use exec with the full command string for Windows compatibility
      // For Unix, we could use args array, but Windows cmd requires string
      const { stdout, stderr } = await execAsync(sanitized.command, options);
      
      return { stdout: String(stdout), stderr: String(stderr) };
    } catch (error: unknown) {
      throw new Error(`Command execution failed: ${sanitized.command}\n${(error as Error).message}`);
    }
  }

  /**
   * Safely executes a command using spawn with sanitized arguments
   *
   * @param command - Base command (e.g., 'git')
   * @param args - Array of arguments
   * @param options - Spawn options
   * @returns Promise<{ stdout: string; stderr: string }>
   */
  async spawnSafe(
    command: string,
    args: string[],
    options?: { cwd?: string; env?: NodeJS.ProcessEnv; shell?: boolean }
  ): Promise<{ stdout: string; stderr: string }> {
    const sanitized = this.sanitizeCommand(command, args);

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(command, sanitized.args, {
        ...options,
        shell: this.isWindows, // Use shell on Windows for better compatibility
        windowsHide: true, // Hide console window on Windows
      });

      child.stdout?.on('data', (data) => {
        stdout += String(data);
      });

      child.stderr?.on('data', (data) => {
        stderr += String(data);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Command exited with code ${code}: ${sanitized.command}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn command: ${sanitized.command}\n${error.message}`));
      });
    });
  }

  /**
   * Sanitizes a file path for safe use in commands
   *
   * @param filePath - File path to sanitize
   * @returns string - Safely quoted file path
   */
  sanitizePath(filePath: string): string {
    // Normalize the path
    const normalized = filePath.replace(/\\/g, '/');

    // Check for path traversal attempts
    if (normalized.includes('../') || normalized.includes('..\\')) {
      throw new Error(`Path traversal detected: ${filePath}`);
    }

    // Check for absolute paths to sensitive system directories
    const sensitivePaths = [
      '/etc/passwd',
      '/etc/shadow',
      '/etc/sudoers',
      '/root/',
      '/home/',
    ];

    for (const sensitivePath of sensitivePaths) {
      if (normalized.startsWith(sensitivePath)) {
        throw new Error(`Access to sensitive path denied: ${filePath}`);
      }
    }

    return this.quoteArgument(normalized);
  }

  /**
   * Updates the sanitizer configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<SanitizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Gets the current sanitizer configuration
   *
   * @returns SanitizerConfig - Current configuration
   */
  getConfig(): SanitizerConfig {
    return { ...this.config };
  }
}

/**
 * Default singleton instance for convenience
 */
export const commandSanitizer = new CommandSanitizer();

/**
 * Convenience function to execute a command safely
 *
 * @param command - Base command
 * @param args - Command arguments
 * @param options - Exec options
 * @returns Promise<{ stdout: string; stderr: string }>
 */
export async function execSafe(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv }
): Promise<{ stdout: string; stderr: string }> {
  return commandSanitizer.execSafe(command, args, options);
}

/**
 * Convenience function to sanitize a command
 *
 * @param command - Base command
 * @param args - Command arguments
 * @returns SanitizedCommand - Sanitized command information
 */
export function sanitizeCommand(command: string, args: string[] = []): SanitizedCommand {
  return commandSanitizer.sanitizeCommand(command, args);
}

/**
 * Convenience function to sanitize a file path
 *
 * @param filePath - File path to sanitize
 * @returns string - Safely quoted file path
 */
export function sanitizePath(filePath: string): string {
  return commandSanitizer.sanitizePath(filePath);
}

/**
 * Convenience function to execute a command using spawn
 *
 * @param command - Base command
 * @param args - Command arguments
 * @param options - Spawn options
 * @returns Promise<{ stdout: string; stderr: string }>
 */
export async function spawnSafe(
  command: string,
  args: string[],
  options?: { cwd?: string; env?: NodeJS.ProcessEnv; shell?: boolean }
): Promise<{ stdout: string; stderr: string }> {
  return commandSanitizer.spawnSafe(command, args, options);
}
