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
  findings?: any[];
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
export class BatchProcessor {
  private config: BatchProcessorConfig;
  private batchSize: number;

  constructor(config: BatchProcessorConfig) {
    this.config = config;
    
    // Use recommended values or defaults
    this.batchSize = config.recommendedBatchSize || 20;
  }

  /**
   * Prioritizes files based on critical modules when resources are limited
   *
   * @private
   * @param files - Array of file paths
   * @returns Prioritized array of file paths
   */
  private prioritizeFiles(files: string[]): string[] {
    if (!this.config.criticalModules || this.config.criticalModules.length === 0) {
      return files;
    }

    const criticalSet = new Set(this.config.criticalModules);
    
    // Separate critical and non-critical files
    const criticalFiles: string[] = [];
    const nonCriticalFiles: string[] = [];

    for (const file of files) {
      if (criticalSet.has(file)) {
        criticalFiles.push(file);
      } else {
        nonCriticalFiles.push(file);
      }
    }

    console.log(`[BatchProcessor] ­ƒÄ» Smart Scoping: ${criticalFiles.length} critical modules prioritized, ${nonCriticalFiles.length} non-critical files deferred`);
    
    // Return critical files first, then non-critical
    return [...criticalFiles, ...nonCriticalFiles];
  }

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
  async processFiles(
    files: string[],
    processorFn: (filePath: string) => Promise<FileProcessingResult>,
    currentState: ExecutionState
  ): Promise<BatchResult[]> {
    // Check if resources are limited for smart scoping
    let prioritizedFiles = files;
    let resourcesLimited = false;
    
    try {
      const resources = await this.config.thermalController.checkSystemResources();
      // If thermal controller indicates high or critical load, enable smart scoping
      resourcesLimited = resources.category === 'warning' || resources.category === 'critical';
    } catch {
      // If thermal check fails, assume resources are limited to be safe
      resourcesLimited = true;
    }
    
    // Apply smart scoping: prioritize critical modules only when resources are limited
    if (resourcesLimited) {
      prioritizedFiles = this.prioritizeFiles(files);
      console.log(`[BatchProcessor] ??  Resources limited - prioritizing ${this.config.criticalModules?.length || 0} critical modules`);
    }
    
    const totalBatches = Math.ceil(prioritizedFiles.length / this.batchSize);
    const results: BatchResult[] = [];

    console.log(`[BatchProcessor] Processing ${prioritizedFiles.length} files in ${totalBatches} batches (batch size: ${this.batchSize})`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const batchNumber = batchIndex + 1;
      const startIndex = batchIndex * this.batchSize;
      const endIndex = Math.min(startIndex + this.batchSize, prioritizedFiles.length);
      const batchFiles = prioritizedFiles.slice(startIndex, endIndex);

      console.log(`[BatchProcessor] Batch ${batchNumber}/${totalBatches}: Processing ${batchFiles.length} files`);

      const batchResult = await this.processBatch(
        batchFiles,
        processorFn,
        batchNumber,
        totalBatches,
        currentState
      );

      results.push(batchResult);

      // Thermal check and cooldown between batches
      if (this.config.applyCooldowns) {
        await this.applyThermalProtection();
      }

      // Save state after each batch
      await this.config.statePersistence.saveState(currentState);
    }

    console.log(`[BatchProcessor] All batches complete. Total findings: ${results.reduce((sum, r) => sum + r.totalFindings, 0)}`);

    return results;
  }

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
  private async processBatch(
    files: string[],
    processorFn: (filePath: string) => Promise<FileProcessingResult>,
    batchNumber: number,
    totalBatches: number,
    currentState: ExecutionState
  ): Promise<BatchResult> {
    const startTime = Date.now();
    let successCount = 0;
    let failureCount = 0;
    let totalFindings = 0;

    for (const filePath of files) {
      try {
        // Check if file was already processed (resume scenario)
        const alreadyProcessed = currentState.files.find((f: { filePath: string; processed: boolean }) => f.filePath === filePath && f.processed);
        if (alreadyProcessed) {
          console.log(`[BatchProcessor] Skipping already processed file: ${filePath}`);
          successCount++;
          continue;
        }

        // Process file atomically
        const result = await processorFn(filePath);

        // Record file processing state
        await this.config.statePersistence.recordFile(
          filePath,
          result.success,
          result.error,
          currentState
        );

        if (result.success) {
          successCount++;
          if (result.findings) {
            totalFindings += result.findings.length;
          }
        } else {
          failureCount++;
        }
      } catch (error) {
        // Record file processing failure
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        await this.config.statePersistence.recordFile(
          filePath,
          false,
          errorMessage,
          currentState
        );

        failureCount++;
        console.error(`[BatchProcessor] Failed to process ${filePath}: ${errorMessage}`);
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      batchNumber,
      totalBatches,
      fileCount: files.length,
      successCount,
      failureCount,
      totalFindings,
      executionTimeMs,
    };
  }

  /**
   * Applies thermal protection between batches
   *
   * @private
   * @returns Promise<void>
   */
  private async applyThermalProtection(): Promise<void> {
    try {
      // Check system resources
      await this.config.thermalController.checkSystemResources();
      
      // Apply adaptive cooldown based on batch intensity
      await this.config.thermalController.applyAdaptiveCooldown('medium');
    } catch (error) {
      console.warn('[BatchProcessor] Thermal protection check failed:', error instanceof Error ? error.message : error);
      // Continue even if thermal check fails - don't halt execution
    }
  }

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
  adjustBatchSize(performanceFactor: number): void {
    if (performanceFactor < 0.3) {
      // Severe performance degradation
      this.batchSize = Math.max(5, Math.floor(this.batchSize * 0.5));
      console.log(`[BatchProcessor] Reduced batch size to ${this.batchSize} due to poor performance`);
    } else if (performanceFactor < 0.7) {
      // Moderate performance degradation
      this.batchSize = Math.max(10, Math.floor(this.batchSize * 0.75));
      console.log(`[BatchProcessor] Reduced batch size to ${this.batchSize} due to moderate performance`);
    }
  }

  /**
   * Gets current batch size
   *
   * @returns number - Current batch size
   */
  getBatchSize(): number {
    return this.batchSize;
  }

  /**
   * Sets batch size
   *
   * @param size - New batch size
   */
  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, size);
    console.log(`[BatchProcessor] Batch size set to ${this.batchSize}`);
  }
}

