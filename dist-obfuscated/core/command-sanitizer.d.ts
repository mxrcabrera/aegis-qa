/**
 * CommandSanitizer - Secure command execution for preventing injection attacks
 *
 * This module provides utilities for safely executing shell commands
 * by sanitizing inputs and properly quoting arguments according to OS conventions.
 *
 * @module core/command-sanitizer
 * @since 1.1.0
 */
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
export declare class CommandSanitizer {
    private config;
    private isWindows;
    constructor(config?: Partial<SanitizerConfig>);
    /**
     * Validates an argument for dangerous patterns
     *
     * @param arg - Argument to validate
     * @returns boolean - True if argument is safe
     */
    private validateArgument;
    /**
     * Quotes an argument safely according to OS conventions
     *
     * @param arg - Argument to quote
     * @returns string - Safely quoted argument
     */
    quoteArgument(arg: string): string;
    /**
     * Sanitizes a command and its arguments
     *
     * @param command - Base command (e.g., 'git')
     * @param args - Array of arguments
     * @returns SanitizedCommand - Sanitized command information
     */
    sanitizeCommand(command: string, args?: string[]): SanitizedCommand;
    /**
     * Safely executes a command using exec with sanitized arguments
     *
     * @param command - Base command (e.g., 'git')
     * @param args - Array of arguments
     * @param options - Exec options
     * @returns Promise<{ stdout: string; stderr: string; }>
     */
    execSafe(command: string, args: string[], options?: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
    }): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * Safely executes a command using spawn with sanitized arguments
     *
     * @param command - Base command (e.g., 'git')
     * @param args - Array of arguments
     * @param options - Spawn options
     * @returns Promise<{ stdout: string; stderr: string }>
     */
    spawnSafe(command: string, args: string[], options?: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        shell?: boolean;
    }): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * Sanitizes a file path for safe use in commands
     *
     * @param filePath - File path to sanitize
     * @returns string - Safely quoted file path
     */
    sanitizePath(filePath: string): string;
    /**
     * Updates the sanitizer configuration
     *
     * @param config - Partial configuration to update
     */
    updateConfig(config: Partial<SanitizerConfig>): void;
    /**
     * Gets the current sanitizer configuration
     *
     * @returns SanitizerConfig - Current configuration
     */
    getConfig(): SanitizerConfig;
}
/**
 * Default singleton instance for convenience
 */
export declare const commandSanitizer: CommandSanitizer;
/**
 * Convenience function to execute a command safely
 *
 * @param command - Base command
 * @param args - Command arguments
 * @param options - Exec options
 * @returns Promise<{ stdout: string; stderr: string }>
 */
export declare function execSafe(command: string, args: string[], options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
}): Promise<{
    stdout: string;
    stderr: string;
}>;
/**
 * Convenience function to sanitize a command
 *
 * @param command - Base command
 * @param args - Command arguments
 * @returns SanitizedCommand - Sanitized command information
 */
export declare function sanitizeCommand(command: string, args?: string[]): SanitizedCommand;
/**
 * Convenience function to sanitize a file path
 *
 * @param filePath - File path to sanitize
 * @returns string - Safely quoted file path
 */
export declare function sanitizePath(filePath: string): string;
/**
 * Convenience function to execute a command using spawn
 *
 * @param command - Base command
 * @param args - Command arguments
 * @param options - Spawn options
 * @returns Promise<{ stdout: string; stderr: string }>
 */
export declare function spawnSafe(command: string, args: string[], options?: {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    shell?: boolean;
}): Promise<{
    stdout: string;
    stderr: string;
}>;
export {};
//# sourceMappingURL=command-sanitizer.d.ts.map