/**
 * Error Messages - Actionable Error Messages with Solutions
 *
 * Purpose: Provides actionable error messages with suggested solutions
 * for common errors encountered during Aegis QA execution.
 *
 * @module core/error-messages
 * @since 2.0.0
 */
/**
 * Error category
 */
export declare enum ErrorCategory {
    SETUP = "setup",
    GIT = "git",
    TYPESCRIPT = "typescript",
    DEPENDENCY = "dependency",
    PERMISSION = "permission",
    NETWORK = "network",
    RESOURCE = "resource",
    UNKNOWN = "unknown"
}
/**
 * Error solution
 */
export interface ErrorSolution {
    /** Solution description */
    description: string;
    /** Command to run (if applicable) */
    command?: string;
    /** Documentation link (if applicable) */
    docsLink?: string;
}
/**
 * Error message with solutions
 */
export interface ErrorMessage {
    /** Error code */
    code: string;
    /** Error category */
    category: ErrorCategory;
    /** Error title */
    title: string;
    /** Error description */
    description: string;
    /** Suggested solutions */
    solutions: ErrorSolution[];
}
/**
 * ErrorMessages - Actionable error messages with solutions
 *
 * @class ErrorMessages
 */
export declare class ErrorMessages {
    private static errorDatabase;
    /**
     * Initializes the error database with common errors
     *
     * @private
     * @static
     */
    private static initializeErrorDatabase;
    /**
     * Adds an error to the database
     *
     * @private
     * @static
     * @param error - Error message to add
     */
    private static addError;
    /**
     * Gets an error message by code
     *
     * @static
     * @param code - Error code
     * @returns ErrorMessage | null - Error message or null if not found
     */
    static getError(code: string): ErrorMessage | null;
    /**
     * Gets an error message by pattern matching
     *
     * @static
     * @param errorMessage - Error message string
     * @returns ErrorMessage | null - Best matching error or null
     */
    static getErrorByPattern(errorMessage: string): ErrorMessage | null;
    /**
     * Formats an error message for display
     *
     * @static
     * @param error - Error message to format
     * @param verbose - Whether to include detailed information
     * @returns string - Formatted error message
     */
    static formatError(error: ErrorMessage, verbose?: boolean): string;
    /**
     * Logs an error with actionable solutions
     *
     * @static
     * @param error - Error object or message
     * @param verbose - Whether to include detailed information
     */
    static logError(error: Error | string, verbose?: boolean): void;
    /**
     * Creates a custom error message
     *
     * @static
     * @param code - Error code
     * @param category - Error category
     * @param title - Error title
     * @param description - Error description
     * @param solutions - Array of solutions
     * @returns ErrorMessage - Custom error message
     */
    static createCustomError(code: string, category: ErrorCategory, title: string, description: string, solutions: ErrorSolution[]): ErrorMessage;
}
//# sourceMappingURL=error-messages.d.ts.map