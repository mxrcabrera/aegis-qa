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

import * as fs from 'fs';
import * as path from 'path';

/**
 * Aegis configuration from .aegisrc.json
 */
interface AegisConfig {
  /** Thermal thresholds */
  thermal?: {
    /** Critical CPU usage percentage (default: 90) */
    cpuCriticalThreshold?: number;
    /** Warning CPU usage percentage (default: 80) */
    cpuWarningThreshold?: number;
    /** Critical RAM usage percentage (default: 95) */
    ramCriticalThreshold?: number;
    /** Warning RAM usage percentage (default: 90) */
    ramWarningThreshold?: number;
    /** Critical GPU temperature in Celsius (default: 70) */
    gpuCriticalThreshold?: number;
    /** Warning GPU temperature in Celsius (default: 60) */
    gpuWarningThreshold?: number;
  };
  /** File filtering */
  files?: {
    /** Maximum file size in bytes (default: 500KB) */
    maxFileSizeBytes?: number;
    /** Additional file extensions to analyze */
    allowedExtensions?: string[];
    /** Additional file extensions to block */
    blockedExtensions?: string[];
    /** Additional glob patterns to block */
    blockedPatterns?: string[];
  };
  /** Source directory detection */
  paths?: {
    /** Source directory (default: auto-detected) */
    sourceDir?: string;
    /** Additional directories to scan */
    additionalScanDirs?: string[];
  };
  /** CI/CD mode settings */
  ci?: {
    /** Whether to enable CI mode (default: auto-detect) */
    enabled?: boolean;
    /** Minimalist output (default: true in CI mode) */
    minimalistOutput?: boolean;
    /** Permissive thermal locks (default: true in CI mode) */
    permissiveThermalLock?: boolean;
    /** Maximum cooldown in CI mode (default: 5000ms) */
    maxCooldownMs?: number;
  };
  /** Performance settings */
  performance?: {
    /** Recommended batch size (default: auto-calculate) */
    recommendedBatchSize?: number;
    /** Recommended cooldown (default: auto-calculate) */
    recommendedCooldown?: number;
    /** Disable garbage collection (default: false) */
    disableGC?: boolean;
  };
}

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
export class ConfigLoader {
  private configPath: string;

  /**
   * Creates a new ConfigLoader instance
   *
   * @param projectRoot - Project root directory
   */
  constructor(projectRoot: string) {
    this.configPath = path.join(projectRoot, '.aegisrc.json');
  }

  /**
   * Loads configuration from .aegisrc.json
   *
   * @returns Loaded configuration with defaults merged
   */
  load(): LoadedConfig {
    const userConfig = this.loadUserConfig();
    const ciMode = this.detectCIMode();

    const config: LoadedConfig = {
      thermal: {
        cpuCriticalThreshold: userConfig.thermal?.cpuCriticalThreshold ?? 90,
        cpuWarningThreshold: userConfig.thermal?.cpuWarningThreshold ?? 80,
        ramCriticalThreshold: userConfig.thermal?.ramCriticalThreshold ?? 95,
        ramWarningThreshold: userConfig.thermal?.ramWarningThreshold ?? 90,
        gpuCriticalThreshold: userConfig.thermal?.gpuCriticalThreshold ?? 70,
        gpuWarningThreshold: userConfig.thermal?.gpuWarningThreshold ?? 60,
      },
      files: {
        maxFileSizeBytes: userConfig.files?.maxFileSizeBytes ?? 512000,
        allowedExtensions: userConfig.files?.allowedExtensions ?? [],
        blockedExtensions: userConfig.files?.blockedExtensions ?? [],
        blockedPatterns: userConfig.files?.blockedPatterns ?? [],
      },
      paths: {
        sourceDir: userConfig.paths?.sourceDir,
        additionalScanDirs: userConfig.paths?.additionalScanDirs ?? [],
      },
      ci: {
        enabled: userConfig.ci?.enabled ?? ciMode,
        minimalistOutput: userConfig.ci?.minimalistOutput ?? (userConfig.ci?.enabled ?? ciMode),
        permissiveThermalLock: userConfig.ci?.permissiveThermalLock ?? (userConfig.ci?.enabled ?? ciMode),
        maxCooldownMs: userConfig.ci?.maxCooldownMs ?? 5000,
      },
      performance: {
        recommendedBatchSize: userConfig.performance?.recommendedBatchSize,
        recommendedCooldown: userConfig.performance?.recommendedCooldown,
        disableGC: userConfig.performance?.disableGC ?? false,
      },
    };

    return config;
  }

  /**
   * Loads user configuration from .aegisrc.json
   *
   * @private
   * @returns User configuration or empty object if file doesn't exist
   */
  private loadUserConfig(): AegisConfig {
    try {
      if (!fs.existsSync(this.configPath)) {
        return {};
      }

      const content = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(content) as AegisConfig;

      // Validate configuration structure (basic validation)
      if (config.thermal && typeof config.thermal !== 'object') {
        console.warn('[ConfigLoader] Invalid thermal configuration, using defaults');
        delete config.thermal;
      }

      if (config.files && typeof config.files !== 'object') {
        console.warn('[ConfigLoader] Invalid files configuration, using defaults');
        delete config.files;
      }

      if (config.paths && typeof config.paths !== 'object') {
        console.warn('[ConfigLoader] Invalid paths configuration, using defaults');
        delete config.paths;
      }

      if (config.ci && typeof config.ci !== 'object') {
        console.warn('[ConfigLoader] Invalid CI configuration, using defaults');
        delete config.ci;
      }

      if (config.performance && typeof config.performance !== 'object') {
        console.warn('[ConfigLoader] Invalid performance configuration, using defaults');
        delete config.performance;
      }

      return config;
    } catch (error) {
      console.warn('[ConfigLoader] Failed to load .aegisrc.json:', error instanceof Error ? error.message : 'Unknown error');
      return {};
    }
  }

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
  private detectCIMode(): boolean {
    // Check explicit CI flag
    if (process.env.CI === 'true') {
      return true;
    }

    // Check common CI environment variables
    const ciVariables = [
      'CI',
      'GITHUB_ACTIONS',
      'GITLAB_CI',
      'TRAVIS',
      'JENKINS_URL',
      'BUILDKITE',
      'CIRCLECI',
    ];

    for (const variable of ciVariables) {
      if (process.env[variable] === 'true' || process.env[variable]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if CI mode is enabled
   *
   * @returns Whether CI mode is enabled
   */
  isCIMode(): boolean {
    return this.detectCIMode();
  }

  /**
   * Gets the configuration file path
   *
   * @returns Configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Checks if configuration file exists
   *
   * @returns Whether configuration file exists
   */
  configExists(): boolean {
    return fs.existsSync(this.configPath);
  }
}
