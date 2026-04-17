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
import * as fs from 'fs';

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
export class SystemResourceMonitor extends EventEmitter {
  private config: ResourceMonitorConfig;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private history: ResourceReading[] = [];
  private aggregatedHistory: ResourceHistoryEntry[] = [];
  private isDocker: boolean = false;
  private dockerMemoryLimit: number | null = null;

  constructor(config?: Partial<ResourceMonitorConfig>) {
    super();
    this.config = {
      cpuWarningThreshold: 80,
      cpuCriticalThreshold: 90,
      ramWarningThreshold: 85,
      ramCriticalThreshold: 90,
      historyRetentionMs: 3600000, // 1 hour
      monitoringIntervalMs: 5000, // 5 seconds
      ...config,
    };

    // Detect Docker environment on initialization
    this.isDocker = this.detectDocker();
    if (this.isDocker) {
      this.dockerMemoryLimit = this.getDockerMemoryLimit();
      console.log('[SystemResourceMonitor] Docker container detected. Using cgroup memory limits.');
    }
  }

  /**
   * Starts continuous resource monitoring
   *
   * @returns Promise<void>
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      console.warn('SystemResourceMonitor is already running');
      return;
    }

    this.isMonitoring = true;
    console.log('[SystemResourceMonitor] Starting resource monitoring');

    this.monitoringInterval = setInterval(async () => {
      await this.collectReading();
    }, this.config.monitoringIntervalMs);

    // Initial reading
    await this.collectReading();
  }

  /**
   * Stops resource monitoring
   *
   * @returns Promise<void>
   */
  async stop(): Promise<void> {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    console.log('[SystemResourceMonitor] Stopping resource monitoring');

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Gets current resource reading
   *
   * @returns Promise<ResourceReading> - Current resource snapshot
   */
  async getCurrentReading(): Promise<ResourceReading> {
    return this.collectReading();
  }

  /**
   * Gets usage history for pattern analysis
   *
   * @param durationMs - Duration of history to retrieve (default: retention period)
   * @returns ResourceHistoryEntry[] - Aggregated history entries
   */
  getHistory(durationMs?: number): ResourceHistoryEntry[] {
    const retentionPeriod = durationMs || this.config.historyRetentionMs;
    const cutoffTime = Date.now() - retentionPeriod;

    // Filter and return aggregated history
    return this.aggregatedHistory.filter((entry) => entry.timestamp >= cutoffTime);
  }

  /**
   * Checks if current resources are safe for intensive operations
   *
   * @returns Promise<boolean> - True if resources are safe
   */
  async isSafe(): Promise<boolean> {
    const reading = await this.getCurrentReading();
    return (
      reading.cpuUsage < this.config.cpuWarningThreshold &&
      reading.ramUsage < this.config.ramWarningThreshold
    );
  }

  /**
   * Collects a single resource reading and checks thresholds
   *
   * @private
   * @returns Promise<ResourceReading> - Collected reading
   */
  private async collectReading(): Promise<ResourceReading> {
    const reading: ResourceReading = {
      cpuUsage: await this.getCPUUsage(),
      ramUsage: await this.getRAMUsage(),
      ramAvailable: await this.getRAMAvailable(),
      ramTotal: await this.getRAMTotal(),
      timestamp: Date.now(),
    };

    // Add to history
    this.history.push(reading);
    this.cleanupHistory();

    // Check thresholds and emit alerts
    this.checkThresholds(reading);

    // Aggregate history periodically
    if (this.history.length % 12 === 0) {
      this.aggregateHistory();
    }

    return reading;
  }

  /**
   * Checks if resource thresholds are exceeded and emits alerts
   *
   * @private
   * @param reading - Current resource reading
   */
  private checkThresholds(reading: ResourceReading): void {
    // CPU checks
    if (reading.cpuUsage >= this.config.cpuCriticalThreshold) {
      this.emit('alert', {
        type: 'cpu-critical',
        currentValue: reading.cpuUsage,
        threshold: this.config.cpuCriticalThreshold,
        timestamp: reading.timestamp,
      });
    } else if (reading.cpuUsage >= this.config.cpuWarningThreshold) {
      this.emit('alert', {
        type: 'cpu-warning',
        currentValue: reading.cpuUsage,
        threshold: this.config.cpuWarningThreshold,
        timestamp: reading.timestamp,
      });
    }

    // RAM checks
    if (reading.ramUsage >= this.config.ramCriticalThreshold) {
      this.emit('alert', {
        type: 'ram-critical',
        currentValue: reading.ramUsage,
        threshold: this.config.ramCriticalThreshold,
        timestamp: reading.timestamp,
      });
    } else if (reading.ramUsage >= this.config.ramWarningThreshold) {
      this.emit('alert', {
        type: 'ram-warning',
        currentValue: reading.ramUsage,
        threshold: this.config.ramWarningThreshold,
        timestamp: reading.timestamp,
      });
    }
  }

  /**
   * Cleans up old history entries
   *
   * @private
   */
  private cleanupHistory(): void {
    const cutoffTime = Date.now() - this.config.historyRetentionMs;
    this.history = this.history.filter((entry) => entry.timestamp >= cutoffTime);
    this.aggregatedHistory = this.aggregatedHistory.filter((entry) => entry.timestamp >= cutoffTime);
  }

  /**
   * Aggregates history readings into summary entries
   *
   * @private
   */
  private aggregateHistory(): void {
    if (this.history.length < 2) {
      return;
    }

    const recentHistory = this.history.slice(-12); // Last 12 readings (~1 minute)
    const cpuUsages = recentHistory.map((r) => r.cpuUsage);
    const ramUsages = recentHistory.map((r) => r.ramUsage);

    const entry: ResourceHistoryEntry = {
      avgCpuUsage: cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length,
      avgRamUsage: ramUsages.reduce((a, b) => a + b, 0) / ramUsages.length,
      peakCpuUsage: Math.max(...cpuUsages),
      peakRamUsage: Math.max(...ramUsages),
      durationMs: recentHistory[recentHistory.length - 1].timestamp - recentHistory[0].timestamp,
      timestamp: recentHistory[0].timestamp,
    };

    this.aggregatedHistory.push(entry);
  }

  /**
   * Gets current CPU usage percentage
   *
   * @private
   * @returns Promise<number> - CPU usage percentage (0-100)
   */
  private async getCPUUsage(): Promise<number> {
    try {
      const os = require('os');
      const cpus = os.cpus();
      
      // Calculate average CPU usage across all cores
      let totalUsage = 0;
      for (const cpuInfo of cpus) {
        const times = cpuInfo.times;
        const total = times.user + times.nice + times.sys + times.idle + times.irq;
        const idle = times.idle;
        const usage = ((total - idle) / total) * 100;
        totalUsage += usage;
      }
      
      // Average across all cores to get system-wide CPU usage
      const averageUsage = totalUsage / cpus.length;
      
      return Math.round(averageUsage);
    } catch (error) {
      console.warn('Failed to get CPU usage:', error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * Gets total RAM in GB
   *
   * @private
   * @returns Promise<number> - Total RAM in GB
   */
  private async getRAMTotal(): Promise<number> {
    try {
      // Use Docker memory limit if in container
      if (this.isDocker && this.dockerMemoryLimit !== null) {
        return Math.round(this.dockerMemoryLimit / (1024 * 1024 * 1024));
      }

      const os = require('os');
      const totalMemory = os.totalmem();
      return Math.round(totalMemory / (1024 * 1024 * 1024));
    } catch (error) {
      console.warn('Failed to get total RAM:', error instanceof Error ? error.message : error);
      return 8;
    }
  }

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
  private detectDocker(): boolean {
    try {
      // Check for /.dockerenv file
      if (fs.existsSync('/.dockerenv')) {
        return true;
      }

      // Check /proc/1/cgroup for Docker/containerd references
      if (fs.existsSync('/proc/1/cgroup')) {
        const cgroupContent = fs.readFileSync('/proc/1/cgroup', 'utf-8');
        if (cgroupContent.includes('docker') || cgroupContent.includes('containerd') || cgroupContent.includes('kubepods')) {
          return true;
        }
      }

      return false;
    } catch {
      // If we can't check, assume not in Docker
      return false;
    }
  }

  /**
   * Gets Docker container memory limit from cgroups
   *
   * Reads from /sys/fs/cgroup/memory/memory.limit_in_bytes
   *
   * @private
   * @returns number | null - Memory limit in bytes, or null if not available
   */
  private getDockerMemoryLimit(): number | null {
    try {
      // Try cgroup v2 path first
      const cgroupV2Path = '/sys/fs/cgroup/memory.max';
      if (fs.existsSync(cgroupV2Path)) {
        const limit = fs.readFileSync(cgroupV2Path, 'utf-8').trim();
        // 'max' means unlimited
        if (limit === 'max') {
          return null;
        }
        return parseInt(limit, 10);
      }

      // Try cgroup v1 path
      const cgroupV1Path = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
      if (fs.existsSync(cgroupV1Path)) {
        const limit = fs.readFileSync(cgroupV1Path, 'utf-8').trim();
        return parseInt(limit, 10);
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Gets current RAM usage percentage
   *
   * @private
   * @returns Promise<number> - RAM usage percentage (0-100)
   */
  private async getRAMUsage(): Promise<number> {
    try {
      const os = require('os');
      let totalMemory: number;
      let freeMemory: number;

      // Use Docker memory limit if in container
      if (this.isDocker && this.dockerMemoryLimit !== null) {
        totalMemory = this.dockerMemoryLimit;
        // Get memory usage from cgroup
        const memoryUsagePath = '/sys/fs/cgroup/memory/memory.usage_in_bytes';
        const memoryUsageV2Path = '/sys/fs/cgroup/memory.current';

        if (fs.existsSync(memoryUsageV2Path)) {
          const usedMemory = parseInt(fs.readFileSync(memoryUsageV2Path, 'utf-8').trim(), 10);
          freeMemory = totalMemory - usedMemory;
        } else if (fs.existsSync(memoryUsagePath)) {
          const usedMemory = parseInt(fs.readFileSync(memoryUsagePath, 'utf-8').trim(), 10);
          freeMemory = totalMemory - usedMemory;
        } else {
          // Fallback to os.freemem()
          freeMemory = os.freemem();
        }
      } else {
        totalMemory = os.totalmem();
        freeMemory = os.freemem();
      }

      const usedMemory = totalMemory - freeMemory;
      const usagePercent = (usedMemory / totalMemory) * 100;

      return Math.round(usagePercent);
    } catch (error) {
      console.warn('Failed to get RAM usage:', error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * Gets available RAM in GB
   *
   * @private
   * @returns Promise<number> - Available RAM in GB
   */
  private async getRAMAvailable(): Promise<number> {
    try {
      const os = require('os');
      let availableMemory: number;

      // Use Docker memory limit if in container
      if (this.isDocker && this.dockerMemoryLimit !== null) {
        const memoryUsagePath = '/sys/fs/cgroup/memory/memory.usage_in_bytes';
        const memoryUsageV2Path = '/sys/fs/cgroup/memory.current';

        if (fs.existsSync(memoryUsageV2Path)) {
          const usedMemory = parseInt(fs.readFileSync(memoryUsageV2Path, 'utf-8').trim(), 10);
          availableMemory = this.dockerMemoryLimit - usedMemory;
        } else if (fs.existsSync(memoryUsagePath)) {
          const usedMemory = parseInt(fs.readFileSync(memoryUsagePath, 'utf-8').trim(), 10);
          availableMemory = this.dockerMemoryLimit - usedMemory;
        } else {
          // Fallback to os.freemem()
          availableMemory = os.freemem();
        }
      } else {
        availableMemory = os.freemem();
      }

      return Math.round(availableMemory / (1024 * 1024 * 1024));
    } catch (error) {
      console.warn('Failed to get available RAM:', error instanceof Error ? error.message : error);
      return 8;
    }
  }

  /**
   * Gets current configuration
   *
   * @returns ResourceMonitorConfig - Current configuration
   */
  getConfig(): ResourceMonitorConfig {
    return { ...this.config };
  }

  /**
   * Updates configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<ResourceMonitorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }
}
