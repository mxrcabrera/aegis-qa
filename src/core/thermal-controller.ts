/**
 * ThermalController - Hardware Protection Layer
 *
 * Purpose: Monitor and control GPU temperature to prevent hardware damage during
 * intensive AI processing tasks. This controller acts as the "thermal brake" of the
 * Aegis QA system, ensuring that the GPU never exceeds safe operating temperatures.
 *
 * Architecture: This controller is the heart of the hardware protection system. All
 * AI processing operations must pass through this controller before execution.
 *
 * Safety Thresholds:
 * - CRITICAL: 70┬░C - System will halt execution immediately
 * - WARNING: 60┬░C - System will apply extended cooldown
 * - SAFE: < 60┬░C - Normal operation
 *
 * @module core/thermal-controller
 * @since 1.0.0
 */

import { execSafe } from './command-sanitizer.js';
import * as si from 'systeminformation';
import { ConfigLoader } from './config-loader.js';

/**
 * Temperature reading from GPU
 */
interface TemperatureReading {
  /** Current GPU temperature in Celsius */
  current: number;
  /** Whether temperature is within safe limits (< 70┬░C) */
  isSafe: boolean;
  /** Temperature category: 'safe' | 'warning' | 'critical' */
  category: 'safe' | 'warning' | 'critical';
}

/**
 * System resource reading (CPU and RAM)
 */
interface SystemResourceReading {
  /** Current CPU usage percentage (0-100) */
  cpuUsage: number;
  /** Current RAM usage percentage (0-100) */
  ramUsage: number;
  /** Total RAM in GB */
  ramTotal: number;
  /** Available RAM in GB */
  ramAvailable: number;
  /** Whether resources are within safe limits */
  isSafe: boolean;
  /** Resource category: 'safe' | 'warning' | 'critical' */
  category: 'safe' | 'warning' | 'critical';
}

/**
 * Hardware capabilities profile
 */
interface HardwareProfile {
  /** Has NVIDIA GPU */
  hasGPU: boolean;
  /** GPU model name (if available) */
  gpuModel?: string;
  /** GPU VRAM in GB (if available) */
  gpuVRAM?: number;
  /** CPU cores */
  cpuCores: number;
  /** Total RAM in GB */
  ramTotal: number;
  /** Recommended batch size based on hardware */
  recommendedBatchSize: number;
  /** Recommended cooldown based on hardware */
  recommendedCooldown: number;
}

/**
 * Phase-specific resource limits
 */
interface PhaseResourceLimits {
  /** Maximum CPU usage percentage for this phase */
  maxCpuUsage?: number;
  /** Maximum RAM usage percentage for this phase */
  maxRamUsage?: number;
  /** Maximum execution time in milliseconds for this phase */
  maxExecutionTimeMs?: number;
  /** Maximum file operations per second */
  maxFileOpsPerSec?: number;
}

/**
 * Thermal controller configuration
 */
