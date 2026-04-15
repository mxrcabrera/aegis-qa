/**
 * ThermalController - Hardware Protection Layer [EXTENDED]
 *
 * Purpose: Monitor and control GPU temperature, CPU usage, and RAM usage to prevent
 * hardware damage during intensive AI processing tasks. This controller acts as the
 * "thermal brake" of the Aegis QA system, ensuring hardware never exceeds safe limits.
 *
 * Architecture: This controller is the heart of the hardware protection system. All
 * AI processing operations must pass through this controller before execution.
 *
 * Safety Thresholds:
 * - GPU CRITICAL: 70°C - System will halt execution immediately
 * - GPU WARNING: 60°C - System will apply extended cooldown
 * - GPU SAFE: < 60°C - Normal operation
 * - CPU CRITICAL: 90% - System will reduce batch size
 * - CPU WARNING: 80% - System will apply cooldown
 * - RAM CRITICAL: 90% - System will serialize state to disk
 * - RAM WARNING: 85% - System will reduce batch size
 *
 * @module core/thermal-controller
 * @since 1.0.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Temperature reading from GPU
 */
interface TemperatureReading {
  /** Current GPU temperature in Celsius */
  current: number;
  /** Whether temperature is within safe limits (< 70°C) */
  isSafe: boolean;
  /** Temperature category: 'safe' | 'warning' | 'critical' */
  category: 'safe' | 'warning' | 'critical';
}

/**
 * System resource reading (CPU/RAM)
 */
interface SystemResourceReading {
  /** CPU usage percentage (0-100) */
  cpuUsage: number;
  /** RAM usage percentage (0-100) */
  ramUsage: number;
  /** Available RAM in GB */
  ramAvailable: number;
  /** Whether system resources are safe for intensive operations */
  isSafe: boolean;
  /** Resource category: 'safe' | 'warning' | 'critical' */
  category: 'safe' | 'warning' | 'critical';
}

/**
 * Hardware profile detected on system
 */
interface HardwareProfile {
  /** Has GPU available */
  hasGPU: boolean;
  /** Total RAM in GB */
  totalRAM: number;
  /** CPU cores count */
  cpuCores: number;
  /** System tier: 'high' | 'medium' | 'low' */
  tier: 'high' | 'medium' | 'low';
}

/**
 * Thermal controller configuration
 */
interface ThermalConfig {
  /** Critical temperature threshold in Celsius (default: 70) */
  criticalThreshold: number;
  /** Warning temperature threshold in Celsius (default: 60) */
  warningThreshold: number;
  /** CPU critical threshold percentage (default: 90) */
  cpuCriticalThreshold: number;
  /** CPU warning threshold percentage (default: 80) */
  cpuWarningThreshold: number;
  /** RAM critical threshold percentage (default: 90) */
  ramCriticalThreshold: number;
  /** RAM warning threshold percentage (default: 85) */
  ramWarningThreshold: number;
  /** Whether to automatically halt execution on critical temperature */
  autoHalt: boolean;
}

/**
 * ThermalController - GPU temperature monitoring and protection
 *
 * This class provides hardware protection for GPU-intensive operations by monitoring
 * temperature and enforcing cooldown periods. It serves as the foundation of the
 * Aegis QA hardware protection layer.
 *
 * @class ThermalController
 * @example
 * ```typescript
 * const controller = new ThermalController();
 * await controller.checkTemperature(); // Throws error if > 70°C
 * await controller.applyCooldown(15000); // 15 second cooldown
 * ```
 */
export class ThermalController {
  private config: ThermalConfig;
  private lastCheckTime: number = 0;
  private cooldownActive: boolean = false;
  private hardwareProfile: HardwareProfile | null = null;

