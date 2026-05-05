/**
 * Phase 11: Atomic Fixes
 *
 * Purpose: Transform findings from previous phases into applicable fixes (patches)
 * without breaking the system.
 *
 * Architecture:
 * - i18n/a11y: Auto-generate missing alt attributes for images based on filename
 * - Environment: Auto-create .env.example using detected variables from Phase 10
 * - Clean Code: Refactor functions with >5 parameters to options object pattern
 * - Safety Gate: Generate .patch files before applying changes
 * - Core Path Protection: NO changes to Core Path without explicit confirmation
 * - Validation Loop: Re-run specific phase to verify score improved
 * - File Integrity: Integrate FileIntegrityChecker for file integrity validation
 *
 * @module phases/phase-11-atomic-fixes
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { type SandboxConfig } from '../core/sandbox-manager.js';
import { type OperationGuardConfig } from '../core/operation-guard.js';
import { type FileWhitelistConfig } from '../core/file-whitelist.js';
/**
 * Git checkpoint manager
 */
interface GitCheckpointManager {
    /** Create a checkpoint */
    createCheckpoint(tagName: string): Promise<{
        tagName: string;
        commitHash: string;
    }>;
}
/**
 * Fix application result
 */
interface FixApplicationResult {
    /** Fix ID */
    fixId: string;
    /** Original violation ID */
    originalViolationId?: string;
    /** File path */
    filePath: string;
    /** Success status */
    success: boolean;
    /** Original content */
    originalContent: string;
    /** New content */
    newContent?: string;
    /** Patch file path */
    patchFilePath?: string;
    /** Error if failed */
    error?: string;
    /** Whether in Core Path */
    isCorePath: boolean;
    /** Whether change was applied */
    applied: boolean;
    /** Whether change requires confirmation */
    requiresConfirmation: boolean;
    /** Whether collision was detected */
    collisionDetected?: boolean;
    /** Whether manual merge is required */
    manualMergeRequired?: boolean;
    /** Lines modified (for collision detection) */
    modifiedLines?: number[];
    /** Whether rollback was performed */
    rolledBack?: boolean;
    /** Backup file path for rollback */
    backupFilePath?: string;
}
/**
 * Detailed fix metrics
 */
interface FixMetrics {
    /** Total fixes attempted */
    totalFixesAttempted: number;
    /** Fixes successfully applied */
    fixesApplied: number;
    /** Fixes skipped (Core Path, user rejected, etc.) */
    fixesSkipped: number;
    /** Fixes pending confirmation */
    fixesPendingConfirmation: number;
    /** Fixes failed (syntax error, etc.) */
    fixesFailed: number;
    /** Fixes requiring manual merge (collision) */
    fixesManualMerge: number;
    /** Success rate (percentage) */
    successRate: number;
    /** Failure rate (percentage) */
    failureRate: number;
    /** Core path fixes attempted */
    corePathFixes: number;
    /** Non-core path fixes attempted */
    nonCorePathFixes: number;
    /** Destructive fixes attempted */
    destructiveFixes: number;
    /** Non-destructive fixes attempted */
    nonDestructiveFixes: number;
    /** Files affected */
    filesAffected: number;
    /** Average lines modified per fix */
    avgLinesModified: number;
    /** Total rollback events */
    rollbackEvents: number;
    /** Operation guard blocks */
    operationGuardBlocks: number;
    /** File whitelist blocks */
    fileWhitelistBlocks: number;
}
/**
 * Audit log entry for compliance tracking
 */
