/**
 * BatchProcessor - Adaptive Batch Processing with Hardware Protection
 *
 * Purpose: Process files in adaptive batches according to hardware capabilities,
 * ensuring safe operation on systems with varying resources.
 *
 * Architecture: This processor dynamically adjusts batch sizes based on:
 * - Total file count
 * - CPU/RAM usage
 * - GPU temperature (if available)
 * - Hardware tier (high/medium/low)
 *
 * Batch Size Logic:
 * - < 100 files: 1 batch
 * - 100-500 files: batches of 50
 * - 500-1000 files: batches of 30
 * - > 1000 files: batches of 20 + resume capability
 *
 * Adaptive Adjustments:
 * - CPU > 80%: reduce batch size to 10
 * - RAM > 90%: reduce batch size to 5
 * - GPU > 70°C: HALT + cooldown 60s
 *
 * @module processing/batch-processor
 * @since 1.0.0
 */

import { ThermalController } from '../core/thermal-controller.js';
import { SystemResourceMonitor } from '../core/system-resource-monitor.js';
import { StatePersistence } from '../core/state-persistence.js';

/**
 * Batch processing result
 */
interface BatchResult {
  /** Batch number */
  batchNumber: number;
  /** Total batches */
  totalBatches: number;
  /** Files in batch */
  files: string[];
  /** Success status */
  success: boolean;
  /** Results from batch processing */
  results: any[];
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Error if failed */
  error?: string;
}

/**
 * Batch processing configuration
 */
interface BatchProcessorConfig {
  /** Thermal controller for hardware protection */
  thermalController: ThermalController;
  /** System resource monitor for CPU/RAM monitoring */
  systemResourceMonitor: SystemResourceMonitor;
  /** State persistence for resume capability */
  statePersistence: StatePersistence;
  /** Default batch size for small repos */
  defaultBatchSize: number;
  /** Maximum batch size */
  maxBatchSize: number;
  /** Minimum batch size */
  minBatchSize: number;
  /** Whether to enable adaptive batch sizing */
  enableAdaptiveSizing: boolean;
  /** Cooldown duration in milliseconds after each batch */
  batchCooldownMs: number;
}

/**
 * BatchProcessor - Adaptive batch processing with hardware protection
 *
 * This class processes files in adaptive batches, adjusting size based on
 * hardware capabilities and resource usage to ensure safe operation.
 *
 * @class BatchProcessor
 * @example
 * ```typescript
 * const processor = new BatchProcessor(config);
 * const files = ['src/index.ts', 'src/utils.ts', ...];
 * const results = await processor.processBatches(files, async (batch) => {
 *   // Process batch of files
 *   return batch.map(file => analyzeFile(file));
 * });
 * ```
 */
export class BatchProcessor {
  private config: BatchProcessorConfig;
  private currentBatch: number = 0;
  private totalBatches: number = 0;

  constructor(config: BatchProcessorConfig) {
    this.config = config;
  }

  /**
   * Processes files in adaptive batches
   *
   * @param files - Array of file paths to process
   * @param processor - Async function to process each batch
   * @returns Promise<BatchResult[]> - Results from all batches
   */
  async processBatches(
    files: string[],
    processor: (batch: string[], batchNumber: number, totalBatches: number) => Promise<any[]>
  ): Promise<BatchResult[]> {
    const totalFiles = files.length;
    const batchSize = this.calculateBatchSize(totalFiles);
    this.totalBatches = Math.ceil(totalFiles / batchSize);

    console.log(`[BatchProcessor] Processing ${totalFiles} files in ${this.totalBatches} batches of ${batchSize}`);

    const results: BatchResult[] = [];
    this.currentBatch = 0;

    for (let i = 0; i < totalFiles; i += batchSize) {
      this.currentBatch++;
      const batch = files.slice(i, i + batchSize);

      console.log(`[BatchProcessor] Batch ${this.currentBatch}/${this.totalBatches}: ${batch.length} files`);

      // Thermal check before batch
      await this.performThermalCheck();

      // Resource check before batch
      await this.performResourceCheck();

      // Process batch
      const batchResult = await this.processBatch(batch, processor);

      results.push(batchResult);

      // Apply cooldown between batches
      if (this.currentBatch < this.totalBatches) {
        await this.applyBatchCooldown();
      }

      // Save progress for resume capability
      await this.saveProgress(i + batchSize, totalFiles);
    }

    return results;
  }

  /**
   * Calculates optimal batch size based on file count and hardware
   *
   * @private
   * @param totalFiles - Total number of files to process
   * @returns Promise<number> - Optimal batch size
   */
  private async calculateBatchSize(totalFiles: number): Promise<number> {
    let batchSize: number;

    // Base batch size based on file count
    if (totalFiles < 100) {
      batchSize = totalFiles; // 1 batch
    } else if (totalFiles < 500) {
      batchSize = 50;
    } else if (totalFiles < 1000) {
      batchSize = 30;
    } else {
      batchSize = 20;
    }

    // Adaptive adjustment based on hardware if enabled
    if (this.config.enableAdaptiveSizing) {
      const adjustedSize = await this.adjustBatchSizeForHardware(batchSize);
      batchSize = adjustedSize;
    }

    // Clamp to min/max limits
    return Math.max(this.config.minBatchSize, Math.min(this.config.maxBatchSize, batchSize));
  }

