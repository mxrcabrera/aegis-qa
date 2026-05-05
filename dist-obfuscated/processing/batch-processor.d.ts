/**
 * BatchProcessor - Atomic File Processing with Integrity Guarantees
 *
 * Purpose: Process files in batches with atomic operations, ensuring no files
 * are left "half-processed" even if execution is interrupted (SIGINT, thermal shutdown).
 *
 * Architecture:
 * - Processes files in configurable batch sizes
 * - Each file operation is atomic (fully processed or not at all)
 * - Integrates with StatePersistence for resume capability
 * - Thermal checks between batches
 * - Adaptive batch sizing based on hardware capabilities
 *
 * @module processing/batch-processor
 * @since 2.0.0
 */
import { ThermalController } from '../core/thermal-controller.js';
import { StatePersistence, type ExecutionState } from '../core/state-persistence.js';
/**
 * Batch processor configuration
 */
interface BatchProcessorConfig {
    /** Project root directory */
    projectRoot: string;
    /** Thermal controller for hardware protection */
    thermalController: ThermalController;
    /** State persistence for resume capability */
    statePersistence: StatePersistence;
    /** Recommended batch size from hardware detection */
    recommendedBatchSize?: number;
    /** Recommended cooldown from hardware detection */
    recommendedCooldown?: number;
    /** Whether to apply cooldowns between batches */
    applyCooldowns?: boolean;
    /** Critical modules to prioritize (from Phase 2) */
    criticalModules?: string[];
}
/**
 * File processing result
 */
interface FileProcessingResult {
    /** File path */
    filePath: string;
    /** Whether processing succeeded */
    success: boolean;
    /** Processing time in milliseconds */
    processingTimeMs: number;
    /** Error message if processing failed */
    error?: string;
    /** Any findings from this file */
    findings?: unknown[];
}
/**
 * Batch processing result
 */
interface BatchResult {
    /** Batch number */
    batchNumber: number;
    /** Total batches */
    totalBatches: number;
    /** Files in this batch */
    fileCount: number;
    /** Successful processing count */
    successCount: number;
    /** Failed processing count */
    failureCount: number;
    /** Total findings from this batch */
    totalFindings: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
}
/**
 * BatchProcessor - Atomic file processing with integrity guarantees
 *
 * This class processes files in batches with atomic operations, ensuring
 * that no files are left "half-processed" even if execution is interrupted.
 *
 * @class BatchProcessor
 * @example
 * ```typescript
 * const processor = new BatchProcessor({
 *   projectRoot: '/path/to/project',
 *   thermalController: new ThermalController(),
 *   statePersistence: new StatePersistence('/path/to/project'),
 *   recommendedBatchSize: 20,
 *   recommendedCooldown: 15000,
 * });
 *
 * const results = await processor.processFiles(
 *   ['/path/to/file1.ts', '/path/to/file2.ts'],
 *   async (file) => { /* process file * / }
 * );
 * ```
 */
export declare class BatchProcessor {
    private config;
    private batchSize;
    constructor(config: BatchProcessorConfig);
    /**
     * Prioritizes files based on critical modules when resources are limited
     *
     * @private
     * @param files - Array of file paths
     * @returns Prioritized array of file paths
     */
    private prioritizeFiles;
    /**
     * Processes files in batches with atomic operations
     *
     * This method processes files in batches, ensuring each file is fully
     * processed before moving to the next. Thermal checks are performed between
     * batches. State is saved after each batch for resume capability.
     *
     * @param files - Array of file paths to process
     * @param processorFn - Async function to process each file
     * @param currentState - Current execution state for persistence
     * @returns Promise<BatchResult[]> - Results for each batch
     *
     * @example
     * ```typescript
     * const results = await processor.processFiles(
     *   filePaths,
     *   async (filePath) => {
     *     const content = fs.readFileSync(filePath, 'utf-8');
     *     // Process content
     *     return { findings: [...] };
     *   },
     *   executionState
     * );
     * ```
     */
    processFiles(files: string[], processorFn: (filePath: string) => Promise<FileProcessingResult>, currentState: ExecutionState): Promise<BatchResult[]>;
    /**
     * Processes a single batch of files atomically
     *
     * Each file is processed independently. If a file fails, it's marked
     * as failed but processing continues with the next file. This ensures
     * no files are left "half-processed".
     *
     * @private
     * @param files - Files in this batch
     * @param processorFn - Async function to process each file
     * @param batchNumber - Current batch number
     * @param totalBatches - Total number of batches
     * @param currentState - Current execution state
     * @returns Promise<BatchResult> - Batch processing result
     */
    private processBatch;
    /**
     * Applies thermal protection between batches
     *
     * @private
     * @returns Promise<void>
     */
    private applyThermalProtection;
    /**
     * Adjusts batch size based on system performance
     *
     * If the system is struggling (high CPU/RAM), reduce batch size for
     * subsequent batches to improve stability.
     *
     * @param performanceFactor - Performance factor (0-1, lower is worse)
     * @returns void
     *
     * @example
     * ```typescript
     * processor.adjustBatchSize(0.7); // Reduce batch size to 70% of current
     * ```
     */
    adjustBatchSize(performanceFactor: number): void;
    /**
     * Gets current batch size
     *
     * @returns number - Current batch size
     */
    getBatchSize(): number;
    /**
     * Sets batch size
     *
     * @param size - New batch size
     */
    setBatchSize(size: number): void;
}
export {};
//# sourceMappingURL=batch-processor.d.ts.map