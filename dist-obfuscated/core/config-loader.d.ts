/**
 * ConfigLoader - External configuration management
 *
 * Purpose: Load configuration from .aegisrc.json file to override default
 * thresholds, timeouts, and paths. This allows projects to customize Aegis
 * behavior without modifying the source code.
 *
 * Architecture:
 * - Reads .aegisrc.json from project root
 * - Merges with default configuration
 * - Validates configuration structure
 * - Supports CI mode detection
 *
 * @module core/config-loader
 * @since 2.0.0
 */
/**
 * Loaded configuration with defaults merged
 */
interface LoadedConfig {
    /** Thermal thresholds */
    thermal: {
        cpuCriticalThreshold: number;
        cpuWarningThreshold: number;
        ramCriticalThreshold: number;
        ramWarningThreshold: number;
        gpuCriticalThreshold: number;
        gpuWarningThreshold: number;
    };
    /** File filtering */
    files: {
        maxFileSizeBytes: number;
        allowedExtensions: string[];
        blockedExtensions: string[];
        blockedPatterns: string[];
        fileTimeoutMs: number;
    };
    /** Source directory detection */
    paths: {
        sourceDir?: string;
        additionalScanDirs: string[];
    };
    /** CI/CD mode settings */
    ci: {
        enabled: boolean;
        minimalistOutput: boolean;
        permissiveThermalLock: boolean;
        maxCooldownMs: number;
    };
    /** Performance settings */
    performance: {
        recommendedBatchSize?: number;
        recommendedCooldown?: number;
        disableGC: boolean;
    };
    /** Reporting settings */
    reporting: {
        maxViolationsPerCategory: number;
    };
}
/**
 * ConfigLoader - External configuration management
 *
 * This class loads configuration from .aegisrc.json and merges it with
 * default values to provide a unified configuration object.
 *
 * @class ConfigLoader
 * @example
 * ```typescript
 * const loader = new ConfigLoader('/path/to/project');
 * const config = loader.load();
 * console.log(`CPU Critical: ${config.thermal.cpuCriticalThreshold}%`);
 * console.log(`CI Mode: ${config.ci.enabled}`);
 * ```
 */
export declare class ConfigLoader {
    private configPath;
    /**
     * Creates a new ConfigLoader instance
     *
     * @param projectRoot - Project root directory
     */
    constructor(projectRoot: string);
    /**
     * Loads configuration from .aegisrc.json
     *
     * @returns Loaded configuration with defaults merged
     */
    load(): LoadedConfig;
    /**
     * Loads user configuration from .aegisrc.json
     *
     * @private
     * @returns User configuration or empty object if file doesn't exist
     */
    private loadUserConfig;
    /**
     * Detects if running in CI mode
     *
     * Checks for:
     * - CI=true environment variable
     * - Common CI environment variables (CI, GITHUB_ACTIONS, GITLAB_CI, etc.)
     *
     * @private
     * @returns Whether running in CI mode
     */
    private detectCIMode;
    /**
     * Checks if CI mode is enabled
     *
     * @returns Whether CI mode is enabled
     */
    isCIMode(): boolean;
    /**
     * Gets the configuration file path
     *
     * @returns Configuration file path
     */
    getConfigPath(): string;
    /**
     * Checks if configuration file exists
     *
     * @returns Whether configuration file exists
     */
    configExists(): boolean;
}
export {};
//# sourceMappingURL=config-loader.d.ts.map