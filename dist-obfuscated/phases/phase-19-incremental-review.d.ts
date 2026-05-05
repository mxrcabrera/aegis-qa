/**
 * Phase 19: Incremental Review
 *
 * Purpose: Make Aegis intelligent and only work on what's necessary.
 *
 * Architecture:
 * - Git-Powered Target Selection: Use git status and git diff to identify modified files
 * - Core-Path Dependency Tracing: Mark dependents of Core Path files for re-audit
 * - Audit Skip (Cache Hit): Log [SKIP] for unchanged files
 * - Hardware Guard (Diff Pressure): Force Full Review if diff is massive (>100 files)
 *
 * @module phases/phase-19-incremental-review
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Incremental review result
 */
interface IncrementalReviewResult {
    /** Total files in project */
    totalFiles: number;
    /** Files modified (from git) */
    modifiedFiles: number;
    /** Files selected for audit (modified + dependents) */
    filesSelectedForAudit: number;
    /** Files skipped (cache hit) */
    filesSkipped: number;
    /** Full review forced */
    fullReviewForced: boolean;
    /** Core path dependents traced */
    corePathDependentsTraced: number;
    /** Hash validation overrides */
    hashValidationOverrides: number;
}
/**
 * Phase 19 configuration
 */
interface Phase19Config {
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
 * Phase 19 result
 */
export interface Phase19Result {
    /** Overall success */
    success: boolean;
    /** Incremental review result */
    reviewResult: IncrementalReviewResult;
    /** Files selected for audit */
    selectedFiles: string[];
    /** Execution time in milliseconds */
    executionTimeMs: number;
    /** Error if failed */
    error?: string;
}
/**
 * Phase 19: Incremental Review
 *
 * This phase intelligently selects files for audit based on git changes.
 *
 * @class Phase19IncrementalReview
 */
export declare class Phase19IncrementalReview {
    private config;
    constructor(config: Phase19Config);
    /**
     * Executes Phase 19: Incremental Review
     *
     * @returns Promise<Phase19Result> - Incremental review result
     */
    execute(): Promise<Phase19Result>;
    /**
     * Gets modified files from git (PUNTO 1)
     *
     * PUNTO 1: Git-Powered Target Selection
     *
     * @private
     * @returns Promise<string[]> - Modified file paths
     */
    private getModifiedFiles;
    /**
     * Checks Diff Pressure (PUNTO 4)
     *
     * @private
     * @param modifiedFileCount - Number of modified files
     * @returns boolean - Whether full review is forced
     */
    private checkDiffPressure;
    /**
     * Gets all source files in the project
     *
     * @private
     * @returns string[] - Array of source file paths
     */
    private getAllSourceFiles;
    /**
     * Builds file audit status map
     *
     * @private
     * @param modifiedFiles - Modified file paths
     * @returns Promise<Map<string, FileAuditStatus>> - File audit status map
     */
    private buildFileAuditStatusMap;
    /**
     * Gets Core Paths from Phase 2
     *
     * @private
     * @returns string[] - Core paths
     */
    private getCorePaths;
    /**
     * Builds import map for Blast Radius
     *
     * @private
     * @returns Map<string, number> - File path to import count mapping
     */
    private buildImportMap;
    /**
     * Performs Core-Path Dependency Tracing with Depth Limit (PUNTO 2)
     *
     * PUNTO 2: Core-Path Dependency Tracing
     *
     * LÓGICA DE DEPENDENCY TRACING:
     * - Si un archivo modificado está en Core Path o tiene Blast Radius alto (>10)
     * - Marcar sus archivos dependientes directos para re-auditoría rápida
     * - Depth Limit: Default Depth 1, Critical Security = Depth 2
     * - Esto asegura que cambios en archivos centrales propaguen la validación
     *
     * @private
     * @param fileStatusMap - File audit status map
     * @returns Promise<number> - Number of dependents traced
     */
    private performCorePathDependencyTracing;
    /**
     * Builds reverse dependency map with Hardware Guard Diff Batching (PUNTO 4)
     *
     * PUNTO 4: Hardware Guard (Diff Batching)
     *
     * LÓGICA DE DIFF BATCHING:
     * - No leer todos los archivos de una vez
     * - Usar BatchProcessor para leer archivos en grupos de 50
     * - Liberar memoria entre cada lote para no estresar la RAM
     *
     * @private
     * @returns Promise<Map<string, string[]>> - File to dependents mapping
     */
    private buildReverseDependencyMapBatched;
    /**
     * Performs Hash-Validation Double Check (PUNTO 3)
     *
     * PUNTO 3: Hash-Validation Double Check
     *
     * LÓGICA DE HASH-VALIDATION:
     * - No confiar solo en Git
     * - Antes de decidir [SKIP], comparar hash actual con guardado en StatePersistence
     * - Si Git dice que no cambió pero el hash es distinto (git checkout o cambio externo), el hash manda
     * - Esto asegura que el sistema de cache sea infalible ante cambios fuera de Git
     *
     * @private
     * @param fileStatusMap - File audit status map
     * @returns Promise<number> - Number of hash validation overrides
     */
    private performHashValidationDoubleCheck;
    /**
     * Gets saved file hashes from StatePersistence
     *
     * @private
     * @returns Map<string, string> - File path to hash mapping
     */
    private getSavedFileHashes;
    /**
     * Calculates file hash
     *
     * @private
     * @param filePath - File path
     * @returns string - File hash
     */
    private calculateFileHash;
    /**
     * Updates saved file hashes in StatePersistence
     *
     * @private
     * @param fileStatusMap - File audit status map
     * @returns Promise<void>
     */
    private updateSavedFileHashes;
    /**
     * Gets untracked Core Path files (PUNTO 2)
     *
     * @private
     * @returns Promise<string[]> - Untracked Core Path file paths
     */
    private getUntrackedCorePathFiles;
    /**
     * Performs Audit Skip (Cache Hit)
     *
     * @private
     * @param fileStatusMap - File audit status map
     * @returns number - Number of files skipped
     */
    private performAuditSkip;
    /**
     * Selects files for audit
     *
     * @private
     * @param fileStatusMap - File audit status map
     * @returns string[] - Selected file paths
     */
    private selectFilesForAudit;
}
export {};
//# sourceMappingURL=phase-19-incremental-review.d.ts.map