/**
 * Smart Config - Intelligent Configuration Based on Detected Stack
 *
 * Purpose: Generates intelligent default configuration based on the detected
 * technology stack to provide optimal out-of-the-box experience.
 *
 * @module core/smart-config
 * @since 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { StackDetector, type TechStack } from './stack-detector.js';

/**
 * Aegis configuration
 */
export interface AegisConfig {
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Phases to run */
  phases?: number[];
  /** Whether to skip thermal checks */
  skipThermal?: boolean;
  /** Whether to run in CI mode */
  ciMode?: boolean;
  /** Maximum phase timeout in milliseconds */
  phaseTimeoutMs?: number;
  /** Whether to enable memory flush */
  enableMemoryFlush?: boolean;
  /** Whether to enable partial reports */
  enablePartialReports?: boolean;
  /** Custom rules for specific frameworks */
  frameworkRules?: FrameworkRules;
}

/**
 * Framework-specific rules
 */
export interface FrameworkRules {
  /** React-specific rules */
  react?: ReactRules;
  /** Next.js-specific rules */
  nextjs?: NextJsRules;
  /** Vue-specific rules */
  vue?: VueRules;
  /** Angular-specific rules */
  angular?: AngularRules;
  /** Node.js-specific rules */
  node?: NodeRules;
}

export interface ReactRules {
  /** Check for accessibility issues */
  checkAccessibility?: boolean;
  /** Check for performance issues */
  checkPerformance?: boolean;
  /** Check for best practices */
  checkBestPractices?: boolean;
}

export interface NextJsRules {
  /** Check API routes */
  checkApiRoutes?: boolean;
  /** Check server components */
  checkServerComponents?: boolean;
  /** Check app directory structure */
  checkAppDir?: boolean;
}

export interface VueRules {
  /** Check for Vue 3 composition API usage */
  checkCompositionApi?: boolean;
  /** Check for TypeScript in Vue SFC */
  checkVueTypeScript?: boolean;
}

export interface AngularRules {
  /** Check for standalone components */
  checkStandaloneComponents?: boolean;
  /** Check for signals usage */
  checkSignals?: boolean;
}

export interface NodeRules {
  /** Check for async/await patterns */
  checkAsyncPatterns?: boolean;
  /** Check for error handling */
  checkErrorHandling?: boolean;
  /** Check for security best practices */
  checkSecurity?: boolean;
}

/**
 * SmartConfig - Intelligent configuration based on detected stack
 *
 * @class SmartConfig
 */
