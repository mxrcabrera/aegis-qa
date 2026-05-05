/**
 * Operation Guard - Controls Allowed Operations for Security
 *
 * Purpose: Limits what operations can be performed to prevent
 * unauthorized actions and provide granular control over system access.
 *
 * @module core/operation-guard
 * @since 2.0.0
 */
/**
 * Operation types that can be controlled
 */
export declare enum OperationType {
    READ = "read",
    WRITE = "write",
    DELETE = "delete",
    EXECUTE_COMMAND = "execute_command"
}
/**
 * Operation guard configuration
 */
export interface OperationGuardConfig {
    /** Whether to allow read operations */
    allowRead?: boolean;
    /** Whether to allow write operations */
    allowWrite?: boolean;
    /** Whether to allow delete operations */
    allowDelete?: boolean;
    /** Whether to allow command execution */
    allowExecuteCommands?: boolean;
    /** Whether to enable operation logging */
    enableLogging?: boolean;
    /** Paths where operations are always blocked */
    blockedPaths?: string[];
    /** Paths where operations are always allowed (overrides blocked) */
    allowedPaths?: string[];
    /** Operation-specific path rules */
    pathRules?: Map<OperationType, string[]>;
}
/**
 * Operation validation result
 */
export interface OperationResult {
    /** Whether operation is allowed */
    allowed: boolean;
    /** Reason for denial if not allowed */
    reason?: string;
    /** Operation type */
    operationType: OperationType;
    /** Target path */
    targetPath?: string;
}
/**
 * Operation Guard - Controls allowed operations
 *
 * @class OperationGuard
 */
export declare class OperationGuard {
    private config;
    private blockedOperations;
    private allowedOperations;
    constructor(config?: OperationGuardConfig);
    /**
     * Checks if a read operation is allowed
     *
     * @param filePath - Path to file to read
     * @returns OperationResult - Validation result
     */
    canRead(filePath: string): OperationResult;
    /**
     * Checks if a write operation is allowed
     *
     * @param filePath - Path to file to write
     * @returns OperationResult - Validation result
     */
    canWrite(filePath: string): OperationResult;
    /**
     * Checks if a delete operation is allowed
     *
     * @param filePath - Path to file to delete
     * @returns OperationResult - Validation result
     */
    canDelete(filePath: string): OperationResult;
    /**
     * Checks if a command execution is allowed
     *
     * @param command - Command to execute
     * @returns OperationResult - Validation result
     */
    canExecuteCommand(command: string): OperationResult;
    /**
     * Validates an operation against the guard rules
     *
     * @private
     * @param operationType - Type of operation
     * @param target - Target path or command
     * @returns OperationResult - Validation result
     */
    private validateOperation;
    /**
     * Checks if an operation type is globally allowed
     *
     * @private
     * @param operationType - Type of operation
     * @returns boolean - True if allowed
     */
    private isOperationTypeAllowed;
    /**
     * Checks if a path is in the blocked paths list
     *
     * @private
     * @param target - Target path
     * @returns boolean - True if blocked
     */
    private isPathBlocked;
    /**
     * Checks if a path is in the allowed paths list
     *
     * @private
     * @param target - Target path
     * @returns boolean - True if allowed
     */
    private isPathAllowed;
    /**
     * Checks if a path is blocked for a specific operation type
     *
     * @private
     * @param operationType - Type of operation
     * @param target - Target path
     * @returns boolean - True if blocked for this operation
     */
    private isPathBlockedForOperation;
    /**
     * Logs a blocked operation
     *
     * @private
     * @param operationType - Type of operation
     * @param target - Target path or command
     * @param reason - Reason for blocking
     */
    private logBlockedOperation;
    /**
     * Logs an allowed operation
     *
     * @private
     * @param operationType - Type of operation
     * @param target - Target path or command
     */
    private logAllowedOperation;
    /**
     * Gets operation statistics
     *
     * @returns Object with operation counts
     */
    getStats(): {
        allowed: number;
        blocked: number;
        total: number;
    };
    /**
     * Resets operation statistics
     */
    resetStats(): void;
    /**
     * Updates the guard configuration
     *
     * @param config - New configuration
     */
    updateConfig(config: Partial<OperationGuardConfig>): void;
}
/**
 * Global operation guard instance
 */
export declare const globalOperationGuard: OperationGuard;
//# sourceMappingURL=operation-guard.d.ts.map