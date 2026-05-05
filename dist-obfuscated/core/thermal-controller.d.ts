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
 * - CRITICAL: 70-�C - System will halt execution immediately
 * - WARNING: 60-�C - System will apply extended cooldown
 * - SAFE: < 60-�C - Normal operation
 *
 * @module core/thermal-controller
 * @since 1.0.0
 */
/**
 * Temperature reading from GPU
 */
interface TemperatureReading {
    /** Current GPU temperature in Celsius */
    current: number;
    /** Whether temperature is within safe limits (< 70-�C) */
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
 * await controller.checkTemperature(); // Throws error if > 70-�C
 * await controller.applyCooldown(15000); // 15 second cooldown
 * ```
 */
export declare class ThermalController {
    private config;
    private lastCheckTime;
    private cooldownActive;
    private gpuAvailable;
    private gpuAvailabilityLogged;
    private ciMode;
    /**
     * Creates a new ThermalController instance
     *
     * @param config - Optional configuration overrides
     * @param projectRoot - Project root directory for loading .aegisrc.json
     */
    constructor(config?: Partial<ThermalConfig>, projectRoot?: string);
    /**
     * Checks current GPU temperature using nvidia-smi
     *
     * This method executes the nvidia-smi command to retrieve the current GPU temperature.
     * If the temperature exceeds the critical threshold (70-�C), it will throw an error
     * to halt execution and prevent hardware damage.
     *
     * @returns Promise<TemperatureReading> - Current temperature reading with safety status
     * @throws {Error} If GPU temperature exceeds critical threshold (70-�C)
     * @throws {Error} If nvidia-smi command fails or is not available
     *
     * @example
     * ```typescript
     * try {
     *   const reading = await controller.checkTemperature();
     *   console.log(`GPU temp: ${reading.current}-�C`);
     * } catch (error) {
     *   console.error('GPU too hot, halting execution');
     * }
     * ```
     */
    checkTemperature(): Promise<TemperatureReading>;
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
    private checkTemperatureFallback;
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
    applyCooldown(durationMs: number): Promise<void>;
    /**
     * Checks temperature and applies cooldown if necessary
     *
     * This is a convenience method that combines temperature checking with automatic
     * cooldown application. It will apply cooldown if the temperature is in the warning
     * zone (60-70-�C) and throw an error if in the critical zone (> 70-�C).
     *
     * @param cooldownDurationMs - Cooldown duration to apply if temperature is elevated
     * @returns Promise<TemperatureReading> - Temperature reading
     * @throws {Error} If GPU temperature exceeds critical threshold
     *
     * @example
     * ```typescript
     * const reading = await controller.checkAndCooldown(15000);
     * // If temp > 60-�C, applies 15s cooldown
     * // If temp > 70-�C, throws error
     * ```
     */
    checkAndCooldown(cooldownDurationMs?: number): Promise<TemperatureReading>;
    /**
     * Gets the last temperature check timestamp
     *
     * @returns number - Unix timestamp of last check, or 0 if never checked
     */
    getLastCheckTime(): number;
    /**
     * Gets the current thermal configuration
     *
     * @returns ThermalConfig - Current configuration settings
     */
    getConfig(): ThermalConfig;
    /**
     * Updates thermal configuration
     *
     * @param config - Partial configuration to update
     */
    updateConfig(config: Partial<ThermalConfig>): void;
    /**
     * Categorizes temperature into safety levels
     *
     * @private
     * @param temperature - Temperature in Celsius
     * @returns Temperature category
     */
    private categorizeTemperature;
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
    checkSystemResources(): Promise<SystemResourceReading>;
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
    checkPhaseLimits(phaseNumber: number, currentResources: SystemResourceReading): Promise<void>;
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
    setPhaseLimits(phaseNumber: number, limits: PhaseResourceLimits): void;
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
    detectHardwareCapabilities(): Promise<HardwareProfile>;
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
    applyAdaptiveCooldown(intensity: 'low' | 'medium' | 'high'): Promise<void>;
    /**
     * Categorizes system resources into safety levels
     *
     * @private
     * @param cpuUsage - CPU usage percentage
     * @param ramUsage - RAM usage percentage
     * @returns Resource category
     */
    private categorizeSystemResources;
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
     * console.log(`Temperature change rate: ${result.temperatureRiseRate}-�C/s`);
     * console.log(`Baseline: ${JSON.stringify(result.baseline)}`);
     * ```
     */
    runSelfDiagnostic(durationMs?: number): Promise<{
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
    }>;
}
export {};
//# sourceMappingURL=thermal-controller.d.ts.map