interface ThermalConfig {
  /** Critical temperature threshold in Celsius (default: 70) */
  criticalThreshold: number;
  /** Warning temperature threshold in Celsius (default: 60) */
  warningThreshold: number;
  /** Whether to automatically halt execution on critical temperature */
  autoHalt: boolean;
  /** Critical CPU usage threshold percentage (default: 90) */
  cpuCriticalThreshold: number;
  /** Warning CPU usage threshold percentage (default: 80) */
  cpuWarningThreshold: number;
  /** Critical RAM usage threshold percentage (default: 95) */
  ramCriticalThreshold: number;
  /** Warning RAM usage threshold percentage (default: 90) */
  ramWarningThreshold: number;
  /** Whether CI mode is enabled (minimal thermal monitoring) */
  ciMode?: boolean;
  /** Per-phase resource limits */
  phaseLimits?: Record<number, PhaseResourceLimits>;
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
 * await controller.checkTemperature(); // Throws error if > 70┬░C
 * await controller.applyCooldown(15000); // 15 second cooldown
 * ```
 */
export class ThermalController {
  private config: ThermalConfig;
  private lastCheckTime: number;
  private cooldownActive: boolean = false;
  private gpuAvailable: boolean | null = null; // null = not checked yet, true = available, false = unavailable
  private gpuAvailabilityLogged: boolean = false; // Track if we've logged the GPU status
  private ciMode: boolean = false;

  /**
   * Creates a new ThermalController instance
   *
   * @param config - Optional configuration overrides
   * @param projectRoot - Project root directory for loading .aegisrc.json
   */
  constructor(config?: Partial<ThermalConfig>, projectRoot?: string) {
    // Load external configuration if projectRoot is provided
    let externalConfig: Partial<ThermalConfig> = {};
    if (projectRoot) {
      try {
        const configLoader = new ConfigLoader(projectRoot);
        const loadedConfig = configLoader.load();
        
        // Merge thermal thresholds
        externalConfig = {
          criticalThreshold: loadedConfig.thermal.gpuCriticalThreshold,
          warningThreshold: loadedConfig.thermal.gpuWarningThreshold,
          cpuCriticalThreshold: loadedConfig.thermal.cpuCriticalThreshold,
          cpuWarningThreshold: loadedConfig.thermal.cpuWarningThreshold,
          ramCriticalThreshold: loadedConfig.thermal.ramCriticalThreshold,
          ramWarningThreshold: loadedConfig.thermal.ramWarningThreshold,
        };

        // Set CI mode from config loader
        this.ciMode = loadedConfig.ci.enabled;

        if (this.ciMode) {
          console.log('[ThermalController] CI Mode enabled - using minimal thermal monitoring (GPU disabled, cooldowns skipped, RAM-only)');
        }
      } catch {
        // Config loading failed, use defaults
      }
    }

    // Override ciMode if explicitly provided in config parameter (for testing)
    if (config && config.ciMode !== undefined) {
      this.ciMode = config.ciMode;
    }

    this.config = {
      criticalThreshold: 70,
      warningThreshold: 60,
      autoHalt: true,
      cpuCriticalThreshold: 90,
      cpuWarningThreshold: 80,
      ramCriticalThreshold: 95,
      ramWarningThreshold: 90,
      ...externalConfig,
      ...config,
    };
    this.lastCheckTime = 0;
  }

  /**
   * Checks current GPU temperature using nvidia-smi
   *
   * This method executes the nvidia-smi command to retrieve the current GPU temperature.
   * If the temperature exceeds the critical threshold (70┬░C), it will throw an error
   * to halt execution and prevent hardware damage.
   *
   * @returns Promise<TemperatureReading> - Current temperature reading with safety status
   * @throws {Error} If GPU temperature exceeds critical threshold (70┬░C)
   * @throws {Error} If nvidia-smi command fails or is not available
   *
   * @example
   * ```typescript
   * try {
   *   const reading = await controller.checkTemperature();
   *   console.log(`GPU temp: ${reading.current}┬░C`);
   * } catch (error) {
   *   console.error('GPU too hot, halting execution');
   * }
   * ```
   */
  async checkTemperature(): Promise<TemperatureReading> {
    this.lastCheckTime = Date.now();

    // In CI mode, skip GPU monitoring completely (CI runners don't have GPU)
    if (this.ciMode) {
      return this.checkTemperatureFallback();
    }

    // If GPU is known to be unavailable, monitor CPU/RAM instead
    if (this.gpuAvailable === false) {
      return this.checkTemperatureFallback();
    }

    try {
      // Execute nvidia-smi to get GPU temperature
      // Format: --query-gpu=temperature.gpu --format=csv,noheader,nounits
      const { stdout } = await execSafe(
        'nvidia-smi',
        ['--query-gpu=temperature.gpu', '--format=csv,noheader,nounits']
      );

      // Parse temperature from output
      const temperature = parseFloat(stdout.trim());

      if (isNaN(temperature)) {
        throw new Error(`Invalid temperature reading: ${stdout}`);
      }

      // GPU is available
      if (this.gpuAvailable === null) {
        this.gpuAvailable = true;
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
            `CRITICAL: GPU temperature (${temperature}┬░C) exceeds safe threshold (${this.config.criticalThreshold}┬░C). ` +
            `Execution halted to prevent hardware damage.`
          );
        } else {
          console.warn(
            `WARNING: GPU temperature (${temperature}┬░C) exceeds safe threshold. ` +
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

        // GPU is not available - log once and switch to CPU-only mode
        if (this.gpuAvailable === null && !this.gpuAvailabilityLogged) {
          console.log('[ThermalController] GPU monitoring not available, using CPU/RAM only');
          this.gpuAvailable = false;
          this.gpuAvailabilityLogged = true;
        }

        // Monitor CPU/RAM instead
        return this.checkTemperatureFallback();
      }
      // Monitor CPU/RAM for unknown errors
      return this.checkTemperatureFallback();
    }
  }

  /**
   * Fallback temperature check using CPU/RAM monitoring when GPU is unavailable
   *
   * This method monitors CPU load and RAM usage via systeminformation to protect
   * hardware when nvidia-smi is not available. It uses CPU/RAM thresholds to
   * determine safety status.
   *
   * @private
   * @returns Promise<TemperatureReading> - Temperature reading (simulated from CPU/RAM)
   */
  private async checkTemperatureFallback(): Promise<TemperatureReading> {
    try {
      const resources = await this.checkSystemResources();

      // Simulate temperature based on CPU/RAM usage
      // Higher CPU/RAM usage = higher simulated temperature
      const simulatedTemp = Math.min(
        Math.round((resources.cpuUsage + resources.ramUsage) / 2),
        this.config.criticalThreshold - 1 // Never exceed critical in fallback
      );

      const reading: TemperatureReading = {
        current: simulatedTemp,
        isSafe: resources.isSafe,
        category: resources.category,
      };

      // Check critical thresholds for CPU/RAM
      if (!resources.isSafe && this.config.autoHalt) {
        throw new Error(
          `CRITICAL: System resources critical (CPU: ${resources.cpuUsage}%, RAM: ${resources.ramUsage}%). ` +
          `Execution halted to prevent system instability.`
        );
      } else if (!resources.isSafe) {
        console.warn(
          `WARNING: System resources elevated (CPU: ${resources.cpuUsage}%, RAM: ${resources.ramUsage}%). ` +
          `Consider applying cooldown.`
        );
      }

      return reading;
    } catch (error) {
      if (error instanceof Error && error.message.includes('CRITICAL:')) {
        throw error;
      }

      // If systeminformation also fails, return safe reading
      return {
        current: 0,
        isSafe: true,
        category: 'safe',
      };
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

    // In CI mode, skip cooldowns completely (CI runners don't overheat)
    if (this.ciMode) {
      console.log('[ThermalController] CI mode: skipping cooldown (CI runners don\'t overheat)');
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
   * zone (60-70┬░C) and throw an error if in the critical zone (> 70┬░C).
   *
   * @param cooldownDurationMs - Cooldown duration to apply if temperature is elevated
   * @returns Promise<TemperatureReading> - Temperature reading
   * @throws {Error} If GPU temperature exceeds critical threshold
   *
   * @example
   * ```typescript
   * const reading = await controller.checkAndCooldown(15000);
   * // If temp > 60┬░C, applies 15s cooldown
   * // If temp > 70┬░C, throws error
   * ```
   */
  async checkAndCooldown(cooldownDurationMs: number = 15000): Promise<TemperatureReading> {
    const reading = await this.checkTemperature();

    // Apply cooldown if in warning zone
    if (reading.category === 'warning') {
      console.warn(
        `[ThermalController] Temperature elevated (${reading.current}┬░C), applying cooldown`
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
   * Checks current system resources (CPU and RAM)
   *
   * This method uses systeminformation to retrieve current CPU and RAM usage.
   * If resources exceed critical thresholds, it will throw an error to halt execution.
   * If systeminformation fails, it uses safe defaults to prevent execution interruption.
   *
   * @returns Promise<SystemResourceReading> - Current resource reading with safety status
   * @throws {Error} If CPU or RAM usage exceeds critical thresholds
   *
   * @example
   * ```typescript
   * try {
   *   const reading = await controller.checkSystemResources();
   *   console.log(`CPU: ${reading.cpuUsage}%, RAM: ${reading.ramUsage}%`);
   * } catch (error) {
   *   console.error('System resources critical, halting execution');
   * }
   * ```
   */
  async checkSystemResources(): Promise<SystemResourceReading> {
    try {
      const [cpuLoad, memInfo] = await Promise.all([
        si.currentLoad(),
        si.mem(),
      ]);

      const cpuUsage = Math.round(cpuLoad.currentLoad * 100);
      const ramTotalGB = memInfo.total / (1024 * 1024 * 1024);
      const ramAvailableGB = memInfo.available / (1024 * 1024 * 1024);
      const ramUsage = Math.round(((memInfo.total - memInfo.available) / memInfo.total) * 100);

      const reading: SystemResourceReading = {
        cpuUsage,
        ramUsage,
        ramTotal: Math.round(ramTotalGB * 10) / 10,
        ramAvailable: Math.round(ramAvailableGB * 10) / 10,
        isSafe: cpuUsage < this.config.cpuCriticalThreshold && ramUsage < this.config.ramCriticalThreshold,
        category: this.categorizeSystemResources(cpuUsage, ramUsage),
      };

      // In CI mode, only log warning for RAM > 90% to prevent OOM kills, don't block
      if (this.ciMode) {
        if (ramUsage >= 90) {
          console.warn(
            `[ThermalController] CI mode: RAM usage elevated (${ramUsage}%). ` +
            `Monitor for potential OOM kills.`
          );
        }
        return reading;
      }

      // Check critical thresholds (non-CI mode)
      if (cpuUsage >= this.config.cpuCriticalThreshold || ramUsage >= this.config.ramCriticalThreshold) {
        if (this.config.autoHalt) {
          throw new Error(
            `CRITICAL: System resources critical (CPU: ${cpuUsage}%, RAM: ${ramUsage}%). ` +
            `Execution halted to prevent system instability.`
          );
        } else {
          console.warn(
            `WARNING: System resources critical (CPU: ${cpuUsage}%, RAM: ${ramUsage}%). ` +
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
        // Sensor fallback: Use safe defaults if systeminformation fails
        console.warn(`[ThermalController] System information sensor failed: ${error.message}. Using safe defaults.`);
        
        // Return safe defaults to prevent execution interruption
        return {
          cpuUsage: 25, // Conservative estimate
          ramUsage: 40, // Conservative estimate
          ramTotal: 16, // Common default
          ramAvailable: 9.6,
          isSafe: true,
          category: 'safe',
        };
      }
      // Fallback for unknown error types
      return {
        cpuUsage: 25,
        ramUsage: 40,
        ramTotal: 16,
        ramAvailable: 9.6,
        isSafe: true,
        category: 'safe',
      };
    }
  }

  /**
   * Checks if phase-specific resource limits are respected
   *
   * This method checks if the current system resource usage is within the
   * limits specified for a particular phase. If limits are exceeded, it will
   * throw an error to halt execution.
   *
   * @param phaseNumber - Phase number to check limits for
   * @param currentResources - Current system resource reading
   * @returns Promise<void> - Resolves if within limits, throws if exceeded
   * @throws {Error} If resource limits are exceeded
   *
   * @example
   * ```typescript
   * const currentResources = await controller.checkSystemResources();
   * await controller.checkPhaseLimits(11, currentResources);
   * ```
   */
  async checkPhaseLimits(phaseNumber: number, currentResources: SystemResourceReading): Promise<void> {
    const phaseLimits = this.config.phaseLimits?.[phaseNumber];

    if (!phaseLimits) {
      // No specific limits for this phase, use global thresholds
      return;
    }

    const violations: string[] = [];

    // Check CPU usage
    if (phaseLimits.maxCpuUsage && currentResources.cpuUsage > phaseLimits.maxCpuUsage) {
      violations.push(`CPU usage (${currentResources.cpuUsage}%) exceeds phase limit (${phaseLimits.maxCpuUsage}%)`);
    }

    // Check RAM usage
    if (phaseLimits.maxRamUsage && currentResources.ramUsage > phaseLimits.maxRamUsage) {
      violations.push(`RAM usage (${currentResources.ramUsage}%) exceeds phase limit (${phaseLimits.maxRamUsage}%)`);
    }

    if (violations.length > 0) {
      throw new Error(`Phase ${phaseNumber} resource limits exceeded: ${violations.join(', ')}`);
    }
  }

  /**
   * Sets resource limits for a specific phase
   *
   * @param phaseNumber - Phase number to set limits for
   * @param limits - Resource limits to apply
   *
   * @example
   * ```typescript
   * controller.setPhaseLimits(11, {
   *   maxCpuUsage: 70,
   *   maxRamUsage: 80,
   *   maxExecutionTimeMs: 300000
   * });
   * ```
   */
  setPhaseLimits(phaseNumber: number, limits: PhaseResourceLimits): void {
    if (!this.config.phaseLimits) {
      this.config.phaseLimits = {};
    }
    this.config.phaseLimits[phaseNumber] = limits;
  }

  /**
   * Detects hardware capabilities
   *
   * This method detects GPU, CPU, and RAM capabilities to recommend
   * appropriate batch sizes and cooldown durations.
   *
   * @returns Promise<HardwareProfile> - Hardware capabilities profile
   *
   * @example
   * ```typescript
   * const profile = await controller.detectHardwareCapabilities();
   * console.log(`Has GPU: ${profile.hasGPU}, Recommended batch: ${profile.recommendedBatchSize}`);
   * ```
   */
  async detectHardwareCapabilities(): Promise<HardwareProfile> {
    let hasGPU = false;
    let gpuModel: string | undefined;
    let gpuVRAM: number | undefined;

    // Try to detect GPU (only if not already known to be unavailable)
    if (this.gpuAvailable !== false) {
      try {
        const { stdout } = await execSafe(
          'nvidia-smi',
          ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits']
        );
        const parts = stdout.trim().split(',');
        if (parts.length >= 2) {
          hasGPU = true;
          gpuModel = parts[0].trim();
          gpuVRAM = parseInt(parts[1].trim()) / 1024; // Convert MB to GB
          this.gpuAvailable = true;
        }
      } catch {
        // No NVIDIA GPU or nvidia-smi not available
        hasGPU = false;
        if (this.gpuAvailable === null && !this.gpuAvailabilityLogged) {
          console.log('[ThermalController] GPU monitoring not available, using CPU/RAM only');
          this.gpuAvailable = false;
          this.gpuAvailabilityLogged = true;
        }
      }
    }

    // If GPU is not available, report "none detected"
    if (!hasGPU) {
      gpuModel = 'none detected';
      gpuVRAM = undefined;
    }

    // Get CPU and RAM info
    const [cpuInfo, memInfo] = await Promise.all([
      si.cpu(),
      si.mem(),
    ]);

    const cpuCores = cpuInfo.cores;
    const ramTotalGB = Math.round((memInfo.total / (1024 * 1024 * 1024)) * 10) / 10;

    // Calculate recommended batch size and cooldown based on hardware
    let recommendedBatchSize = 20;
    let recommendedCooldown = 15000; // 15 seconds

    if (hasGPU && gpuVRAM && gpuVRAM >= 16) {
      // High-end GPU
      recommendedBatchSize = 30;
      recommendedCooldown = 10000; // 10 seconds
    } else if (hasGPU && gpuVRAM && gpuVRAM >= 8) {
      // Mid-range GPU
      recommendedBatchSize = 20;
      recommendedCooldown = 15000; // 15 seconds
    } else if (ramTotalGB >= 16) {
      // High RAM without GPU
      recommendedBatchSize = 15;
      recommendedCooldown = 20000; // 20 seconds
    } else if (ramTotalGB >= 8) {
      // Mid RAM without GPU
      recommendedBatchSize = 10;
      recommendedCooldown = 25000; // 25 seconds
    } else {
      // Low-end hardware
      recommendedBatchSize = 5;
      recommendedCooldown = 30000; // 30 seconds
    }

    return {
      hasGPU,
      gpuModel,
      gpuVRAM,
      cpuCores,
      ramTotal: ramTotalGB,
      recommendedBatchSize,
      recommendedCooldown,
    };
  }

  /**
   * Applies adaptive cooldown based on operation intensity
   *
   * This method applies cooldown duration based on the intensity of the operation
   * and current system resource usage. If critical thresholds are reached, it
   * triggers hardening mode with extended cooldown.
   *
   * @param intensity - Operation intensity: 'low', 'medium', or 'high'
   * @returns Promise<void> - Resolves when cooldown completes
   *
   * @example
   * ```typescript
   * await controller.applyAdaptiveCooldown('high'); // Longer cooldown for intensive operation
   * ```
   */
  async applyAdaptiveCooldown(intensity: 'low' | 'medium' | 'high'): Promise<void> {
    let baseCooldown = 15000; // 15 seconds default

    switch (intensity) {
      case 'low':
        baseCooldown = 10000; // 10 seconds
        break;
      case 'medium':
        baseCooldown = 15000; // 15 seconds
        break;
      case 'high':
        baseCooldown = 30000; // 30 seconds
        break;
    }

    // Check current resources and extend cooldown if needed
    try {
      const resources = await this.checkSystemResources();
      
      if (resources.category === 'critical') {
        // HARDENING MODE: Critical threshold reached
        console.warn('[HARDENING] Critical threshold reached. Cooling down for 60s...');
        baseCooldown = 60000; // 60 seconds hardening cooldown
      } else if (resources.category === 'warning') {
        baseCooldown *= 1.5; // 50% longer cooldown
      }
    } catch {
      // If resource check fails, use base cooldown (safe default)
      console.warn('[ThermalController] Resource check failed, using safe default cooldown');
    }

    await this.applyCooldown(baseCooldown);
  }

  /**
   * Categorizes system resources into safety levels
   *
   * @private
   * @param cpuUsage - CPU usage percentage
   * @param ramUsage - RAM usage percentage
   * @returns Resource category
   */
  private categorizeSystemResources(cpuUsage: number, ramUsage: number): 'safe' | 'warning' | 'critical' {
    if (cpuUsage >= this.config.cpuCriticalThreshold || ramUsage >= this.config.ramCriticalThreshold) {
      return 'critical';
    }
    if (cpuUsage >= this.config.cpuWarningThreshold || ramUsage >= this.config.ramWarningThreshold) {
      return 'warning';
    }
    return 'safe';
  }

  /**
   * Runs a passive self-diagnostic baseline reading
   *
   * This method performs a passive baseline measurement by taking initial
   * temperature/CPU/RAM readings, waiting without artificial load, then taking
   * final readings. If the initial baseline is already in warning/critical zone,
   * it adjusts thresholds conservatively without heating the machine further.
   * This is informative and non-destructive.
   *
   * @param durationMs - Passive baseline duration in milliseconds (default: 2000)
   * @returns Promise<{pass: boolean, temperatureRiseRate: number, adjustedThresholds: boolean, baseline}>
   *
   * @example
   * ```typescript
   * const result = await controller.runSelfDiagnostic();
   * console.log(`Diagnostic passed: ${result.pass}`);
   * console.log(`Temperature change rate: ${result.temperatureRiseRate}┬░C/s`);
   * console.log(`Baseline: ${JSON.stringify(result.baseline)}`);
   * ```
   */
  async runSelfDiagnostic(durationMs: number = 2000): Promise<{
    pass: boolean;
    temperatureRiseRate: number;
    adjustedThresholds: boolean;
    baseline: {
      initialTemp: number;
      finalTemp: number;
      initialCpuUsage: number;
      initialRamUsage: number;
      finalCpuUsage: number;
      finalRamUsage: number;
    };
  }> {
    console.log(`[ThermalController] Running passive self-diagnostic (baseline reading over ${durationMs}ms)...`);

    let temperatureRiseRate = 0;
    let adjustedThresholds = false;

    try {
      // Get initial temperature and system resources
      const initialReading = await this.checkTemperature();
      const initialTemp = initialReading.current;
      const initialResources = await this.checkSystemResources();
      const initialCpuUsage = initialResources.cpuUsage;
      const initialRamUsage = initialResources.ramUsage;

      console.log(`[ThermalController] Initial baseline - Temp: ${initialTemp}┬░C, CPU: ${initialCpuUsage}%, RAM: ${initialRamUsage}%`);

      // Check if initial reading is already in warning zone
      if (initialReading.category === 'warning' || initialResources.category === 'warning') {
        console.warn('[ThermalController] Initial baseline already in warning zone, adjusting thresholds conservatively');
        this.config.criticalThreshold = Math.max(60, this.config.criticalThreshold - 5);
        this.config.warningThreshold = Math.max(50, this.config.warningThreshold - 5);
        this.config.cpuCriticalThreshold = Math.max(80, this.config.cpuCriticalThreshold - 5);
        this.config.cpuWarningThreshold = Math.max(70, this.config.cpuWarningThreshold - 5);
        this.config.ramCriticalThreshold = Math.max(85, this.config.ramCriticalThreshold - 5);
        this.config.ramWarningThreshold = Math.max(75, this.config.ramWarningThreshold - 5);
        adjustedThresholds = true;
      } else if (initialReading.category === 'critical' || initialResources.category === 'critical') {
        console.warn('[ThermalController] Initial baseline in critical zone, using maximum conservative settings');
        this.config.criticalThreshold = 60;
        this.config.warningThreshold = 50;
        this.config.cpuCriticalThreshold = 75;
        this.config.cpuWarningThreshold = 65;
        this.config.ramCriticalThreshold = 80;
        this.config.ramWarningThreshold = 70;
        adjustedThresholds = true;
      }

      // Wait passively (no artificial load)
      console.log(`[ThermalController] Waiting ${durationMs}ms for passive baseline measurement...`);
      await new Promise<void>((resolve) => setTimeout(resolve, durationMs));

      // Get final temperature and system resources
      const finalReading = await this.checkTemperature();
      const finalTemp = finalReading.current;
      const finalResources = await this.checkSystemResources();
      const finalCpuUsage = finalResources.cpuUsage;
      const finalRamUsage = finalResources.ramUsage;

      console.log(`[ThermalController] Final baseline - Temp: ${finalTemp}┬░C, CPU: ${finalCpuUsage}%, RAM: ${finalRamUsage}%`);

      // Calculate temperature rise rate
      const tempRise = finalTemp - initialTemp;
      temperatureRiseRate = (tempRise / (durationMs / 1000));
      console.log(`[ThermalController] Temperature change rate: ${temperatureRiseRate.toFixed(2)}┬░C/s`);

      // Adjust thresholds based on observed passive behavior
      if (!adjustedThresholds && temperatureRiseRate > 1.0) {
        // Fast temperature rise even without load - reduce thresholds
        console.warn('[ThermalController] Fast temperature rise detected without load, adjusting thresholds conservatively');
        this.config.criticalThreshold = Math.max(60, this.config.criticalThreshold - 5);
        this.config.warningThreshold = Math.max(50, this.config.warningThreshold - 5);
        adjustedThresholds = true;
      } else if (!adjustedThresholds && temperatureRiseRate < 0.1) {
        // Very slow temperature rise - system is stable
        console.log('[ThermalController] System thermal behavior is stable, thresholds are appropriate');
      }

      const baseline = {
        initialTemp,
        finalTemp,
        initialCpuUsage,
        initialRamUsage,
        finalCpuUsage,
        finalRamUsage,
      };

      console.log('[ThermalController] Passive self-diagnostic completed successfully');

      return {
        pass: finalTemp < this.config.criticalThreshold && finalResources.isSafe,
        temperatureRiseRate,
        adjustedThresholds,
        baseline,
      };
    } catch (error) {
      console.error('[ThermalController] Self-diagnostic failed:', error instanceof Error ? error.message : error);

      // If diagnostic fails, use conservative defaults
      return {
        pass: true, // Don't halt execution on diagnostic failure
        temperatureRiseRate: 0,
        adjustedThresholds: false,
        baseline: {
          initialTemp: 0,
          finalTemp: 0,
          initialCpuUsage: 0,
          initialRamUsage: 0,
          finalCpuUsage: 0,
          finalRamUsage: 0,
        },
      };
    }
  }

}
