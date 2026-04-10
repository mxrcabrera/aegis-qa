/**
 * Memory Monitor - Memory Usage Enforcement
 *
 * Purpose: Enforces memory limits using process.memoryUsage() to prevent
 * the application from consuming too much memory and crashing.
 *
 * @module core/memory-monitor
 * @since 2.0.0
 */

/**
 * Memory usage statistics
 */
export interface MemoryStats {
  /** RSS (Resident Set Size) in bytes */
  rss: number;
  /** Heap total size in bytes */
  heapTotal: number;
  /** Heap used size in bytes */
  heapUsed: number;
  /** External memory in bytes */
  external: number;
  /** Array buffers in bytes */
  arrayBuffers: number;
  /** Memory usage percentage (0-100) */
  usagePercentage: number;
}

/**
 * Memory monitor configuration
 */
export interface MemoryMonitorConfig {
  /** Maximum memory limit in bytes (default: 2GB) */
  maxMemoryBytes?: number;
  /** Warning threshold percentage (default: 70%) */
  warningThreshold?: number;
  /** Critical threshold percentage (default: 85%) */
  criticalThreshold?: number;
  /** Whether to auto-garbage collect on warning */
  autoGC?: boolean;
  /** Whether to throw error on critical */
  throwOnCritical?: boolean;
  /** Whether to enable graceful degradation on high memory */
  enableGracefulDegradation?: boolean;
  /** Degradation threshold percentage (default: 75%) */
  degradationThreshold?: number;
}

/**
 * Memory Monitor - Memory usage enforcement
 *
 * @class MemoryMonitor
 */
export class MemoryMonitor {
  private config: Required<MemoryMonitorConfig>;
  private warningTriggered: boolean = false;
  private criticalTriggered: boolean = false;
  private degradationTriggered: boolean = false;

  constructor(config: MemoryMonitorConfig = {}) {
    this.config = {
      maxMemoryBytes: config.maxMemoryBytes || 2 * 1024 * 1024 * 1024, // 2GB default
      warningThreshold: config.warningThreshold || 70,
      criticalThreshold: config.criticalThreshold || 85,
      autoGC: config.autoGC ?? true,
      throwOnCritical: config.throwOnCritical ?? false,
      enableGracefulDegradation: config.enableGracefulDegradation ?? true,
      degradationThreshold: config.degradationThreshold || 75,
    };
  }

  /**
   * Gets current memory usage statistics
   *
   * @returns MemoryStats - Memory usage statistics
   */
  getMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    const maxMemory = this.config.maxMemoryBytes;
    const usagePercentage = (usage.rss / maxMemory) * 100;

