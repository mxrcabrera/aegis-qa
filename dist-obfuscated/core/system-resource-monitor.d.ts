/**
 * SystemResourceMonitor - CPU/RAM Monitoring for Non-GPU Systems
 *
 * Purpose: Monitor CPU and RAM usage for systems without GPU, providing
 * hardware protection and resource management capabilities.
 *
 * Architecture: This monitor works alongside ThermalController to provide
 * comprehensive hardware protection for systems without dedicated GPUs.
 *
 * Safety Thresholds:
 * - CPU WARNING: 80% - System will reduce batch size
 * - CPU CRITICAL: 90% - System will halt execution
 * - RAM WARNING: 85% - System will reduce batch size
 * - RAM CRITICAL: 90% - System will serialize state to disk
 *
 * Docker Awareness:
 * - Detects if running in a Docker container
 * - Uses cgroup memory limits instead of host memory
 * - Calculates RAM percentage relative to container limit
 *
 * @module core/system-resource-monitor
 * @since 1.0.0
 */
import { EventEmitter } from 'events';
/**
 * Resource reading snapshot
 */
interface ResourceReading {
    /** CPU usage percentage (0-100) */
    cpuUsage: number;
    /** RAM usage percentage (0-100) */
    ramUsage: number;
    /** Available RAM in GB */
    ramAvailable: number;
    /** Total RAM in GB */
    ramTotal: number;
    /** Timestamp of reading */
    timestamp: number;
}
/**
 * Resource usage history entry
 */
interface ResourceHistoryEntry {
    /** Average CPU usage over period */
    avgCpuUsage: number;
    /** Average RAM usage over period */
    avgRamUsage: number;
    /** Peak CPU usage over period */
    peakCpuUsage: number;
    /** Peak RAM usage over period */
    peakRamUsage: number;
    /** Duration of period in milliseconds */
    durationMs: number;
    /** Timestamp of period start */
    timestamp: number;
}
/**
 * SystemResourceMonitor configuration
 */
interface ResourceMonitorConfig {
    /** CPU warning threshold percentage (default: 80) */
    cpuWarningThreshold: number;
    /** CPU critical threshold percentage (default: 90) */
    cpuCriticalThreshold: number;
    /** RAM warning threshold percentage (default: 85) */
    ramWarningThreshold: number;
    /** RAM critical threshold percentage (default: 90) */
    ramCriticalThreshold: number;
    /** History retention period in milliseconds (default: 1 hour) */
    historyRetentionMs: number;
    /** Monitoring interval in milliseconds (default: 5000) */
    monitoringIntervalMs: number;
}
/**
 * SystemResourceMonitor - CPU/RAM monitoring for non-GPU systems
 *
 * This class provides continuous monitoring of CPU and RAM usage, maintaining
 * usage history and emitting alerts when thresholds are exceeded.
 *
 * @class SystemResourceMonitor
 * @example
 * ```typescript
 * const monitor = new SystemResourceMonitor();
 * monitor.on('alert', (alert) => console.log(alert.type));
 * await monitor.start();
 * const reading = await monitor.getCurrentReading();
 * console.log(`CPU: ${reading.cpuUsage}%, RAM: ${reading.ramUsage}%`);
 * await monitor.stop();
 * ```
 */
export declare class SystemResourceMonitor extends EventEmitter {
    private config;
    private isMonitoring;
    private monitoringInterval;
    private history;
    private aggregatedHistory;
    private isDocker;
    private dockerMemoryLimit;
    constructor(config?: Partial<ResourceMonitorConfig>);
    /**
     * Starts continuous resource monitoring
     *
     * @returns Promise<void>
     */
    start(): Promise<void>;
    /**
     * Stops resource monitoring
     *
     * @returns Promise<void>
     */
    stop(): Promise<void>;
    /**
     * Gets current resource reading
     *
     * @returns Promise<ResourceReading> - Current resource snapshot
     */
    getCurrentReading(): Promise<ResourceReading>;
    /**
     * Gets usage history for pattern analysis
     *
     * @param durationMs - Duration of history to retrieve (default: retention period)
     * @returns ResourceHistoryEntry[] - Aggregated history entries
     */
    getHistory(durationMs?: number): ResourceHistoryEntry[];
    /**
     * Checks if current resources are safe for intensive operations
     *
     * @returns Promise<boolean> - True if resources are safe
     */
    isSafe(): Promise<boolean>;
    /**
     * Collects a single resource reading and checks thresholds
     *
     * @private
     * @returns Promise<ResourceReading> - Collected reading
     */
    private collectReading;
    /**
     * Checks if resource thresholds are exceeded and emits alerts
     *
     * @private
     * @param reading - Current resource reading
     */
    private checkThresholds;
    /**
     * Cleans up old history entries
     *
     * @private
     */
    private cleanupHistory;
    /**
     * Aggregates history readings into summary entries
     *
     * @private
     */
    private aggregateHistory;
    /**
     * Gets current CPU usage percentage
     *
     * @private
     * @returns Promise<number> - CPU usage percentage (0-100)
     */
    private getCPUUsage;
    /**
     * Gets total RAM in GB
     *
     * @private
     * @returns Promise<number> - Total RAM in GB
     */
    private getRAMTotal;
    /**
     * Detects if running in a Docker container
     *
     * Checks for:
     * - /.dockerenv file (Docker-specific marker)
     * - /proc/1/cgroup containing Docker or containerd references
     *
     * @private
     * @returns boolean - True if running in Docker
     */
    private detectDocker;
    /**
     * Gets Docker container memory limit from cgroups
     *
     * Reads from /sys/fs/cgroup/memory/memory.limit_in_bytes
     *
     * @private
     * @returns number | null - Memory limit in bytes, or null if not available
     */
    private getDockerMemoryLimit;
    /**
     * Gets current RAM usage percentage
     *
     * @private
     * @returns Promise<number> - RAM usage percentage (0-100)
     */
    private getRAMUsage;
    /**
     * Gets available RAM in GB
     *
     * @private
     * @returns Promise<number> - Available RAM in GB
     */
    private getRAMAvailable;
    /**
     * Gets current configuration
     *
     * @returns ResourceMonitorConfig - Current configuration
     */
    getConfig(): ResourceMonitorConfig;
    /**
     * Updates configuration
     *
     * @param config - Partial configuration to update
     */
    updateConfig(config: Partial<ResourceMonitorConfig>): void;
}
export {};
//# sourceMappingURL=system-resource-monitor.d.ts.map