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
export declare class MemoryMonitor {
    private config;
    private warningTriggered;
    private criticalTriggered;
    private degradationTriggered;
    constructor(config?: MemoryMonitorConfig);
    /**
     * Gets current memory usage statistics
     *
     * @returns MemoryStats - Memory usage statistics
     */
    getMemoryStats(): MemoryStats;
    /**
     * Checks if memory usage exceeds warning threshold
     *
     * @returns boolean - True if warning threshold exceeded
     */
    isWarningThreshold(): boolean;
    /**
     * Checks if memory usage exceeds critical threshold
     *
     * @returns boolean - True if critical threshold exceeded
     */
    isCriticalThreshold(): boolean;
    /**
     * Checks memory usage and takes action if thresholds exceeded
     *
     * @returns MemoryStats - Current memory statistics
     */
    checkMemory(): MemoryStats;
    /**
     * Checks if memory usage exceeds degradation threshold
     *
     * @returns boolean - True if degradation threshold exceeded
     */
    private isDegradationThreshold;
    /**
     * Handles degradation memory threshold (graceful degradation)
     *
     * @private
     * @param stats - Memory statistics
     */
    private handleDegradationMemory;
    /**
     * Wraps an operation with memory checks before and after execution
     *
     * @param operation - Async operation to execute
     * @param operationName - Name of the operation for logging
     * @returns Promise<T> - Result of the operation
     */
    withMemoryCheck<T>(operation: () => Promise<T>, operationName?: string): Promise<T>;
    /**
     * Checks if graceful degradation is active
     *
     * @returns boolean - True if in degradation mode
     */
    isInDegradationMode(): boolean;
    /**
     * Handles warning memory threshold
     *
     * @private
     * @param stats - Memory statistics
     */
    private handleWarningMemory;
    /**
     * Handles critical memory threshold
     *
     * @private
     * @param stats - Memory statistics
     */
    private handleCriticalMemory;
    /**
     * Triggers garbage collection if available
     *
     * @private
     */
    private triggerGarbageCollection;
    /**
     * Formats bytes to human-readable format
     *
     * @private
     * @param bytes - Bytes to format
     * @returns string - Formatted string
     */
    private formatBytes;
    /**
     * Logs current memory usage
     *
     * @param label - Optional label for the log
     */
    logMemoryUsage(label?: string): void;
    /**
     * Resets warning/critical triggers
     */
    resetTriggers(): void;
    /**
     * Sets a new maximum memory limit
     *
     * @param bytes - New maximum memory limit in bytes
     */
    setMaxMemory(bytes: number): void;
    /**
     * Gets the current maximum memory limit
     *
     * @returns number - Maximum memory limit in bytes
     */
    getMaxMemory(): number;
}
//# sourceMappingURL=memory-monitor.d.ts.map