    return {
      rss: usage.rss,
      heapTotal: usage.heapTotal,
      heapUsed: usage.heapUsed,
      external: usage.external,
      arrayBuffers: (usage as NodeJS.MemoryUsage & { arrayBuffers?: number }).arrayBuffers || 0,
      usagePercentage,
    };
  }

  /**
   * Checks if memory usage exceeds warning threshold
   *
   * @returns boolean - True if warning threshold exceeded
   */
  isWarningThreshold(): boolean {
    const stats = this.getMemoryStats();
    return stats.usagePercentage >= this.config.warningThreshold;
  }

  /**
   * Checks if memory usage exceeds critical threshold
   *
   * @returns boolean - True if critical threshold exceeded
   */
  isCriticalThreshold(): boolean {
    const stats = this.getMemoryStats();
    return stats.usagePercentage >= this.config.criticalThreshold;
  }

  /**
   * Checks memory usage and takes action if thresholds exceeded
   *
   * @returns MemoryStats - Current memory statistics
   */
  checkMemory(): MemoryStats {
    const stats = this.getMemoryStats();

    // Check critical threshold
    if (this.isCriticalThreshold() && !this.criticalTriggered) {
      this.criticalTriggered = true;
      this.handleCriticalMemory(stats);

      if (this.config.throwOnCritical) {
        throw new Error(
          `Critical memory usage: ${stats.usagePercentage.toFixed(1)}% (${this.formatBytes(stats.rss)}) exceeds threshold of ${this.config.criticalThreshold}%`
        );
      }
    }

    // Check degradation threshold
    if (this.isDegradationThreshold() && !this.degradationTriggered && !this.criticalTriggered) {
      this.degradationTriggered = true;
      this.handleDegradationMemory(stats);
    }

    // Check warning threshold
    if (this.isWarningThreshold() && !this.warningTriggered && !this.criticalTriggered) {
      this.warningTriggered = true;
      this.handleWarningMemory(stats);
    }

    // Reset triggers if memory usage drops below threshold
    if (stats.usagePercentage < this.config.warningThreshold - 5) {
      this.warningTriggered = false;
      this.criticalTriggered = false;
      this.degradationTriggered = false;
    }

    return stats;
  }

  /**
   * Checks if memory usage exceeds degradation threshold
   *
   * @returns boolean - True if degradation threshold exceeded
   */
  private isDegradationThreshold(): boolean {
    const stats = this.getMemoryStats();
    return stats.usagePercentage >= this.config.degradationThreshold;
  }

  /**
   * Handles degradation memory threshold (graceful degradation)
   *
   * @private
   * @param stats - Memory statistics
   */
  private handleDegradationMemory(stats: MemoryStats): void {
    console.warn(`[Security] Memory degradation mode: ${stats.usagePercentage.toFixed(1)}% (${this.formatBytes(stats.rss)})`);
    console.warn('[Security] Enabling graceful degradation: reducing parallelism and caching');

    if (this.config.autoGC) {
      this.triggerGarbageCollection();
    }
  }

  /**
   * Wraps an operation with memory checks before and after execution
   *
   * @param operation - Async operation to execute
   * @param operationName - Name of the operation for logging
   * @returns Promise<T> - Result of the operation
   */
  async withMemoryCheck<T>(
    operation: () => Promise<T>,
    operationName: string = 'operation'
  ): Promise<T> {
    // Check memory before operation
    const beforeStats = this.checkMemory();
    console.log(`[Memory] Before ${operationName}: ${beforeStats.usagePercentage.toFixed(1)}% (${this.formatBytes(beforeStats.rss)})`);

    // Check if we should skip operation due to memory pressure
    if (this.isCriticalThreshold()) {
      throw new Error(`[Security] Cannot execute ${operationName}: Critical memory usage (${beforeStats.usagePercentage.toFixed(1)}%)`);
    }

    if (this.isDegradationThreshold() && this.config.enableGracefulDegradation) {
      console.warn(`[Security] Executing ${operationName} in degradation mode (memory at ${beforeStats.usagePercentage.toFixed(1)}%)`);
    }

    try {
      const result = await operation();

      // Check memory after operation
      const afterStats = this.checkMemory();
      const memoryDelta = afterStats.rss - beforeStats.rss;
      console.log(`[Memory] After ${operationName}: ${afterStats.usagePercentage.toFixed(1)}% (${this.formatBytes(afterStats.rss)}) delta: ${this.formatBytes(memoryDelta)}`);

      // If memory increased significantly, trigger GC
      if (memoryDelta > 100 * 1024 * 1024 && this.config.autoGC) { // > 100MB increase
        console.log(`[Memory] Significant memory increase detected (${this.formatBytes(memoryDelta)}), triggering GC`);
        this.triggerGarbageCollection();
      }

      return result;
    } catch (error) {
      // Check memory on error
      const errorStats = this.checkMemory();
      console.error(`[Memory] Error in ${operationName}: ${errorStats.usagePercentage.toFixed(1)}% (${this.formatBytes(errorStats.rss)})`);
      throw error;
    }
  }

  /**
   * Checks if graceful degradation is active
   *
   * @returns boolean - True if in degradation mode
   */
  isInDegradationMode(): boolean {
    return this.degradationTriggered;
  }

  /**
   * Handles warning memory threshold
   *
   * @private
   * @param stats - Memory statistics
   */
  private handleWarningMemory(stats: MemoryStats): void {
    console.warn(`⚠️  Memory usage warning: ${stats.usagePercentage.toFixed(1)}% (${this.formatBytes(stats.rss)})`);

    if (this.config.autoGC) {
      this.triggerGarbageCollection();
    }
  }

  /**
   * Handles critical memory threshold
   *
   * @private
   * @param stats - Memory statistics
   */
  private handleCriticalMemory(stats: MemoryStats): void {
    console.error(`🚨 Critical memory usage: ${stats.usagePercentage.toFixed(1)}% (${this.formatBytes(stats.rss)})`);
    console.error('🚨 Consider reducing workload or increasing memory limit');

    if (this.config.autoGC) {
      this.triggerGarbageCollection();
    }
  }

  /**
   * Triggers garbage collection if available
   *
   * @private
   */
  private triggerGarbageCollection(): void {
    const globalWithGC = global as typeof globalThis & { gc?: () => void };
    if (typeof globalWithGC.gc === 'function') {
      console.log('🧹 Triggering manual garbage collection...');
      globalWithGC.gc!();
      const stats = this.getMemoryStats();
      console.log(`🧹 Memory after GC: ${stats.usagePercentage.toFixed(1)}% (${this.formatBytes(stats.rss)})`);
    } else {
      console.log('🧹 Manual GC not available (run with --expose-gc flag)');
    }
  }

  /**
   * Formats bytes to human-readable format
   *
   * @private
   * @param bytes - Bytes to format
   * @returns string - Formatted string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    const size = bytes / 1024;
    const unitIndex = Math.floor(Math.log(size) / Math.log(1024));
    const unit = units[Math.min(unitIndex, units.length - 1)];
    const value = size / Math.pow(1024, unitIndex);
    return `${value.toFixed(2)} ${unit}`;
  }

  /**
   * Logs current memory usage
   *
   * @param label - Optional label for the log
   */
  logMemoryUsage(label: string = 'Memory'): void {
    const stats = this.getMemoryStats();
    console.log(`[${label}] RSS: ${this.formatBytes(stats.rss)} | Heap: ${this.formatBytes(stats.heapUsed)} / ${this.formatBytes(stats.heapTotal)} (${stats.usagePercentage.toFixed(1)}%)`);
  }

  /**
   * Resets warning/critical triggers
   */
  resetTriggers(): void {
    this.warningTriggered = false;
    this.criticalTriggered = false;
  }

  /**
   * Sets a new maximum memory limit
   *
   * @param bytes - New maximum memory limit in bytes
   */
  setMaxMemory(bytes: number): void {
    this.config.maxMemoryBytes = bytes;
    this.resetTriggers();
  }

  /**
   * Gets the current maximum memory limit
   *
   * @returns number - Maximum memory limit in bytes
   */
  getMaxMemory(): number {
    return this.config.maxMemoryBytes;
  }
}