interface AuditLogEntry {
    /** Timestamp of the event */
    timestamp: string;
    /** Event type */
    eventType: 'FIX_GENERATED' | 'FIX_APPLIED' | 'FIX_SKIPPED' | 'FIX_FAILED' | 'USER_APPROVAL' | 'USER_REJECTION' | 'OPERATION_BLOCKED' | 'VALIDATION_RESULT';
    /** Fix ID if applicable */
    fixId?: string;
    /** File path if applicable */
    filePath?: string;
    /** Description of the event */
    description: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Remediation result
 */
interface RemediationResult {
    /** Total fixes attempted */
    totalFixesAttempted: number;
    /** Fixes applied */
    fixesApplied: number;
    /** Fixes skipped (Core Path) */
    fixesSkipped: number;
    /** Fixes pending confirmation */
    fixesPendingConfirmation: number;
    /** Fixes failed */
    fixesFailed: number;
    /** Fixes requiring manual merge (collision) */
    fixesManualMerge: number;
    /** Fix application results */
    fixResults: FixApplicationResult[];
    /** Validation results */
    validationResults: Map<number, {
        before: number;
        after: number;
        improved: boolean;
    }>;
    /** Detailed metrics */
    metrics?: FixMetrics;
    /** Audit log for compliance tracking */
    auditLog?: AuditLogEntry[];
}
/**
 * Phase 11 result
 */
export interface Phase11AtomicFixesResult {
    /** Overall success */
    success: boolean;
    /** Remediation result */
    remediationResult: RemediationResult;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 11 configuration
 */
interface Phase11Config {
    /** Project root directory */
    projectRoot: string;
    /** State persistence for storing results */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** Thermal controller for hardware protection */
    thermalController: ThermalController;
    /** Whether to apply fixes automatically (false = interactive mode) */
    autoApply: boolean;
    /** Whether to apply fixes in Core Path */
    allowCorePathFixes: boolean;
    /** Dry-run mode: generate patches but don't apply changes */
    dryRun: boolean;
    /** Whether to skip confirmation prompts (for CI/CD) */
    yesMode?: boolean;
    /** Git checkpoint manager for auto-backup */
    gitCheckpointManager?: GitCheckpointManager;
    /** Sandbox configuration for safe fix execution */
    sandboxConfig?: SandboxConfig;
    /** Operation guard configuration for limiting actions */
    operationGuardConfig?: OperationGuardConfig;
    /** File whitelist configuration for safe file modifications */
    fileWhitelistConfig?: FileWhitelistConfig;
    /** Whether to enable per-fix interactive approval */
    interactiveFix?: boolean;
    /** Whether to show batch diff preview before applying all fixes */
    previewDiffs?: boolean;
    /** Whether to enable audit-only mode for compliance (detailed logging) */
    auditOnly?: boolean;
}
/**
 * Phase 11: Atomic Fixes
 *
 * Transform findings from previous phases into applicable fixes (patches)
 * without breaking the system.
 *
 * @class Phase11AtomicFixes
 */
export declare class Phase11AtomicFixes {
    private config;
    private diffGenerator;
    private sandboxManager;
    private operationGuard;
    private fileWhitelist;
    private auditLog;
    constructor(config: Phase11Config);
    /**
     * Determines if a fix operation is destructive
     *
     * @private
     * @param fixResult - Fix application result
     * @returns boolean - Whether operation is destructive
     */
    private isDestructiveOperation;
    /**
     * Shows interactive confirmation for applying fixes
     *
     * @private
     * @param remediationResult - Remediation result with fixes to apply
     * @param forceConfirmation - Force confirmation even with --yes flag
     * @returns Promise<boolean> - True if user confirms, false otherwise
     */
    private showInteractiveConfirmation;
    /**
     * Shows per-fix interactive approval
     *
     * @private
     * @param fixResult - Fix application result to approve
     * @returns Promise<boolean> - True if approved, false otherwise
     */
    private showPerFixApproval;
    /**
     * Shows batch diff preview for all fixes before applying
     *
     * @private
     * @param remediationResult - Remediation result with all fix results
     * @returns Promise<boolean> - True if user approves proceeding with fixes
     */
    private showBatchDiffPreview;
    /**
     * Calculates detailed metrics from fix results
     *
     * @private
     * @param remediationResult - Remediation result with fix results
     * @returns FixMetrics - Detailed metrics
     */
    private calculateMetrics;
    /**
     * Displays detailed metrics summary
     *
     * @private
     * @param metrics - Fix metrics to display
     */
    private displayMetrics;
    /**
     * Logs an audit event for compliance tracking
     *
     * @private
     * @param eventType - Type of event
     * @param description - Description of the event
     * @param fixId - Optional fix ID
     * @param filePath - Optional file path
     * @param metadata - Optional additional metadata
     */
    private logAuditEvent;
    /**
     * Writes audit log to file
     *
     * @private
     * @returns Promise<void>
     */
    private writeAuditLog;
    /**
     * Creates auto-backup before applying fixes
     *
     * @private
     * @param filePaths - Array of file paths to backup
     * @returns Promise<void>
     */
    private createAutoBackup;
    /**
     * Creates physical backup of files
     *
     * @private
     * @param filePaths - Array of file paths to backup
     * @returns Promise<void>
     */
    private createPhysicalBackup;
    /**
     * Executes Phase 11: Atomic Fixes
     *
     * @returns Promise<Phase11AtomicFixesResult> - Atomic Fixes result
     */
    execute(): Promise<Phase11AtomicFixesResult>;
    /**
     * Gets Core Path files from Phase 2 results
     *
     * @private
     * @param analysisResults - Analysis results from previous phases
     * @returns Set<string> - Core Path files
     */
    private getCorePathFiles;
    /**
     * Applies i18n/a11y fixes
     *
     * @private
     * @param remediationResult - Remediation result to update
     * @param corePathFiles - Core Path files
     */
    private applyI18nA11yFixes;
    /**
     * Fixes missing alt attributes on images
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param isCorePath - Whether file is in Core Path
     * @returns Promise<FixApplicationResult | null>
     */
    private fixMissingAltAttributes;
    /**
     * Fixes missing aria-label on buttons
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param isCorePath - Whether file is in Core Path
     * @returns Promise<FixApplicationResult | null>
     */
    private fixMissingAriaLabels;
    /**
     * Applies Environment fixes
     *
     * @private
     * @param remediationResult - Remediation result to update
     * @param analysisResults - Analysis results from previous phases
     */
    private applyEnvironmentFixes;
    /**
     * Applies Clean Code fixes
     *
     * @private
     * @param remediationResult - Remediation result to update
     * @param corePathFiles - Core Path files
     */
    private applyCleanCodeFixes;
    /**
     * Refactors functions with >5 parameters to options object
     *
     * @private
     * @param filePath - File path
     * @param content - File content
     * @param isCorePath - Whether file is in Core Path
     * @returns Promise<FixApplicationResult | null>
     */
    private refactorToOptionsObject;
    /**
     * Generates a patch file for the fix
     *
     * @private
     * @param fixId - Fix ID
     * @param filePath - File path
     * @param originalContent - Original content
     * @param newContent - New content
     * @returns Promise<string> - Patch file path
     */
    private generatePatchFile;
    /**
     * Generates unified diff format
     *
     * @private
     * @param filePath - File path
     * @param originalContent - Original content
     * @param newContent - New content
     * @returns string - Unified diff
     */
    private generateUnifiedDiff;
    /**
     * Generates a unique fix ID
     *
     * @private
     * @param fixType - Fix type
     * @param filePath - File path
     * @returns string - Fix ID
     */
    private generateFixId;
    /**
     * Validates fixes by re-running the specific phase
     *
     * @private
     * @param remediationResult - Remediation result to update
     * @param phaseNumber - Phase number to re-run
     * @returns Promise<void>
     */
    private validateFixes;
    /**
     * Extracts modified lines between original and new content
     *
     * @private
     * @param originalContent - Original content
     * @param newContent - New content
     * @returns number[] - Array of modified line numbers
     */
    private extractModifiedLines;
    /**
     * Checks for collision with existing fixes
     *
     * @private
     * @param filePath - File path
     * @param modifiedLines - Lines to be modified
     * @param existingFixes - Map of existing fixes and their modified lines
     * @returns boolean - Whether collision was detected
     */
    private checkCollision;
    /**
     * Validates syntax of code content
     *
     * @private
     * @param filePath - File path
     * @param content - Content to validate
     * @returns Promise<boolean> - Whether syntax is valid
     */
    private validateSyntax;
    /**
     * Creates a backup of a file with integrity verification
     *
     * @private
     * @param filePath - File path
     * @param content - Content to backup
     * @returns Promise<string> - Backup file path
     * @throws {Error} If backup creation or verification fails
     */
    private createBackup;
    /**
     * Adds traceability comment to content
     *
     * @private
     * @param content - Content to add comment to
     * @param fixId - Fix ID
     * @param originalViolationId - Original violation ID
     * @returns string - Content with traceability comment
     */
    private addTraceabilityComment;
    /**
     * Rolls back a fix by restoring the original content
     *
     * @private
     * @param fixResult - Fix application result
     * @returns boolean - Whether rollback was successful
     */
    private rollbackFix;
    /**
     * Applies an atomic fix with Backup -> Action -> Verification -> Rollback loop
        isCorePath: false,
        applied: false,
        requiresConfirmation: false,
      };
  
      try {
        // Step 1: Backup - Guardar originalContent en memoria y en archivo
        const backupPath = path.join(this.config.projectRoot, `.backup.${fixId}.tmp`);
        fs.writeFileSync(backupPath, originalContent, 'utf-8');
        fixResult.backupFilePath = backupPath;
        console.log(`INFO Backup created for ${fixId}`);
  
        // Step 2: Action - Aplicar el fix
        fs.writeFileSync(filePath, newContent, 'utf-8');
        fixResult.applied = true;
        console.log(`INFO Fix ${fixId} applied to ${filePath}`);
  
        // Step 3: Hardware Check Pre-Build
        console.log(`INFO Hardware Check Pre-Build for ${fixId}...`);
        const resourceCheck = await this.config.thermalController.checkSystemResources();
        
        if (resourceCheck.cpuUsage >= 80) {
          console.log(`WARNING CPU usage high (${resourceCheck.cpuUsage}%). Applying adaptiveCooldown('high') for 20 seconds...`);
          await this.config.thermalController.applyAdaptiveCooldown('high');
          await new Promise(resolve => setTimeout(resolve, 20000));
          
          const postCooldownCheck = await this.config.thermalController.checkSystemResources();
          console.log(`INFO CPU usage after cooldown: ${postCooldownCheck.cpuUsage}%`);
        }
  
        // Step 4: Verificación de Integridad - Ejecutar npm run build o npx tsc --noEmit
        console.log(`INFO Running integrity verification for ${fixId}...`);
        
        let buildExitCode = 0;
        let buildError: string | undefined;
  
        // Try npm run build first
        try {
          const packageJsonPath = path.join(this.config.projectRoot, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            const { stdout: _stdout, stderr } = await execAsync('npm run build', { cwd: this.config.projectRoot });
            if (stderr) {
              buildError = stderr;
            }
          } else {
            // Fallback to tsc if no package.json
            const { stdout: _stdout, stderr } = await execAsync('npx tsc --noEmit', { cwd: this.config.projectRoot });
            if (stderr) {
              buildError = stderr;
            }
          }
        } catch (error: unknown) {
          buildExitCode = 1;
          buildError = error instanceof Error ? error.message : String(error);
        }
  
        // Step 5: Decisión - Si exit code es 0, el fix se queda. Si es != 0, realizar rollback
        if (buildExitCode !== 0) {
          console.log(`WARNING Build failed for ${fixId} (exit code: ${buildExitCode}). Performing rollback...`);
          
          // Rollback - restaurar el originalContent
          fs.writeFileSync(filePath, originalContent, 'utf-8');
          fixResult.rolledBack = true;
          fixResult.applied = false;
          fixResult.success = false;
          fixResult.error = `FIX_FAILED_INTEGRITY: Build failed - ${buildError}`;
          
          // Clean up backup file
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
          
          console.log(`INFO Rollback completed for ${fixId}`);
        } else {
          console.log(`SUCCESS Build passed for ${fixId}. Fix kept.`);
          fixResult.success = true;
          fixResult.error = undefined;
          
          // Clean up backup file since fix is successful
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
        }
  
        return fixResult;
      } catch (error: unknown) {
        // If any error occurs, attempt rollback
        console.error(`ERROR applying fix ${fixId}:`, error instanceof Error ? error.message : error);
        
        // Attempt rollback if fix was applied
        if (fixResult.applied) {
          try {
            fs.writeFileSync(filePath, originalContent, 'utf-8');
            fixResult.rolledBack = true;
            fixResult.applied = false;
            console.log(`INFO Emergency rollback for ${fixId}`);
          } catch {
            console.error(`ERROR Emergency rollback failed for ${fixId}`);
          }
        }
  
        fixResult.success = false;
        fixResult.error = error instanceof Error ? error.message : String(error);
        
        return fixResult;
      }
    }
  
    /**
     * Finds files with given extensions
     *
     * @private
     * @param extensions - File extensions
     * @returns string[] - File paths
     */
    private findFiles;
    /**
     * Writes partial report for Phase 11
     *
     * @private
     * @param remediationResult - Remediation result
     */
    private writePartialReport;
}
export {};
//# sourceMappingURL=phase-11-atomic-fixes.d.ts.map