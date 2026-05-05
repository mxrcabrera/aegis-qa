/**
 * Atomic Fixer - Automated Code Fixes
 *
 * Purpose: Provides safe, atomic code fixes for common issues detected in QA phases.
 * Focus on non-destructive, reversible fixes with rollback capability.
 *
 * Architecture:
 * - Atomic Operations: Each fix is a single, reversible operation
 * - Safety Checks: Validate before applying fixes
 * - Rollback: Ability to undo fixes if needed
 * - Fix Registry: Registry of available fixes with metadata
 *
 * @module lib/atomic-fixer
 * @since 2.0.0
 */
/**
 * Fix operation result
 */
interface FixResult {
    /** Success status */
    success: boolean;
    /** Number of fixes applied */
    fixesApplied: number;
    /** Number of fixes skipped */
    fixesSkipped: number;
    /** Number of fixes failed */
    fixesFailed: number;
    /** Rollback data for undo */
    rollbackData: string[];
}
/**
 * Fix operation
 */
interface FixOperation {
    /** Unique fix ID */
    id: string;
    /** Fix name */
    name: string;
    /** Fix description */
    description: string;
    /** Severity level this fix addresses */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Apply the fix */
    apply(filePath: string, content: string): Promise<{
        success: boolean;
        newContent?: string;
        rollbackData?: string;
    }>;
}
/**
 * Atomic Fixer
 *
 * Provides safe, atomic code fixes for common issues detected in QA phases.
 * Each fix is reversible and can be rolled back if needed.
 *
 * @class AtomicFixer
 */
export declare class AtomicFixer {
    private fixRegistry;
    constructor();
    /**
     * Registers builtin fixes
     *
     * @private
     */
    private registerBuiltinFixes;
    /**
     * Registers a fix operation
     *
     * @param fix - Fix operation to register
     */
    registerFix(fix: FixOperation): void;
    /**
     * Applies fixes to a file
     *
     * @param filePath - File path
     * @param fixIds - Array of fix IDs to apply
     * @returns Promise<FixResult> - Fix result
     */
    applyFixes(filePath: string, fixIds: string[]): Promise<FixResult>;
    /**
     * Rolls back fixes from a file
     *
     * @param filePath - File path
     * @param rollbackData - Rollback data from fix operation
     * @returns Promise<boolean> - Success status
     */
    rollback(filePath: string, _rollbackData: string[]): Promise<boolean>;
    /**
     * Lists all available fixes
     *
     * @returns FixOperation[] - Array of available fixes
     */
    listFixes(): FixOperation[];
    /**
     * Gets a fix by ID
     *
     * @param fixId - Fix ID
     * @returns FixOperation | undefined - Fix operation or undefined
     */
    getFix(fixId: string): FixOperation | undefined;
}
export {};
//# sourceMappingURL=atomic-fixer.d.ts.map