export class SmartConfig {
  private projectRoot: string;
  private stackDetector: StackDetector;
  private criticalConfigs: Set<string> = new Set([
    '.aegisrc.json',
    '.env',
    '.env.local',
    '.env.production',
    'tsconfig.json',
    'package.json',
    '.npmrc',
    '.gitignore',
  ]);

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.stackDetector = new StackDetector(projectRoot);
  }

  /**
   * Checks if a config file is critical
   *
   * @private
   * @param configPath - Path to config file
   * @returns boolean - True if config is critical
   */
  private isCriticalConfig(configPath: string): boolean {
    const basename = path.basename(configPath);
    return this.criticalConfigs.has(basename);
  }

  /**
   * Validates that overwriting a config is allowed
   *
   * @private
   * @param configPath - Path to config file
   * @param overwrite - Whether overwrite is requested
   * @returns boolean - True if overwrite is allowed
   */
  private validateOverwrite(configPath: string, overwrite: boolean): boolean {
    if (!fs.existsSync(configPath)) {
      return true; // File doesn't exist, no overwrite needed
    }

    if (!this.isCriticalConfig(configPath)) {
      return true; // Not a critical config, allow overwrite
    }

    if (overwrite) {
      console.warn(`[Security] Overwriting critical config: ${configPath}`);
      console.warn('[Security] Critical config overwrite requires explicit permission');
      return true;
    }

    console.error(`[Security] Cannot overwrite critical config without explicit permission: ${configPath}`);
    console.error('[Security] Use overwrite=true to explicitly allow overwriting critical configs');
    return false;
  }

  /**
   * Generates intelligent configuration based on detected stack
   *
   * @returns Promise<AegisConfig> - Generated configuration
   */
  async generateConfig(): Promise<AegisConfig> {
    const stack = await this.stackDetector.detect();
    const config: AegisConfig = {};

    console.log(`[SmartConfig] Detected stack: ${stack.framework || 'Vanilla ' + stack.language} (${stack.language})`);
    console.log(`[SmartConfig] Confidence: ${(stack.confidence * 100).toFixed(0)}%`);

    // Base configuration
    config.include = this.getIncludePatterns(stack);
    config.exclude = this.getExcludePatterns(stack);
    config.phases = this.getPhasesToRun(stack);
    config.phaseTimeoutMs = this.getPhaseTimeout(stack);
    config.enableMemoryFlush = true;
    config.enablePartialReports = true;

    // Framework-specific rules
    config.frameworkRules = this.getFrameworkRules(stack);

    // CI mode detection
    config.ciMode = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

    // Skip thermal in CI mode
    config.skipThermal = config.ciMode;

    return config;
  }

  /**
   * Gets include patterns based on stack
   *
   * @private
   * @param stack - Detected tech stack
   * @returns string[] - Include patterns
   */
  private getIncludePatterns(stack: TechStack): string[] {
    const patterns = ['**/*.{js,jsx,ts,tsx,json,md}'];

    if (stack.isTypeScript) {
      patterns.push('**/*.{ts,tsx}');
    }

    if (stack.framework === 'react' || stack.framework === 'next.js') {
      patterns.push('**/*.{jsx,tsx}');
    }

    if (stack.framework === 'vue') {
      patterns.push('**/*.vue');
    }

    return patterns;
  }

  /**
   * Gets exclude patterns based on stack
   *
   * @private
   * @param stack - Detected tech stack
   * @returns string[] - Exclude patterns
   */
  private getExcludePatterns(stack: TechStack): string[] {
    const patterns = [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.git/**',
      '.aegis-cache/**',
      '**/*.min.js',
      '**/*.min.css',
      '**/coverage/**',
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
    ];

    // Framework-specific excludes
    if (stack.framework === 'next.js') {
      patterns.push('.next/**');
      patterns.push('out/**');
    }

    if (stack.framework === 'react' && stack.buildTool === 'vite') {
      patterns.push('.vite/**');
    }

    if (stack.isMonorepo) {
      patterns.push('packages/**/node_modules/**');
    }

    return patterns;
  }

  /**
   * Gets phases to run based on stack
   *
   * @private
   * @param stack - Detected tech stack
   * @returns number[] - Phases to run
   */
  private getPhasesToRun(stack: TechStack): number[] {
    // Default phases (all phases 0-15)
    const phases = Array.from({ length: 16 }, (_, i) => i);

    // Skip phases based on stack
    if (!stack.isTypeScript) {
      // Skip TypeScript-specific phases
      return phases.filter(p => p !== 1); // Skip Code Quality (Phase 1)
    }

    if (!stack.database) {
      // Skip Database phase if no database detected
      return phases.filter(p => p !== 4);
    }

    return phases;
  }

  /**
   * Gets phase timeout based on stack complexity
   *
   * @private
   * @param stack - Detected tech stack
   * @returns number - Phase timeout in milliseconds
   */
  private getPhaseTimeout(stack: TechStack): number {
    // Longer timeout for monorepos
    if (stack.isMonorepo) {
      return 600000; // 10 minutes
    }

    // Longer timeout for complex frameworks
    if (stack.framework === 'next.js' || stack.framework === 'angular') {
      return 450000; // 7.5 minutes
    }

    return 300000; // 5 minutes default
  }

  /**
   * Gets framework-specific rules
   *
   * @private
   * @param stack - Detected tech stack
   * @returns FrameworkRules - Framework-specific rules
   */
  private getFrameworkRules(stack: TechStack): FrameworkRules {
    const rules: FrameworkRules = {};

    if (stack.framework === 'react') {
      rules.react = {
        checkAccessibility: true,
        checkPerformance: true,
        checkBestPractices: true,
      };
    }

    if (stack.framework === 'next.js') {
      rules.nextjs = {
        checkApiRoutes: true,
        checkServerComponents: true,
        checkAppDir: true,
      };
      rules.react = {
        checkAccessibility: true,
        checkPerformance: true,
        checkBestPractices: true,
      };
    }

    if (stack.framework === 'vue') {
      rules.vue = {
        checkCompositionApi: stack.language === 'typescript',
        checkVueTypeScript: stack.isTypeScript,
      };
    }

    if (stack.framework === 'angular') {
      rules.angular = {
        checkStandaloneComponents: true,
        checkSignals: true,
      };
    }

    if (stack.backendFramework) {
      rules.node = {
        checkAsyncPatterns: true,
        checkErrorHandling: true,
        checkSecurity: true,
      };
    }

    return rules;
  }

  /**
   * Writes configuration to .aegisrc.json
   *
   * @param config - Configuration to write
   * @param overwrite - Whether to overwrite existing critical config
   * @returns Promise<void>
   */
  async writeConfig(config: AegisConfig, overwrite: boolean = false): Promise<void> {
    const configPath = path.join(this.projectRoot, '.aegisrc.json');

    // Validate overwrite permission for critical configs
    if (!this.validateOverwrite(configPath, overwrite)) {
      throw new Error(`[Security] Critical config overwrite denied for ${configPath}`);
    }

    try {
      await fs.promises.writeFile(
        configPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
      console.log(`[SmartConfig] Configuration written to ${configPath}`);
    } catch (error) {
      console.error('[SmartConfig] Failed to write configuration:', error);
      throw error;
    }
  }

  /**
   * Reads existing .aegisrc.json if it exists
   *
   * @returns Promise<AegisConfig | null> - Existing configuration or null
   */
  async readConfig(): Promise<AegisConfig | null> {
    const configPath = path.join(this.projectRoot, '.aegisrc.json');

    try {
      if (!fs.existsSync(configPath)) {
        return null;
      }

      const content = await fs.promises.readFile(configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('[SmartConfig] Failed to read existing configuration:', error);
      return null;
    }
  }

  /**
   * Merges generated config with existing config
   *
   * @param generated - Generated configuration
   * @param existing - Existing configuration
   * @returns AegisConfig - Merged configuration
   */
  mergeConfigs(generated: AegisConfig, existing: AegisConfig): AegisConfig {
    return {
      ...generated,
      ...existing,
      frameworkRules: {
        ...generated.frameworkRules,
        ...existing.frameworkRules,
      },
    };
  }

  /**
   * Initializes smart configuration
   *
   * @param overwrite - Whether to overwrite existing config
   * @returns Promise<AegisConfig> - Final configuration
   */
  async initialize(overwrite: boolean = false): Promise<AegisConfig> {
    console.log('[SmartConfig] Initializing intelligent configuration...\n');

    const existingConfig = await this.readConfig();
    const generatedConfig = await this.generateConfig();

    let finalConfig: AegisConfig;

    if (existingConfig && !overwrite) {
      console.log('[SmartConfig] Existing configuration found, merging...');
      finalConfig = this.mergeConfigs(generatedConfig, existingConfig);
    } else {
      console.log('[SmartConfig] Using generated configuration...');
      finalConfig = generatedConfig;
    }

    await this.writeConfig(finalConfig, overwrite);

    console.log('[SmartConfig] Configuration initialized successfully\n');

    return finalConfig;
  }
}
