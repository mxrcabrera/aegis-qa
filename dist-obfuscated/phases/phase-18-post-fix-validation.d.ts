/**
 * Phase 18: Post-Fix Validation & Quality Gate
 *
 * Purpose: Final inspection before concluding the work.
 *
 * Architecture:
 * - Global Integrity Check: Execute npx tsc --noEmit globally, compare pre-fix vs post-fix
 * - Regression Analysis: Compare Phase 1 findings pre-fix vs post-fix
 * - Final Sanitization: Clean up temporary backup files (.backup.*.tmp)
 * - Hardware Guard (Final Stretch): Apply adaptiveCooldown('high') 30s before tsc global
 *
 * @module phases/phase-18-post-fix-validation
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
import { type MultiFixExecutionResult } from './phase-17-multi-fix-execution.js';
/**
 * Post-fix validation result
 */
interface PostFixValidationResult {
    /** Global integrity status */
    globalIntegrityStatus: 'passed' | 'GLOBAL_INTEGRITY_COMPROMISED';
    /** Pre-fix type error count */
    preFixTypeErrorCount: number;
    /** Post-fix type error count */
    postFixTypeErrorCount: number;
    /** New type errors introduced */
    newTypeErrors: number;
    /** Regressions detected */
    regressions: Regression[];
    /** Backup files cleaned */
    backupFilesCleaned: number;
    /** Backup folders cleaned */
    backupFoldersCleaned: number;
    /** Cooldown applied */
    cooldownApplied: boolean;
}
/**
 * Regression
 */
interface Regression {
    /** Regression ID */
    id: string;
    /** File path */
    filePath: string;
    /** Original finding type */
    originalFindingType: string;
    /** New error type */
    newErrorType: string;
    /** Description */
    description: string;
}
/**
 * Phase 18 configuration
 */
interface Phase18Config {
    /** Project root directory */
    projectRoot: string;
    /** Thermal controller for hardware protection */
    thermalController: ThermalController;
    /** State persistence for resume capability */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
    /** Multi-fix execution result from Phase 17 */
    multiFixResult?: MultiFixExecutionResult;
}
/**
 * Phase 18 result
 */
export interface Phase18Result {
    /** Overall success */
    success: boolean;
    /** Post-fix validation result */
    validationResult: PostFixValidationResult;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 18: Post-Fix Validation & Quality Gate
 *
 * This phase performs final validation after all fixes are applied.
 *
 * @class Phase18PostFixValidation
 */
export declare class Phase18PostFixValidation {
    private config;
    constructor(config: Phase18Config);
    /**
     * Executes Phase 18: Post-Fix Validation & Quality Gate
     *
     * @returns Promise<Phase18Result> - Post-fix validation result
     */
    execute(): Promise<Phase18Result>;
    /**
     * Captures pre-fix baseline (type errors before fixes)
     *
     * @private
     * @returns Promise<{ errorCount: number; errors: string[] }> - Pre-fix baseline
     */
    private capturePreFixBaseline;
    /**
     * Performs Global Integrity Check (PUNTO 1)
     *
     * PUNTO 1: Global Integrity Check
     *
     * LÓGICA DE GLOBAL INTEGRITY CHECK:
     * 1. Ejecutar npx tsc --noEmit sobre todo el proyecto
     * 2. Comparar errores post-fix con baseline pre-fix
     * 3. Si hay nuevos errores que no existían antes, marcar como GLOBAL_INTEGRITY_COMPROMISED
     * 4. Esto asegura que no reportamos errores que ya existían antes de los fixes
     *
     * @private
     * @param preFixBaseline - Pre-fix baseline
     * @returns Promise<{ status: 'passed' | 'GLOBAL_INTEGRITY_COMPROMISED'; errorCount: number; newErrors: number }> - Integrity check result
     */
    private performGlobalIntegrityCheck;
    /**
     * Detects new errors by comparing pre-fix and post-fix error sets
     *
     * @private
     * @param preFixErrors - Pre-fix errors
     * @param postFixErrors - Post-fix errors
     * @returns string[] - New errors
     */
    private detectNewErrors;
    /**
     * Extracts error signature for comparison
     *
     * @private
     * @param error - Error line
     * @returns string - Error signature
     */
    private extractErrorSignature;
    /**
     * Performs Regression Analysis (PUNTO 2)
     *
     * @private
     * @returns Promise<Regression[]> - Regressions detected
     */
    private performRegressionAnalysis;
    /**
     * Extracts findings from phase data
     *
     * @private
     * @param phaseData - Phase data
     * @returns Finding[] - Extracted findings
     */
    private extractFindingsFromPhaseData;
    /**
     * Runs Phase 1 scan to get post-fix findings
     *
     * @private
     * @returns Promise<Finding[]> - Post-fix findings
     */
    private runPhase1Scan;
    /**
     * Checks if post-fix error is a regression of pre-fix finding
     *
     * @private
     * @param preFixFinding - Pre-fix finding
     * @param postFixError - Post-fix error
     * @returns boolean - Whether it's a regression
     */
    private isRegression;
    /**
     * Performs Strict Regression Check (security patterns)
     *
     * @private
     * @returns Promise<Regression[]> - Security regressions detected
     */
    private performStrictRegressionCheck;
    /**
     * Gets modified files from Phase 17 data
     *
     * @private
     * @param phase17Data - Phase 17 data
     * @returns string[] - Modified file paths
     */
    private getModifiedFiles;
    /**
     * Performs Final Sanitization with Zombie Backup Hunter (PUNTO 2)
     *
     * PUNTO 2: Zombie Backup Hunter
     *
     * LÓGICA DE ZOMBIE BACKUP HUNTER:
     * - La sanitización debe ser recursiva
     * - Eliminar carpetas .aegis_backup o similares que hayan quedado por crash previo
     * - Solo permitir que el repo quede con los cambios confirmados
     * - Aegis QA debe ser un ciudadano ejemplar y dejar el filesystem impecable
     *
     * @private
     * @returns Promise<{ filesCleaned: number; foldersCleaned: number }> - Sanitization result
     */
    private performFinalSanitization;
    /**
     * Finds zombie backup folders (PUNTO 2)
     *
     * @private
     * @returns string[] - Array of zombie folder paths
     */
    private findZombieBackupFolders;
    /**
     * Deletes a folder recursively
     *
     * @private
     * @param folderPath - Folder path to delete
     */
    private deleteFolderRecursive;
    /**
     * Locks Final Report (PUNTO 3)
     *
     * @private
     * @returns Promise<void>
     */
    private lockFinalReport;
    /**
     * Performs Hardware Guard (The Big Breath) (PUNTO 4)
     *
     * PUNTO 4: Hardware Guard (The Big Breath)
     *
     * LÓGICA DE THE BIG BREATH:
     * - Antes de entregar el control al usuario, verificar temperatura de CPU/GPU
     * - Si sigue por encima de 65°C, forzar waiting period de 15 segundos
     * - Permitir que el sistema se enfríe antes de imprimir el resumen final
     *
     * @private
     * @returns Promise<void>
     */
    private performBigBreath;
    /**
     * Finds backup files (.backup.*.tmp)
     *
     * @private
     * @returns string[] - Array of backup file paths
     */
    private findBackupFiles;
}
export {};
//# sourceMappingURL=phase-18-post-fix-validation.d.ts.map