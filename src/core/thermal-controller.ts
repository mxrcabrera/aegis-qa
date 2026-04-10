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
 * - CRITICAL: 70°C - System will halt execution immediately
 * - WARNING: 60°C - System will apply extended cooldown
 * - SAFE: < 60°C - Normal operation
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
 * Thermal controller configuration
 */
interface ThermalConfig {
  /** Critical temperature threshold in Celsius (default: 70) */
  criticalThreshold: number;
  /** Warning temperature threshold in Celsius (default: 60) */
  warningThreshold: number;
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

  /**
   * Creates a new ThermalController instance
   *
   * @param config - Optional configuration overrides
   */
  constructor(config?: Partial<ThermalConfig>) {
    this.config = {
      criticalThreshold: 70,
      warningThreshold: 60,
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
}
