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
export enum OperationType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  EXECUTE_COMMAND = 'execute_command',
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
export class OperationGuard {
  private config: Required<OperationGuardConfig>;
  private blockedOperations: number = 0;
  private allowedOperations: number = 0;

  constructor(config: OperationGuardConfig = {}) {
    this.config = {
      allowRead: config.allowRead ?? true,
      allowWrite: config.allowWrite ?? true,
      allowDelete: config.allowDelete ?? false,
      allowExecuteCommands: config.allowExecuteCommands ?? false,
      enableLogging: config.enableLogging ?? true,
      blockedPaths: config.blockedPaths ?? [],
      allowedPaths: config.allowedPaths ?? [],
      pathRules: config.pathRules ?? new Map(),
    };
  }

  /**
   * Checks if a read operation is allowed
   *
   * @param filePath - Path to file to read
   * @returns OperationResult - Validation result
   */
  canRead(filePath: string): OperationResult {
    return this.validateOperation(OperationType.READ, filePath);
  }

  /**
   * Checks if a write operation is allowed
   *
   * @param filePath - Path to file to write
   * @returns OperationResult - Validation result
   */
  canWrite(filePath: string): OperationResult {
    return this.validateOperation(OperationType.WRITE, filePath);
  }

  /**
   * Checks if a delete operation is allowed
   *
   * @param filePath - Path to file to delete
   * @returns OperationResult - Validation result
   */
  canDelete(filePath: string): OperationResult {
    return this.validateOperation(OperationType.DELETE, filePath);
  }

  /**
   * Checks if a command execution is allowed
   *
   * @param command - Command to execute
   * @returns OperationResult - Validation result
   */
  canExecuteCommand(command: string): OperationResult {
    return this.validateOperation(OperationType.EXECUTE_COMMAND, command);
  }

  /**
   * Validates an operation against the guard rules
   *
   * @private
   * @param operationType - Type of operation
   * @param target - Target path or command
   * @returns OperationResult - Validation result
   */
  private validateOperation(operationType: OperationType, target: string): OperationResult {
    // Check if operation type is globally allowed
    if (!this.isOperationTypeAllowed(operationType)) {
      const reason = `Operation type '${operationType}' is not allowed`;
      this.logBlockedOperation(operationType, target, reason);
      this.blockedOperations++;
      return { allowed: false, reason, operationType, targetPath: target };
    }

    // Check if target is in blocked paths
    if (this.isPathBlocked(target)) {
      const reason = `Target path is in blocked paths list`;
      this.logBlockedOperation(operationType, target, reason);
      this.blockedOperations++;
      return { allowed: false, reason, operationType, targetPath: target };
    }

    // Check if target is in allowed paths (overrides blocked)
    if (this.isPathAllowed(target)) {
      this.logAllowedOperation(operationType, target);
      this.allowedOperations++;
      return { allowed: true, operationType, targetPath: target };
    }

    // Check operation-specific path rules
    if (this.isPathBlockedForOperation(operationType, target)) {
      const reason = `Target path is blocked for operation type '${operationType}'`;
      this.logBlockedOperation(operationType, target, reason);
      this.blockedOperations++;
      return { allowed: false, reason, operationType, targetPath: target };
    }

    // Operation allowed
    this.logAllowedOperation(operationType, target);
    this.allowedOperations++;
    return { allowed: true, operationType, targetPath: target };
  }

  /**
   * Checks if an operation type is globally allowed
   *
   * @private
   * @param operationType - Type of operation
   * @returns boolean - True if allowed
   */
  private isOperationTypeAllowed(operationType: OperationType): boolean {
    switch (operationType) {
      case OperationType.READ:
        return this.config.allowRead;
      case OperationType.WRITE:
        return this.config.allowWrite;
      case OperationType.DELETE:
        return this.config.allowDelete;
      case OperationType.EXECUTE_COMMAND:
        return this.config.allowExecuteCommands;
      default:
        return false;
    }
  }

  /**
   * Checks if a path is in the blocked paths list
   *
   * @private
   * @param target - Target path
   * @returns boolean - True if blocked
   */
  private isPathBlocked(target: string): boolean {
    return this.config.blockedPaths.some(blockedPath => 
      target.includes(blockedPath) || target.startsWith(blockedPath)
    );
  }

  /**
   * Checks if a path is in the allowed paths list
   *
   * @private
   * @param target - Target path
   * @returns boolean - True if allowed
   */
  private isPathAllowed(target: string): boolean {
    return this.config.allowedPaths.some(allowedPath => 
      target.includes(allowedPath) || target.startsWith(allowedPath)
    );
  }

  /**
   * Checks if a path is blocked for a specific operation type
   *
   * @private
   * @param operationType - Type of operation
   * @param target - Target path
   * @returns boolean - True if blocked for this operation
   */
  private isPathBlockedForOperation(operationType: OperationType, target: string): boolean {
    const blockedPaths = this.config.pathRules.get(operationType);
    if (!blockedPaths) {
      return false;
    }
    return blockedPaths.some(blockedPath => 
      target.includes(blockedPath) || target.startsWith(blockedPath)
    );
  }

  /**
   * Logs a blocked operation
   *
   * @private
   * @param operationType - Type of operation
   * @param target - Target path or command
   * @param reason - Reason for blocking
   */
  private logBlockedOperation(operationType: OperationType, target: string, reason: string): void {
    if (this.config.enableLogging) {
      console.warn(`[OperationGuard] BLOCKED ${operationType}: ${target} - ${reason}`);
    }
  }

  /**
   * Logs an allowed operation
   *
   * @private
   * @param operationType - Type of operation
   * @param target - Target path or command
   */
  private logAllowedOperation(operationType: OperationType, target: string): void {
    if (this.config.enableLogging) {
      console.log(`[OperationGuard] ALLOWED ${operationType}: ${target}`);
    }
  }

  /**
   * Gets operation statistics
   *
   * @returns Object with operation counts
   */
  getStats(): {
    allowed: number;
    blocked: number;
    total: number;
  } {
    return {
      allowed: this.allowedOperations,
      blocked: this.blockedOperations,
      total: this.allowedOperations + this.blockedOperations,
    };
  }

  /**
   * Resets operation statistics
   */
  resetStats(): void {
    this.blockedOperations = 0;
    this.allowedOperations = 0;
  }

  /**
   * Updates the guard configuration
   *
   * @param config - New configuration
   */
  updateConfig(config: Partial<OperationGuardConfig>): void {
    if (config.allowRead !== undefined) {
      this.config.allowRead = config.allowRead;
    }
    if (config.allowWrite !== undefined) {
      this.config.allowWrite = config.allowWrite;
    }
    if (config.allowDelete !== undefined) {
      this.config.allowDelete = config.allowDelete;
    }
    if (config.allowExecuteCommands !== undefined) {
      this.config.allowExecuteCommands = config.allowExecuteCommands;
    }
    if (config.enableLogging !== undefined) {
      this.config.enableLogging = config.enableLogging;
    }
    if (config.blockedPaths !== undefined) {
      this.config.blockedPaths = config.blockedPaths;
    }
    if (config.allowedPaths !== undefined) {
      this.config.allowedPaths = config.allowedPaths;
    }
    if (config.pathRules !== undefined) {
      this.config.pathRules = config.pathRules;
    }
  }
}

/**
 * Global operation guard instance
 */
export const globalOperationGuard = new OperationGuard();
