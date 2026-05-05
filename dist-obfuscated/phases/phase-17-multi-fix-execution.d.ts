/**
 * Phase 17: Multi-Fix Execution
 *
 * Purpose: Convert AtomicFixer into a mass remediation machine but safe.
 *
 * Architecture:
 * - Batch Execution: Apply multiple fixes in same file if Safe Level < 3
 * - Smart Verification: Incremental verification (eslint --fix, tsc --noEmit, full build conditional)
 * - Parallel Fixes Guard: Limit parallelism based on CPU usage
 * - Hardware Guard (Disk I/O): Monitor write latency, wait 5s if disk saturated
 *
 * @module phases/phase-17-multi-fix-execution
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Multi-fix execution result
 */
export interface MultiFixExecutionResult {
    /** Total fixes attempted */
    totalFixesAttempted: number;
    /** Fixes applied */
    fixesApplied: number;
    /** Fixes failed */
    fixesFailed: number;
    /** Files processed in batch */
    batchFiles: number;
    /** Files processed individually */
    individualFiles: number;
    /** Verification time saved (ms) */
    verificationTimeSaved: number;
    /** Disk I/O waits */
    diskIOWaits: number;
}
/**
 * Phase 17 configuration
 */
interface Phase17Config {
    /** Project root directory */
    projectRoot: string;
    /** Thermal controller for hardware protection */
    thermalController: ThermalController;
    /** State persistence for resume capability */
    statePersistence: StatePersistence;
    /** Current execution state */
    currentState: ExecutionState;
}
/**
 * Phase 17 result
 */
export interface Phase17Result {
    /** Overall success */
    success: boolean;
    /** Multi-fix execution result */
    executionResult: MultiFixExecutionResult;
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 17: Multi-Fix Execution
 *
 * This phase executes multiple fixes efficiently with safety guards.
 *
 * @class Phase17MultiFixExecution
 */
export declare class Phase17MultiFixExecution {
    private config;
    private lastWriteTime;
    private diskIOWaitCount;
    constructor(config: Phase17Config);
    /**
     * Executes Phase 17: Multi-Fix Execution
     *
     * @returns Promise<Phase17Result> - Multi-fix execution result
     */
    execute(): Promise<Phase17Result>;
    /**
     * Executes multi-fixes with batch execution
     *
     * @private
     * @returns Promise<MultiFixExecutionResult> - Multi-fix execution result
     */
    private executeMultiFixes;
    /**
     * Groups strategies by file path
     *
     * @private
     * @param strategies - Array of strategies
     * @returns FileFixBatch[] - Array of file batches
     */
    private groupStrategiesByFile;
    /**
     * Applies multiple fixes in batch mode
     *
     * @private
     * @param batch - File fix batch
     * @returns Promise<{ applied: number; failed: number; timeSaved: number }> - Batch result
     */
    private applyBatchFixes;
    /**
     * Applies fixes individually (isolated)
     *
     * @private
     * @param batch - File fix batch
     * @returns Promise<{ applied: number; failed: number }> - Individual result
     */
    private applyIndividualFixes;
    /**
     * Applies a single fix to content
     *
     * @private
     * @param content - Original content
     * @param strategy - Fix strategy
     * @returns { success: boolean; newContent: string } - Fix result
     */
    private applySingleFixToContent;
    /**
     * Fixes hardcoded string
     *
     * @private
     * @param content - Content
     * @param strategy - Strategy
     * @returns Fix result
     */
    private fixHardcodedString;
    /**
     * Fixes unused variable
     *
     * @private
     * @param content - Content
     * @param strategy - Strategy
     * @returns Fix result
     */
    private fixUnusedVariable;
    /**
     * Fixes USER root in Dockerfile
     *
     * @private
     * @param content - Content
     * @param strategy - Strategy
     * @returns Fix result
     */
    private fixUserRoot;
    /**
     * Fixes latest image in Dockerfile
     *
     * @private
     * @param content - Content
     * @param strategy - Strategy
     * @returns Fix result
     */
    private fixLatestImage;
    /**
     * Performs Smart Verification (PUNTO 2)
     *
     * LÓGICA DE SMART VERIFICATION:
     *
     * Paso 1: npx eslint --fix (solo en el archivo afectado)
     * Paso 2: npx tsc --noEmit (solo si el archivo es TypeScript)
     * Paso 3: Solo si el archivo es Core Path o tiene Blast Radius > 10, disparar el build completo
     *
     * Esto ahorra ciclos de CPU sin comprometer la integridad del código
     *
     * @private
     * @param filePath - File path
     * @param isCorePath - Whether file is in Core Path
     * @param blastRadius - Import count (Blast Radius)
     * @returns Promise<{ passed: boolean; timeSaved: number }> - Verification result
     */
    private performSmartVerification;
    /**
     * Checks Disk I/O and waits if saturated
     *
     * @private
     * @returns Promise<void>
     */
    private checkDiskIO;
    /**
     * Runs Linter-Fix Loop (PUNTO 2)
     *
     * LÓGICA DE LINTER-FIX LOOP:
     * - Ejecutar eslint --fix hasta 3 veces consecutivas
     * - Si falla 3 veces, marcar como FORMAT_ERROR y rollback
     * - Evitamos dejar código "sucio" aunque sea funcional
     *
     * @private
     * @param filePath - File path
     * @returns Promise<{ success: boolean }> - Linter result
     */
    private runLinterFixLoop;
}
export {};
//# sourceMappingURL=phase-17-multi-fix-execution.d.ts.map