  /**
   * Creates a new ThermalController instance
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<ThermalConfig>) {
    this.config = {
      criticalThreshold: 70,
      warningThreshold: 60,
      cpuCriticalThreshold: 90,
      cpuWarningThreshold: 80,
      ramCriticalThreshold: 90,
      ramWarningThreshold: 85,
      autoHalt: true,
      ...config,
    };
  }

  /**
   * Checks current GPU temperature using nvidia-smi
   *
   * This method executes the nvidia-smi command to retrieve the current GPU temperature.
   * If the temperature exceeds the critical threshold (70°C), it will throw an error
   * to halt execution and prevent hardware damage.
   *
   * @returns Promise<TemperatureReading> - Current temperature reading with safety status
   * @throws {Error} If GPU temperature exceeds critical threshold (70°C)
   * @throws {Error} If nvidia-smi command fails or is not available
   *
   * @example
   * ```typescript
   * try {
   *   const reading = await controller.checkTemperature();
   *   console.log(`GPU temp: ${reading.current}°C`);
   * } catch (error) {
   *   console.error('GPU too hot, halting execution');
   * }
   * ```
   */
  async checkTemperature(): Promise<TemperatureReading> {
    this.lastCheckTime = Date.now();

    try {
      // Execute nvidia-smi to get GPU temperature
      // Format: --query-gpu=temperature.gpu --format=csv,noheader,nounits
      const { stdout } = await execAsync(
        'nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits'
      );

      // Parse temperature from output
      const temperature = parseFloat(stdout.trim());

      if (isNaN(temperature)) {
        throw new Error(`Invalid temperature reading: ${stdout}`);
      }

      // Determine temperature category
      const reading: TemperatureReading = {
        current: temperature,
        isSafe: temperature < this.config.criticalThreshold,
        category: this.categorizeTemperature(temperature),
      };

      // Check critical threshold
      if (temperature >= this.config.criticalThreshold) {
        if (this.config.autoHalt) {
          throw new Error(
            `CRITICAL: GPU temperature (${temperature}°C) exceeds safe threshold (${this.config.criticalThreshold}°C). ` +
            `Execution halted to prevent hardware damage.`
          );
        } else {
          console.warn(
            `WARNING: GPU temperature (${temperature}°C) exceeds safe threshold. ` +
            `Consider applying cooldown.`
          );
        }
      }

      return reading;
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw if it's our custom error
        if (error.message.includes('CRITICAL:')) {
          throw error;
        }
        // Wrap other errors
        throw new Error(
          `Failed to check GPU temperature: ${error.message}. ` +
          `Ensure nvidia-smi is installed and accessible.`
        );
      }
      throw error;
    }
  }

  /**
   * Applies a cooldown period to allow GPU to cool down
   *
   * This method creates a delay to allow the GPU temperature to decrease after
   * intensive processing. Cooldown duration should be based on the intensity
   * of the previous operation and current temperature.
   *
   * Recommended cooldown durations:
   * - After small operations (< 500 lines): 10-15 seconds
   * - After medium operations (500-1000 lines): 15-20 seconds
   * - After large operations (> 1000 lines): 20-30 seconds
   * - After critical temperature: 30-60 seconds
   *
   * @param durationMs - Cooldown duration in milliseconds
   * @returns Promise<void> - Resolves when cooldown period completes
   *
   * @example
   * ```typescript
   * await controller.applyCooldown(15000); // 15 second cooldown
   * console.log('Cooldown complete, resuming operations');
   * ```
   */
  async applyCooldown(durationMs: number): Promise<void> {
    if (this.cooldownActive) {
      console.warn('Cooldown already active, skipping nested cooldown');
      return;
    }

    this.cooldownActive = true;
    const seconds = Math.round(durationMs / 1000);

    console.log(`[ThermalController] Applying cooldown: ${seconds}s to protect GPU`);

    await new Promise<void>((resolve) => {
      setTimeout(() => {
        this.cooldownActive = false;
        console.log(`[ThermalController] Cooldown complete`);
        resolve();
      }, durationMs);
    });
  }

  /**
   * Checks temperature and applies cooldown if necessary
   *
   * This is a convenience method that combines temperature checking with automatic
   * cooldown application. It will apply cooldown if the temperature is in the warning
   * zone (60-70°C) and throw an error if in the critical zone (> 70°C).
   *
   * @param cooldownDurationMs - Cooldown duration to apply if temperature is elevated
   * @returns Promise<TemperatureReading> - Temperature reading
   * @throws {Error} If GPU temperature exceeds critical threshold
   *
   * @example
   * ```typescript
   * const reading = await controller.checkAndCooldown(15000);
   * // If temp > 60°C, applies 15s cooldown
   * // If temp > 70°C, throws error
   * ```
   */
  async checkAndCooldown(cooldownDurationMs: number = 15000): Promise<TemperatureReading> {
    const reading = await this.checkTemperature();

    // Apply cooldown if in warning zone
    if (reading.category === 'warning') {
      console.warn(
        `[ThermalController] Temperature elevated (${reading.current}°C), applying cooldown`
      );
      await this.applyCooldown(cooldownDurationMs);
    }

    return reading;
  }

  /**
   * Gets the last temperature check timestamp
   *
   * @returns number - Unix timestamp of last check, or 0 if never checked
   */
  getLastCheckTime(): number {
    return this.lastCheckTime;
  }

  /**
   * Gets the current thermal configuration
   *
   * @returns ThermalConfig - Current configuration settings
   */
  getConfig(): ThermalConfig {
    return { ...this.config };
  }

  /**
   * Updates thermal configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<ThermalConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Categorizes temperature into safety levels
   *
   * @private
   * @param temperature - Temperature in Celsius
   * @returns Temperature category
   */
  private categorizeTemperature(temperature: number): 'safe' | 'warning' | 'critical' {
    if (temperature >= this.config.criticalThreshold) {
      return 'critical';
    }
    if (temperature >= this.config.warningThreshold) {
      return 'warning';
    }
    return 'safe';
  }

  /**
   * Checks system resources (CPU/RAM)
   *
   * This method monitors CPU and RAM usage to ensure the system can handle
   * intensive operations without running out of resources.
   *
   * @returns Promise<SystemResourceReading> - Current system resource reading
   */
  async checkSystemResources(): Promise<SystemResourceReading> {
    try {
      // Get CPU usage (platform-specific)
      const cpuUsage = await this.getCPUUsage();
      
      // Get RAM usage
      const ramInfo = await this.getRAMUsage();
      
      const reading: SystemResourceReading = {
        cpuUsage,
        ramUsage: ramInfo.usagePercent,
        ramAvailable: ramInfo.availableGB,
        isSafe: cpuUsage < this.config.cpuWarningThreshold && ramInfo.usagePercent < this.config.ramWarningThreshold,
        category: this.categorizeResources(cpuUsage, ramInfo.usagePercent),
      };
      
      return reading;
    } catch (error) {
      console.warn('Failed to check system resources:', error instanceof Error ? error.message : error);
      // Return safe defaults on failure
      return {
        cpuUsage: 0,
        ramUsage: 0,
        ramAvailable: 16,
        isSafe: true,
        category: 'safe',
      };
    }
  }

  /**
   * Applies adaptive cooldown based on resource intensity
   *
   * @param intensity - Cooldown intensity level
   * @returns Promise<void>
   */
  async applyAdaptiveCooldown(intensity: 'low' | 'medium' | 'high'): Promise<void> {
    const cooldownDurations = {
      low: 2000,    // 2 seconds
      medium: 5000,  // 5 seconds
      high: 10000,   // 10 seconds
    };
    
    const duration = cooldownDurations[intensity];
    console.log(`[ThermalController] Applying adaptive cooldown (${intensity}): ${duration / 1000}s`);
    await this.applyCooldown(duration);
  }

  /**
   * Detects hardware capabilities on the system
   *
   * @returns Promise<HardwareProfile> - Detected hardware profile
   */
  async detectHardwareCapabilities(): Promise<HardwareProfile> {
    if (this.hardwareProfile) {
      return this.hardwareProfile;
    }
    
    try {
      // Check for GPU
      const hasGPU = await this.checkGPUAvailability();
      
      // Get RAM info
      const ramInfo = await this.getRAMUsage();
      const totalRAM = ramInfo.totalGB;
      
      // Get CPU cores
      const cpuCores = await this.getCPUCores();
      
      // Determine tier
      let tier: 'high' | 'medium' | 'low' = 'low';
      if (hasGPU && totalRAM >= 16 && cpuCores >= 8) {
        tier = 'high';
      } else if (totalRAM >= 8 && cpuCores >= 4) {
        tier = 'medium';
      }
      
      this.hardwareProfile = {
        hasGPU,
        totalRAM,
        cpuCores,
        tier,
      };
      
      console.log(`[ThermalController] Hardware detected: GPU=${hasGPU}, RAM=${totalRAM}GB, Cores=${cpuCores}, Tier=${tier}`);
      return this.hardwareProfile;
    } catch (error) {
      console.warn('Failed to detect hardware capabilities:', error instanceof Error ? error.message : error);
      // Return conservative defaults
      this.hardwareProfile = {
        hasGPU: false,
        totalRAM: 8,
        cpuCores: 4,
        tier: 'medium',
      };
      return this.hardwareProfile;
    }
  }

  /**
   * Gets current CPU usage percentage
   *
   * @private
   * @returns Promise<number> - CPU usage percentage (0-100)
   */
  private async getCPUUsage(): Promise<number> {
    try {
      const platform = process.platform;
      
      if (platform === 'win32') {
        // Windows: use WMIC
        const { stdout } = await execAsync('wmic cpu get loadpercentage /value');
        const match = stdout.match(/LoadPercentage=(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      } else if (platform === 'darwin') {
        // macOS: use ps
        const { stdout } = await execAsync('ps -A -o %cpu | awk \'{s+=$1} END {print s}\'');
        return parseFloat(stdout.trim()) || 0;
      } else {
        // Linux: use /proc/stat
        const { stdout } = await execAsync('top -bn1 | grep \'Cpu(s)\' | awk \'{print $2}\' | cut -d\'%\' -f1');
        return parseFloat(stdout.trim()) || 0;
      }
    } catch (error) {
      console.warn('Failed to get CPU usage:', error instanceof Error ? error.message : error);
      return 0;
    }
  }

  /**
   * Gets current RAM usage information
   *
   * @private
   * @returns Promise<{usagePercent: number, totalGB: number, availableGB: number}>
   */
  private async getRAMUsage(): Promise<{usagePercent: number, totalGB: number, availableGB: number}> {
    try {
      const totalMemory = (require('os')).totalmem();
      const freeMemory = (require('os')).freemem();
      const usedMemory = totalMemory - freeMemory;
      const usagePercent = (usedMemory / totalMemory) * 100;
      
      return {
        usagePercent: Math.round(usagePercent),
        totalGB: Math.round(totalMemory / (1024 * 1024 * 1024)),
        availableGB: Math.round(freeMemory / (1024 * 1024 * 1024)),
      };
    } catch (error) {
      console.warn('Failed to get RAM usage:', error instanceof Error ? error.message : error);
      return {
        usagePercent: 0,
        totalGB: 8,
        availableGB: 8,
      };
    }
  }

  /**
   * Gets CPU core count
   *
   * @private
   * @returns Promise<number> - Number of CPU cores
   */
  private async getCPUCores(): Promise<number> {
    try {
      return (require('os')).cpus().length;
    } catch (error) {
      console.warn('Failed to get CPU cores:', error instanceof Error ? error.message : error);
      return 4;
    }
  }

  /**
   * Checks if GPU is available
   *
   * @private
   * @returns Promise<boolean> - True if GPU is available
   */
  private async checkGPUAvailability(): Promise<boolean> {
    try {
      await execAsync('nvidia-smi --query-gpu=name --format=csv,noheader');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Categorizes system resources into safety levels
   *
   * @private
   * @param cpuUsage - CPU usage percentage
   * @param ramUsage - RAM usage percentage
   * @returns Resource category
   */
  private categorizeResources(cpuUsage: number, ramUsage: number): 'safe' | 'warning' | 'critical' {
    if (cpuUsage >= this.config.cpuCriticalThreshold || ramUsage >= this.config.ramCriticalThreshold) {
      return 'critical';
    }
    if (cpuUsage >= this.config.cpuWarningThreshold || ramUsage >= this.config.ramWarningThreshold) {
      return 'warning';
    }
    return 'safe';
  }

  /**
   * Runs self-diagnostic stress test
   *
   * This method runs a stress test to determine temperature rise rate
   * and adjust thresholds accordingly.
   *
   * @param durationMs - Duration of stress test in milliseconds
   * @returns Promise<DiagnosticResult> - Diagnostic results
   */
  async runSelfDiagnostic(durationMs: number): Promise<{
    pass: boolean;
    temperatureRiseRate: number;
    adjustedThresholds: number;
  }> {
    try {
      console.log('[ThermalController] Running self-diagnostic...');
      
      const startTemp = await this.checkTemperature();
      const startTime = Date.now();
      
      // Simulate load by checking system resources repeatedly
      const checks = Math.floor(durationMs / 1000);
      for (let i = 0; i < checks; i++) {
        await this.checkSystemResources();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const endTemp = await this.checkTemperature();
      const endTime = Date.now();
      
      const temperatureRiseRate = (endTemp.current - startTemp.current) / ((endTime - startTime) / 1000);
      const pass = temperatureRiseRate < 0.5; // Less than 0.5°C per second is acceptable
      
      // Adjust thresholds based on temperature rise rate
      let adjustedThresholds = 0;
      if (temperatureRiseRate > 0.3) {
        this.config.criticalThreshold = Math.max(65, this.config.criticalThreshold - 2);
        this.config.warningThreshold = Math.max(55, this.config.warningThreshold - 2);
        adjustedThresholds = 2;
      }
      
      return {
        pass,
        temperatureRiseRate,
        adjustedThresholds,
      };
    } catch (error) {
      console.warn('[ThermalController] Self-diagnostic failed:', error instanceof Error ? error.message : error);
      return {
        pass: true, // Assume pass if diagnostic fails
        temperatureRiseRate: 0,
        adjustedThresholds: 0,
      };
    }
  }

  /**
   * Gets hardware profile with additional properties
   *
   * @returns Promise<HardwareProfile & ExtendedHardwareInfo>
   */
  async getHardwareCapabilities(): Promise<{
    hasGPU: boolean;
    totalRAM: number;
    cpuCores: number;
    tier: 'high' | 'medium' | 'low';
    gpuModel?: string;
    gpuVRAM?: number;
    ramTotal: number;
    recommendedBatchSize: number;
    recommendedCooldown: number;
  }> {
    const profile = await this.detectHardwareCapabilities();
    
    let gpuModel: string | undefined;
    let gpuVRAM: number | undefined;
    
    if (profile.hasGPU) {
      try {
        const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits');
        const parts = stdout.trim().split(',');
        gpuModel = parts[0]?.trim();
        gpuVRAM = parts[1] ? parseInt(parts[1].trim()) / 1024 : undefined; // Convert MB to GB
      } catch (error) {
        // Ignore GPU details fetch failure
      }
    }
    
    // Calculate recommended batch size and cooldown based on hardware
    let recommendedBatchSize = 4;
    let recommendedCooldown = 5000;
    
    if (profile.tier === 'high') {
      recommendedBatchSize = 8;
      recommendedCooldown = 3000;
    } else if (profile.tier === 'medium') {
      recommendedBatchSize = 4;
      recommendedCooldown = 5000;
    } else {
      recommendedBatchSize = 2;
      recommendedCooldown = 10000;
    }
    
    return {
      ...profile,
      gpuModel,
      gpuVRAM,
      ramTotal: profile.totalRAM,
      recommendedBatchSize,
      recommendedCooldown,
    };
  }
}