  /**
   * Adjusts batch size based on current hardware state
   *
   * @private
   * @param baseSize - Base batch size
   * @returns Promise<number> - Adjusted batch size
   */
  private async adjustBatchSizeForHardware(baseSize: number): Promise<number> {
    let adjustedSize = baseSize;

    try {
      // Check system resources
      const resources = await this.config.thermalController.checkSystemResources();

      // Reduce batch size if CPU is high
      if (resources.cpuUsage > 80) {
        adjustedSize = Math.min(adjustedSize, 10);
        console.warn(`[BatchProcessor] CPU high (${resources.cpuUsage}%), reducing batch to ${adjustedSize}`);
      }

      // Reduce batch size if RAM is critical
      if (resources.ramUsage > 90) {
        adjustedSize = Math.min(adjustedSize, 5);
        console.warn(`[BatchProcessor] RAM critical (${resources.ramUsage}%), reducing batch to ${adjustedSize}`);
      }

      // Check GPU temperature if available
      try {
        const tempReading = await this.config.thermalController.checkTemperature();
        if (tempReading.current > 70) {
          console.warn(`[BatchProcessor] GPU temperature critical (${tempReading.current}°C), applying cooldown`);
          await this.config.thermalController.applyCooldown(60000); // 60s cooldown
          adjustedSize = Math.min(adjustedSize, 5);
        }
      } catch (error) {
        // GPU check failed, continue without GPU monitoring
      }
    } catch (error) {
      console.warn('Failed to adjust batch size for hardware:', error instanceof Error ? error.message : error);
    }

    return adjustedSize;
  }

  /**
   * Processes a single batch
   *
   * @private
   * @param batch - Files in batch
   * @param processor - Async function to process batch
   * @returns Promise<BatchResult> - Batch result
   */
  private async processBatch(
    batch: string[],
    processor: (batch: string[], batchNumber: number, totalBatches: number) => Promise<any[]>
  ): Promise<BatchResult> {
    const startTime = Date.now();

    try {
      const results = await processor(batch, this.currentBatch, this.totalBatches);
      const executionTimeMs = Date.now() - startTime;

      const result: BatchResult = {
        batchNumber: this.currentBatch,
        totalBatches: this.totalBatches,
        files: batch,
        success: true,
        results,
        executionTimeMs,
      };

      console.log(`[BatchProcessor] Batch ${this.currentBatch}/${this.totalBatches} complete in ${executionTimeMs / 1000}s`);
      return result;
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;

      const result: BatchResult = {
        batchNumber: this.currentBatch,
        totalBatches: this.totalBatches,
        files: batch,
        success: false,
        results: [],
        executionTimeMs,
        error: error instanceof Error ? error.message : String(error),
      };

      console.error(`[BatchProcessor] Batch ${this.currentBatch}/${this.totalBatches} failed: ${result.error}`);
      return result;
    }
  }

  /**
   * Performs thermal check before batch processing
   *
   * @private
   * @returns Promise<void>
   */
  private async performThermalCheck(): Promise<void> {
    try {
      const resources = await this.config.thermalController.checkSystemResources();

      if (resources.category === 'critical') {
        console.warn(`[BatchProcessor] Resources critical: CPU ${resources.cpuUsage}%, RAM ${resources.ramUsage}%`);
        await this.config.thermalController.applyAdaptiveCooldown('high');
      } else if (resources.category === 'warning') {
        console.warn(`[BatchProcessor] Resources elevated: CPU ${resources.cpuUsage}%, RAM ${resources.ramUsage}%`);
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }
    } catch (error) {
      console.warn('Failed thermal check:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Performs resource check before batch processing
   *
   * @private
   * @returns Promise<void>
   */
  private async performResourceCheck(): Promise<void> {
    try {
      const isSafe = await this.config.systemResourceMonitor.isSafe();

      if (!isSafe) {
        console.warn('[BatchProcessor] System resources not safe, applying cooldown');
        await this.config.thermalController.applyAdaptiveCooldown('medium');
      }
    } catch (error) {
      console.warn('Failed resource check:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Applies cooldown between batches
   *
   * @private
   * @returns Promise<void>
   */
  private async applyBatchCooldown(): Promise<void> {
    if (this.config.batchCooldownMs > 0) {
      console.log(`[BatchProcessor] Applying batch cooldown: ${this.config.batchCooldownMs / 1000}s`);
      await new Promise<void>((resolve) => setTimeout(resolve, this.config.batchCooldownMs));
    }
  }

  /**
   * Saves progress for resume capability
   *
   * @private
   * @param filesProcessed - Number of files processed
   * @param totalFiles - Total number of files
   * @returns Promise<void>
   */
  private async saveProgress(filesProcessed: number, totalFiles: number): Promise<void> {
    try {
      await this.config.statePersistence.updateFileProgress(filesProcessed, totalFiles);
    } catch (error) {
      console.warn('Failed to save progress:', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Gets current batch number
   *
   * @returns number - Current batch number
   */
  getCurrentBatch(): number {
    return this.currentBatch;
  }

  /**
   * Gets total batch count
   *
   * @returns number - Total batch count
   */
  getTotalBatches(): number {
    return this.totalBatches;
  }

  /**
   * Gets current configuration
   *
   * @returns BatchProcessorConfig - Current configuration
   */
  getConfig(): BatchProcessorConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<BatchProcessorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
